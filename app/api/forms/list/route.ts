import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { desc } from "drizzle-orm";
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

    // All authenticated superintendents can access forms
    // (both local and Procore authenticated users)

    // Fetch all form submissions, ordered by most recent first
    const submissions = await db
      .select()
      .from(formSubmissions)
      .orderBy(desc(formSubmissions.submittedAt));

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
