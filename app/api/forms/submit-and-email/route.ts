import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { formSubmissions } from "@/db/schema";
import { generateImpalementProtectionPDF } from "@/lib/pdf-generator";

// Lazy-initialize Resend to avoid build-time validation errors
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      formType,
      jobNumber,
      submittedBy,
      submittedByEmail,
      submittedByCompany,
      data,
      signature,
      emailOptions,
    } = body;

    // Validate required fields
    if (!formType || !jobNumber || !submittedBy || !submittedByEmail || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!emailOptions || !emailOptions.recipientEmail) {
      return NextResponse.json(
        { error: "Email recipient is required" },
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

      await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "forms@subspace.dev",
        to: emailOptions.recipientEmail,
        subject: emailSubject,
        html: `
          <h2>Impalement Protection Inspection Form</h2>
          <p>A new impalement protection inspection form has been submitted.</p>

          <h3>Details:</h3>
          <ul>
            <li><strong>Job Number:</strong> ${jobNumber}</li>
            <li><strong>Submitted By:</strong> ${submittedBy}</li>
            <li><strong>Company:</strong> ${submittedByCompany}</li>
            <li><strong>Date:</strong> ${data.date}</li>
            <li><strong>Number of Inspections:</strong> ${data.inspections.length}</li>
          </ul>

          <p>The complete form is attached as a PDF.</p>

          <hr />
          <p style="color: #666; font-size: 12px;">
            This form was submitted via SubSpace on ${new Date().toLocaleString()}
          </p>
        `,
        attachments: [
          {
            filename: `Impalement_Protection_Form_${jobNumber}_${Date.now()}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      return NextResponse.json({
        success: true,
        id: submission.id,
        message: "Form submitted and emailed successfully",
        emailSent: true,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);

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
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
