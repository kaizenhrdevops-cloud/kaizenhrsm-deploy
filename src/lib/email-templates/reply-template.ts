// src/lib/email-templates/reply-template.ts

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ReplyEmailData {
  contactName: string;
  contactEmail: string;
  replyMessage: string;
  adminName: string;
  originalMessage: string;
}

export const replyEmailTemplate = (data: ReplyEmailData) => {
  const contactName = escapeHtml(data.contactName);
  const replyMessage = escapeHtml(data.replyMessage);
  const adminName = escapeHtml(data.adminName);
  const originalMessage = escapeHtml(data.originalMessage);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reply from KaizenHR</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">KaizenHR</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Response to Your Inquiry</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong style="color: #1f2937;">${contactName}</strong>,
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for reaching out to KaizenHR. We appreciate your interest in our HR management solutions.
              </p>

              <!-- Reply Message -->
              <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
                <p style="color: #1f2937; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${replyMessage}</p>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                If you have any further questions or need additional information, please don't hesitate to reach out. We're here to help!
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="mailto:inquiry@kaizenhrms.com" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Contact Us</a>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
                Best regards,<br>
                <strong style="color: #1f2937;">${adminName}</strong><br>
                <span style="color: #6b7280;">KaizenHR Team</span>
              </p>
            </td>
          </tr>

          <!-- Original Message Reference -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">
                Your Original Message:
              </p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                "${originalMessage}"
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">
                <strong>KaizenHR Sdn Bhd</strong>
              </p>
              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                Suite D-05-01, 5th Floor, Block D, Plaza Mont Kiara<br>
                50480 Kuala Lumpur, Malaysia
              </p>
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                Phone: +603-62010242 | Email: inquiry@kaizenhrms.com
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} KaizenHR. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
