import { NextRequest, NextResponse } from "next/server";
import { createJWT, verifyAdminPassword } from "@/lib/auth";
import { rateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validation";
import { logAuthAttempt, logRateLimitExceeded } from "@/lib/security-logger";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || undefined;

  try {
    // Rate limiting - very strict for auth endpoints
    const rateLimitResult = rateLimit(request, ip, RateLimits.AUTH);

    if (!rateLimitResult.success) {
      logRateLimitExceeded(ip, "/api/auth/login", userAgent);

      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
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

    // Parse and validate request body
    const body = await request.json();
    const validation = adminLoginSchema.safeParse(body);

    if (!validation.success) {
      logAuthAttempt(false, ip, userAgent, {
        reason: "validation_failed",
        errors: validation.error.flatten(),
      });

      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // Verify admin password
    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      logAuthAttempt(false, ip, userAgent, { reason: "invalid_password" });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createJWT({
      userId: "admin",
      email: "admin@subspace.local",
      role: "admin",
    });

    logAuthAttempt(true, ip, userAgent);

    // Create response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully",
    });

    // Set httpOnly, secure cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    logAuthAttempt(false, ip, userAgent, { reason: "server_error" });

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
