import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { generateImpalementProtectionPDF } from "@/lib/pdf-generator";
import { rateLimit, getClientIP, RateLimits } from "@/lib/rate-limit";
import {
  formSubmissionSchema,
  signatureSchema,
  validateEmailAllowlist,
} from "@/lib/validation";
import { createSafeEmailHtml } from "@/lib/sanitize";
import {
  logFormSubmission,
  logEmailSent,
  logRateLimitExceeded,
  logValidationError,
} from "@/lib/security-logger";

// Lazy-initialize Resend to avoid build-time validation errors
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || undefined;

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, ip, RateLimits.FORM_SUBMIT);

    if (!rateLimitResult.success) {
      logRateLimitExceeded(ip, "/api/forms/submit-and-email", userAgent);

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
          "/api/forms/submit-and-email",
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
        "/api/forms/submit-and-email",
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
      emailOptions,
    } = validation.data;

    // Validate required email options
    if (!emailOptions || !emailOptions.recipientEmail) {
      return NextResponse.json(
        { error: "Email recipient is required" },
        { status: 400 }
      );
    }

    // Validate email against allowlist
    const emailValidation = validateEmailAllowlist(
      emailOptions.recipientEmail
    );

    if (!emailValidation.valid) {
      logValidationError(
        ip,
        "/api/forms/submit-and-email",
        { email: emailValidation.error },
        userAgent
      );

      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

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

    // Generate PDF
    const pdfBuffer = generateImpalementProtectionPDF(
      {
        jobNumber,
        submittedBy,
        submittedByEmail,
        submittedByCompany,
        submittedAt: submission.submittedAt.toISOString(),
      },
      { ...data, signature }
    );

    // Send email with PDF attachment
    const emailSubject =
      emailOptions.emailSubject ||
      `Impalement Protection Inspection Form - Job #${jobNumber}`;

    try {
      const resendClient = getResendClient();
      if (!resendClient) {
        throw new Error("Resend client not configured. Please set RESEND_API_KEY environment variable.");
      }

      // Create safe HTML email with sanitized user input
      const emailHtmlTemplate = `
        <h2>Impalement Protection Inspection Form</h2>
        <p>A new impalement protection inspection form has been submitted.</p>

        <h3>Details:</h3>
        <ul>
          <li><strong>Job Number:</strong> {{jobNumber}}</li>
          <li><strong>Submitted By:</strong> {{submittedBy}}</li>
          <li><strong>Company:</strong> {{submittedByCompany}}</li>
          <li><strong>Date:</strong> {{date}}</li>
          <li><strong>Number of Inspections:</strong> {{inspectionCount}}</li>
        </ul>

        <p>The complete form is attached as a PDF.</p>

        <hr />
        <p style="color: #666; font-size: 12px;">
          This form was submitted via SubSpace on {{submissionTime}}
        </p>
      `;

      const safeEmailHtml = createSafeEmailHtml(emailHtmlTemplate, {
        jobNumber,
        submittedBy,
        submittedByCompany,
        date: data.date,
        inspectionCount: String(data.inspections.length),
        submissionTime: new Date().toLocaleString(),
      });

      await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "forms@subspace.dev",
        to: emailOptions.recipientEmail,
        subject: emailSubject,
        html: safeEmailHtml,
        attachments: [
          {
            filename: `Impalement_Protection_Form_${jobNumber}_${Date.now()}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      logEmailSent(ip, emailOptions.recipientEmail, true, userAgent);
      logFormSubmission(ip, formType, jobNumber, true, userAgent);

      return NextResponse.json({
        success: true,
        id: submission.id,
        message: "Form submitted and emailed successfully",
        emailSent: true,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);

      logEmailSent(ip, emailOptions.recipientEmail, false, userAgent);

      // Form was saved, but email failed
      return NextResponse.json({
        success: true,
        id: submission.id,
        message: "Form submitted but email failed to send",
        emailSent: false,
        error: "Email sending failed",
      });
    }
  } catch (error) {
    console.error("Error submitting form:", error);

    logFormSubmission(ip, "unknown", "unknown", false, userAgent);

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
