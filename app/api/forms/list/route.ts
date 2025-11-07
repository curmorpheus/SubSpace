import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { desc, eq, or, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { rateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import { logUnauthorizedAccess, logRateLimitExceeded } from "@/lib/security-logger";

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || undefined;

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, ip, RateLimits.API);

    if (!rateLimitResult.success) {
      logRateLimitExceeded(ip, "/api/forms/list", userAgent);

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
      logUnauthorizedAccess(ip, "/api/forms/list", userAgent);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's email from the session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    // Filter submissions by superintendent email
    // Include submissions where:
    // 1. superintendentEmail matches the user's email
    // 2. superintendentEmail is null (legacy data before tracking was implemented)
    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(
        or(
          eq(formSubmissions.superintendentEmail, userEmail),
          isNull(formSubmissions.superintendentEmail)
        )
      )
      .orderBy(desc(formSubmissions.submittedAt));

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
