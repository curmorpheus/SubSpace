import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { rateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import { logUnauthorizedAccess, logRateLimitExceeded } from "@/lib/security-logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || undefined;

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, ip, RateLimits.API);

    if (!rateLimitResult.success) {
      logRateLimitExceeded(ip, "/api/forms/[id]/review", userAgent);

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            ),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
      );
    }

    // NextAuth authentication check
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess(ip, "/api/forms/[id]/review", userAgent);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    // Parse request body
    const { reviewed } = await request.json();

    if (typeof reviewed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid reviewed status" },
        { status: 400 }
      );
    }

    const submissionId = parseInt(params.id);

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    // First, verify this submission belongs to the user
    const [submission] = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if the user is authorized to review this submission
    if (
      submission.superintendentEmail &&
      submission.superintendentEmail !== userEmail
    ) {
      logUnauthorizedAccess(ip, `/api/forms/${submissionId}/review`, userAgent);
      return NextResponse.json(
        { error: "Not authorized to review this submission" },
        { status: 403 }
      );
    }

    // Update the reviewed status
    const [updatedSubmission] = await db
      .update(formSubmissions)
      .set({
        reviewed,
        reviewedAt: reviewed ? new Date() : null,
        reviewedBy: reviewed ? userEmail : null,
      })
      .where(eq(formSubmissions.id, submissionId))
      .returning();

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Error updating review status:", error);
    return NextResponse.json(
      { error: "Failed to update review status" },
      { status: 500 }
    );
  }
}
