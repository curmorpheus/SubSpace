import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/auth";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // Check NextAuth authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subcontractorName, subcontractorEmail, subcontractorCompany, jobNumber, superintendentEmail, projectEmail, personalNote } = body;

    if (!subcontractorName || !subcontractorEmail || !subcontractorCompany || !jobNumber || !superintendentEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get superintendent name from session
    const superintendentName = session.user?.name || "Your Superintendent";

    // Generate the form URL with pre-filled subcontractor info
    const formUrl = new URL("/forms/impalement-protection", req.nextUrl.origin);
    formUrl.searchParams.set("name", subcontractorName);
    formUrl.searchParams.set("email", subcontractorEmail);
    formUrl.searchParams.set("company", subcontractorCompany);
    formUrl.searchParams.set("jobNumber", jobNumber);
    formUrl.searchParams.set("superintendentEmail", superintendentEmail);
    if (projectEmail) {
      formUrl.searchParams.set("projectEmail", projectEmail);
    }

    // Create beautiful HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Participate in Impalement Protection Inspections</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Orange Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 3px 0;">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1f2937; line-height: 1.3;">
                You're Invited to Participate
              </h1>
              <p style="margin: 8px 0 0; font-size: 16px; color: #6b7280;">
                Impalement Protection Safety Program
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hello <strong>${subcontractorName}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                We're inviting <strong>${subcontractorCompany}</strong> to participate in our <strong>Impalement Protection Safety Program</strong>.
                Your participation helps us maintain the highest safety standards on our job sites.
              </p>

              ${
                personalNote
                  ? `
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #6b7280;">
                  Message from ${superintendentName}
                </p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
                  <p style="margin: 0; font-size: 15px; color: #78350f; line-height: 1.6;">
                    ${personalNote.replace(/\n/g, "<br>")}
                  </p>
                </div>
              </div>
              `
                  : ""
              }

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${formUrl.toString()}"
                       style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                      🚀 Access Impalement Protection Form
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Hello ${subcontractorName},

We're inviting ${subcontractorCompany} to participate in our Impalement Protection Safety Program. Your participation helps us maintain the highest safety standards on our job sites.

${personalNote ? `Message from ${superintendentName}\n${personalNote}\n\n` : ""}
Access the form using this link: ${formUrl.toString()}
    `;

    // Send the email using Resend
    const emailData: any = {
      from: "SubSpace <noreply@deacon.build>",
      to: subcontractorEmail,
      subject: `Invitation: Join Our Impalement Protection Safety Program`,
      text: textContent,
      html: htmlContent,
    };

    // Add project email to BCC if available
    if (projectEmail) {
      emailData.bcc = [projectEmail];
    }

    await resend.emails.send(emailData);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
