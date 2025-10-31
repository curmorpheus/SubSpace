import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { cookies } from "next/headers";

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
    // Check authentication
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    if (!authToken || authToken.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subcontractorName, subcontractorEmail, subcontractorCompany, personalNote } = body;

    if (!subcontractorName || !subcontractorEmail || !subcontractorCompany) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate the form URL with pre-filled subcontractor info
    const formUrl = new URL("/forms/impalement-protection", req.nextUrl.origin);
    formUrl.searchParams.set("name", subcontractorName);
    formUrl.searchParams.set("email", subcontractorEmail);
    formUrl.searchParams.set("company", subcontractorCompany);

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

              ${
                personalNote
                  ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; color: #78350f; line-height: 1.6;">
                  ${personalNote.replace(/\n/g, "<br>")}
                </p>
              </div>
              `
                  : ""
              }

              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                We're inviting <strong>${subcontractorCompany}</strong> to participate in our <strong>Impalement Protection Safety Program</strong>.
                Your participation helps us maintain the highest safety standards on our job sites.
              </p>

              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #166534;">
                  📋 What's This About?
                </h2>
                <p style="margin: 0; font-size: 15px; color: #166534; line-height: 1.6;">
                  The Impalement Protection Form helps us identify and correct hazards related to exposed rebar, stakes,
                  and other sharp objects on construction sites. It's quick, easy, and can be completed right from your phone.
                </p>
              </div>

              <h2 style="margin: 24px 0 12px; font-size: 18px; font-weight: 600; color: #1f2937;">
                ✅ Getting Started
              </h2>
              <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 15px; color: #374151; line-height: 1.8;">
                <li>Click the button below to access the form</li>
                <li>Your information is pre-filled for convenience</li>
                <li>Complete inspections as needed on site</li>
                <li>Submit forms with photos and details</li>
                <li>Reports are automatically emailed to the superintendent</li>
              </ul>

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

              <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
                  <strong>💡 Pro Tip:</strong> Bookmark this link for quick access, or save it to your phone's home screen for easy one-tap access.
                </p>
              </div>

              <p style="margin: 24px 0 0; font-size: 15px; color: #374151; line-height: 1.6;">
                Questions? Just reply to this email and we'll be happy to help!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1f2937;">
                DEACON Construction
              </p>
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                Committed to safety excellence on every job site
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer Note -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              This invitation was sent on behalf of DEACON Construction.<br>
              If you believe you received this in error, please contact us.
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

${personalNote ? `${personalNote}\n\n` : ""}

We're inviting ${subcontractorCompany} to participate in our Impalement Protection Safety Program. Your participation helps us maintain the highest safety standards on our job sites.

WHAT'S THIS ABOUT?
The Impalement Protection Form helps us identify and correct hazards related to exposed rebar, stakes, and other sharp objects on construction sites. It's quick, easy, and can be completed right from your phone.

GETTING STARTED:
- Access the form using this link: ${formUrl.toString()}
- Your information is pre-filled for convenience
- Complete inspections as needed on site
- Submit forms with photos and details
- Reports are automatically emailed to the superintendent

PRO TIP: Bookmark this link for quick access, or save it to your phone's home screen for easy one-tap access.

Questions? Just reply to this email and we'll be happy to help!

---
DEACON Construction
Committed to safety excellence on every job site
    `;

    // Send the email using Resend
    await resend.emails.send({
      from: "SubSpace <noreply@deacon.build>",
      to: subcontractorEmail,
      subject: `Invitation: Join Our Impalement Protection Safety Program`,
      text: textContent,
      html: htmlContent,
    });

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
