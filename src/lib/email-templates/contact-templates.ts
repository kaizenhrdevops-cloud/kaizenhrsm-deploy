// src/lib/email-templates/contact-templates.ts

export interface ContactFormData {
  fullName: string;
  contactNumber: string;
  company: string;
  email: string;
  companySize: string;
  message: string;
}

/**
 * Escapes special HTML characters in user-supplied strings to prevent
 * HTML injection and email-based phishing attacks.
 */
function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// User Confirmation Email Template
export const userConfirmationTemplate = (data: ContactFormData) => {
  const safeFullName = escapeHtml(data.fullName);
  const safeCompany = escapeHtml(data.company);
  const safeCompanySize = escapeHtml(data.companySize);
  const safeContactNumber = escapeHtml(data.contactNumber);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting KaizenHR</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">KaizenHR</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Transform Your HR Management</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Thank You for Reaching Out!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong style="color: #1f2937;">${safeFullName}</strong>,
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We've received your inquiry and truly appreciate you taking the time to connect with us. Our team at KaizenHR is excited to learn more about your HR needs.
              </p>

              <!-- Summary Box -->
              <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 6px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Your Submission Details:</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0; width: 140px;">Company:</td>
                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0; font-weight: 500;">${safeCompany}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Company Size:</td>
                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0; font-weight: 500;">${safeCompanySize} employees</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Contact Number:</td>
                    <td style="color: #1f2937; font-size: 14px; padding: 8px 0; font-weight: 500;">${safeContactNumber}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong style="color: #1f2937;">What happens next?</strong><br>
                Our team will review your inquiry and get back to you within 1-2 business days. We'll reach out via email or phone to discuss how KaizenHR can help streamline your HR operations.
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                In the meantime, feel free to explore our website to learn more about our features and how we're helping businesses like yours succeed.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Visit Our Website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                <strong style="color: #1f2937;">KaizenHR Sdn Bhd</strong>
              </p>
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                Suite D-05-01, 5th Floor, Block D, Plaza Mont Kiara<br>
                50480 Kuala Lumpur, Malaysia<br>
                Phone: +603-62010242 | Email: inquiry@kaizenhrms.com
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
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

// Admin Notification Email Template
export const adminNotificationTemplate = (data: ContactFormData) => {
  const safeFullName = escapeHtml(data.fullName);
  const safeEmail = escapeHtml(data.email);
  const safeCompany = escapeHtml(data.company);
  const safeCompanySize = escapeHtml(data.companySize);
  const safeContactNumber = escapeHtml(data.contactNumber);
  const safeMessage = escapeHtml(data.message || "No message provided.");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🔔 New Contact Submission</h1>
              <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">Action Required</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
                <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
                  ⚡ A new contact form has been submitted and requires your attention.
                </p>
              </div>

              <!-- Contact Details -->
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Contact Information</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">Full Name</span>
                    <strong style="color: #1f2937; font-size: 16px;">${safeFullName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">Email Address</span>
                    <strong style="color: #2563eb; font-size: 16px;">
                      <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none;">${safeEmail}</a>
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">Contact Number</span>
                    <strong style="color: #1f2937; font-size: 16px;">
                      <a href="tel:${safeContactNumber}" style="color: #1f2937; text-decoration: none;">${safeContactNumber}</a>
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">Company</span>
                    <strong style="color: #1f2937; font-size: 16px;">${safeCompany}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px; display: block; margin-bottom: 4px;">Company Size</span>
                    <strong style="color: #1f2937; font-size: 16px;">${safeCompanySize} employees</strong>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Message</h3>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/contacts" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">View in Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0;">
                This is an automated notification from KaizenHR Contact System
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                Received at ${new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "full", timeStyle: "short" })}
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
