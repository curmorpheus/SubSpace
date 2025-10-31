import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { rateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import { formSubmissionSchema, signatureSchema } from "@/lib/validation";
import {
  logFormSubmission,
  logRateLimitExceeded,
  logValidationError,
} from "@/lib/security-logger";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || undefined;

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, ip, RateLimits.FORM_SUBMIT);

    if (!rateLimitResult.success) {
      logRateLimitExceeded(ip, "/api/forms/submit", userAgent);

      return NextResponse.json(
        {
          error: "Too many form submissions. Please try again later.",
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

    // Parse request body
    const body = await request.json();

    // Validate signature separately (if provided)
    if (body.signature) {
      const sigValidation = signatureSchema.safeParse(body.signature);
      if (!sigValidation.success) {
        logValidationError(
          ip,
          "/api/forms/submit",
          sigValidation.error.flatten(),
          userAgent
        );

        return NextResponse.json(
          {
            error: "Invalid signature data",
            details: sigValidation.error.flatten(),
          },
          { status: 400 }
        );
      }
    }

    // Validate form submission data
    const validation = formSubmissionSchema.safeParse(body);

    if (!validation.success) {
      logValidationError(
        ip,
        "/api/forms/submit",
        validation.error.flatten(),
        userAgent
      );

      return NextResponse.json(
        {
          error: "Invalid form data",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      formType,
      jobNumber,
      submittedBy,
      submittedByEmail,
      submittedByCompany,
      data,
      signature,
    } = validation.data;

    // For now, we'll use formTypeId: 1 for impalement-protection
    const formTypeId = 1;

    // Insert the form submission (including signature in data)
    const submissionData = { ...data, signature };

    const [submission] = await db
      .insert(formSubmissions)
      .values({
        formTypeId,
        jobNumber,
        submittedBy,
        submittedByEmail,
        submittedByCompany,
        data: submissionData,
      })
      .returning();

    logFormSubmission(ip, formType, jobNumber, true, userAgent);

    return NextResponse.json({
      success: true,
      id: submission.id,
      message: "Form submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting form:", error);

    logFormSubmission(ip, "unknown", "unknown", false, userAgent);

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
