import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { generateBuckSandersPDF } from "@/lib/pdf-generator";
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
import { uploadImagesToBlob } from "@/lib/blob-storage";

// Configure runtime for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy-initialize Resend to avoid build-time validation errors
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

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
      submittedAtLocal,
      data,
      signature,
      emailOptions,
    } = validation.data;

    // If email options provided, validate email
    if (emailOptions && emailOptions.recipientEmail) {
      const emailValidation = validateEmailAllowlist(
        emailOptions.recipientEmail
      );

      if (!emailValidation.valid) {
        logValidationError(
          ip,
          "/api/forms/submit",
          { email: emailValidation.error },
          userAgent
        );

        return NextResponse.json(
          { error: emailValidation.error },
          { status: 400 }
        );
      }
    }

    // For now, we'll use formTypeId: 1 for impalement-protection
    const formTypeId = 1;

    // Upload photos to Vercel Blob storage before saving to database
    console.log("Uploading photos to Vercel Blob...");

    // Process Buck Sanders inspection data structure
    const processedData = { ...data };

    // Upload site photos if they exist
    if (data.inspectionItems?.sitePhotos && data.inspectionItems.sitePhotos.length > 0) {
      try {
        const siteBlobPhotos = await uploadImagesToBlob(
          data.inspectionItems.sitePhotos,
          `${jobNumber}/site-photos`
        );
        processedData.inspectionItems = {
          ...processedData.inspectionItems,
          sitePhotos: siteBlobPhotos,
        };
        console.log("Site photos uploaded to Vercel Blob");
      } catch (error) {
        console.error("Error uploading site photos:", error);
        // Keep original photos if upload fails
      }
    } else {
      console.log("No site photos to upload");
    }

    // Add local submission time
    processedData.submittedAtLocal = submittedAtLocal;

    // Insert the form submission (including signature in data)
    const submissionData = { ...processedData, signature };

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

    // If email options provided, send email with PDF
    console.log("Email options:", emailOptions);
    if (emailOptions && emailOptions.recipientEmail) {
      console.log("Starting email send process...");
      try {
        console.log("Generating PDF...");
        // Generate PDF using original base64 data (still in memory)
        // Use local device time if provided, otherwise fall back to database time
        const pdfBuffer = generateBuckSandersPDF(
          {
            jobNumber,
            submittedBy,
            submittedByEmail,
            submittedByCompany,
            submittedAt: submittedAtLocal || submission.submittedAt.toISOString(),
          },
          { ...data, signature }
        );
        console.log("PDF generated, size:", pdfBuffer.length);

        // Store PDF in database (as base64)
        const pdfBase64 = pdfBuffer.toString("base64");
        await db
          .update(formSubmissions)
          .set({ pdfData: pdfBase64 })
          .where(eq(formSubmissions.id, submission.id));
        console.log("PDF stored in database");

        // Send email with PDF attachment
        const emailSubject =
          emailOptions.emailSubject ||
          `Impalement Protection Inspection Form - Job #${jobNumber}`;

        if (process.env.NODE_ENV === 'development') {
          console.log("Getting Resend client...");
        }
        const resendClient = getResendClient();
        if (!resendClient) {
          throw new Error(
            "Resend client not configured. Please set RESEND_API_KEY environment variable."
          );
        }

        // Create safe HTML email with sanitized user input
        // Build inspections HTML for all inspections
        const inspectionsHtml = data.inspections.map((inspection: any, index: number) => {
          const escapedInspection = {
            startTime: createSafeEmailHtml('{{value}}', { value: inspection.startTime }),
            endTime: createSafeEmailHtml('{{value}}', { value: inspection.endTime }),
            location: createSafeEmailHtml('{{value}}', { value: inspection.location }),
            hazardDescription: createSafeEmailHtml('{{value}}', { value: inspection.hazardDescription }),
            correctiveMeasures: createSafeEmailHtml('{{value}}', { value: inspection.correctiveMeasures }),
            creatingEmployer: createSafeEmailHtml('{{value}}', { value: inspection.creatingEmployer }),
            supervisor: createSafeEmailHtml('{{value}}', { value: inspection.supervisor }),
          };

          return `
                <div class="section">
                  <h2 class="section-title">Inspection #${index + 1}${data.inspections.length > 1 ? ` of ${data.inspections.length}` : ''}</h2>

                  <div style="margin-bottom: 15px;">
                    <span class="time-badge">⏰ Start: ${escapedInspection.startTime}</span>
                    <span class="time-badge">⏱️ End: ${escapedInspection.endTime}</span>
                  </div>

                  <div class="field-box">
                    <div class="field-label">📍 Location of Inspection</div>
                    <div class="field-value">${escapedInspection.location}</div>
                  </div>

                  <div class="field-box">
                    <div class="field-label">⚠️ Description of Impalement Hazard Observed</div>
                    <div class="field-value">${escapedInspection.hazardDescription}</div>
                  </div>

                  <div class="field-box">
                    <div class="field-label">✅ Corrective Measures Taken</div>
                    <div class="field-value">${escapedInspection.correctiveMeasures}</div>
                  </div>

                  <div class="field-box">
                    <div class="field-label">🏢 Creating/Exposing Employer(s)</div>
                    <div class="field-value">${escapedInspection.creatingEmployer}</div>
                  </div>

                  <div class="field-box">
                    <div class="field-label">👷 Supervisor of Creating/Exposing Employer(s)</div>
                    <div class="field-value">${escapedInspection.supervisor}</div>
                  </div>
                </div>
          `;
        }).join('');

        const emailHtmlTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
              .header p { color: #fed7aa; margin: 0; font-size: 16px; }
              .content { padding: 30px; }
              .section { margin-bottom: 30px; }
              .section-title { color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #f97316; }
              .info-grid { display: table; width: 100%; margin-bottom: 20px; }
              .info-row { display: table-row; }
              .info-label { display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; width: 40%; }
              .info-value { display: table-cell; padding: 8px 0; color: #1f2937; font-size: 14px; }
              .field-box { background-color: #f9fafb; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
              .field-label { color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
              .field-value { color: #1f2937; font-size: 15px; line-height: 1.6; white-space: pre-wrap; }
              .time-badge { display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-right: 10px; }
              .attachment-notice { background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; text-align: center; margin-top: 30px; }
              .attachment-notice p { margin: 0; color: #78350f; font-size: 14px; }
              .footer { background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
              .footer p { margin: 5px 0; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>IMPALEMENT PROTECTION</h1>
                <p>Safety Inspection Form</p>
              </div>

              <div class="content">
                <div class="section">
                  <h2 class="section-title">Form Information</h2>
                  <div class="info-grid">
                    <div class="info-row">
                      <div class="info-label">Job Number:</div>
                      <div class="info-value"><strong>{{jobNumber}}</strong></div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Inspection Date:</div>
                      <div class="info-value">{{date}}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Submitted By:</div>
                      <div class="info-value">{{submittedBy}}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Company:</div>
                      <div class="info-value">{{submittedByCompany}}</div>
                    </div>
                    <div class="info-row">
                      <div class="info-label">Email:</div>
                      <div class="info-value">{{submittedByEmail}}</div>
                    </div>
                  </div>
                </div>

                {{inspectionsHtml}}

                <div class="attachment-notice">
                  <p><strong>📎 Complete PDF Report Attached</strong></p>
                  <p>The full inspection form with all photos and details is attached to this email.</p>
                </div>
              </div>

              <div class="footer">
                <p><strong>SubSpace</strong> - Construction Form Management</p>
                <p>Submitted on {{submissionTime}}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const safeEmailHtml = createSafeEmailHtml(emailHtmlTemplate, {
          jobNumber,
          submittedBy,
          submittedByCompany,
          submittedByEmail,
          date: data.date,
          inspectionsHtml,
          submissionTime: new Date().toLocaleString(),
        });

        // Use env var now that newline is fixed
        const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

        if (process.env.NODE_ENV === 'development') {
          console.log("Email - To:", emailOptions.recipientEmail);
          console.log("Email - Subject:", emailSubject);
        }

        // Parse CC emails if provided
        const ccEmails = emailOptions.ccEmails
          ? emailOptions.ccEmails.split(',').map((email: string) => email.trim()).filter(Boolean)
          : [];

        const emailPayload: any = {
          from: fromEmail,
          to: emailOptions.recipientEmail,
          subject: emailSubject,
          html: safeEmailHtml,
          attachments: [
            {
              filename: `Impalement_Protection_Form_${jobNumber}_${Date.now()}.pdf`,
              content: pdfBuffer.toString("base64"),
            },
          ],
        };

        // Add CC if provided
        if (ccEmails.length > 0) {
          emailPayload.cc = ccEmails;
        }

        // Add project email to BCC if provided
        if (emailOptions.projectEmail) {
          emailPayload.bcc = [emailOptions.projectEmail];
        }

        console.log("Email payload (without html/attachments):", {
          from: emailPayload.from,
          to: emailPayload.to,
          cc: emailPayload.cc,
          bcc: emailPayload.bcc,
          subject: emailPayload.subject,
        });

        const emailResult = await resendClient.emails.send(emailPayload);

        console.log("Email sent successfully! Result:", emailResult);
        logEmailSent(ip, emailOptions.recipientEmail, true, userAgent);

        return NextResponse.json({
          success: true,
          id: submission.id,
          message: "Form submitted and emailed successfully",
          emailSent: true,
        });
      } catch (emailError) {
        console.error("!!! EMAIL ERROR !!!");
        console.error("Error sending email:", emailError);
        console.error("Error details:", JSON.stringify(emailError, null, 2));

        logEmailSent(
          ip,
          emailOptions.recipientEmail,
          false,
          userAgent
        );

        // Form was saved, but email failed
        return NextResponse.json({
          success: true,
          id: submission.id,
          message: "Form submitted but email failed to send",
          emailSent: false,
          error: "Email sending failed",
        });
      }
    }

    // No email requested, just return success
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
