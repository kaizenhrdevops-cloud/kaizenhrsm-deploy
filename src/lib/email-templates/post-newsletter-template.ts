// src/lib/email-templates/post-newsletter-template.ts

export interface PostNewsletterData {
  postTitle: string;
  postPreviewText: string;
  postImageUrl?: string | null;
  readMoreUrl: string; // e.g., https://yoursite.com/resources/blog-articles/my-post
  unsubscribeUrl: string; // User-specific unsubscribe link
  category?: string | null;
  siteUrl?: string | null;
}

/**
 * Escapes special HTML characters to prevent broken markup or injection.
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

export const postNewsletterTemplate = (data: PostNewsletterData) => {
  const safeTitle = escapeHtml(data.postTitle || "Untitled Post");
  const rawPreview = data.postPreviewText || "Read the full article on our website.";
  const safePreview = escapeHtml(rawPreview).replace(/\n\s*\n/g, "<br/><br/>").replace(/\n/g, "<br/>");

  // Only render image if it is a valid absolute URL (http/https)
  const rawImage = (data.postImageUrl || "").trim();
  const validImageUrl =
    rawImage && (rawImage.startsWith("http://") || rawImage.startsWith("https://"))
      ? rawImage
      : null;

  const categoryLabel = data.category
    ? escapeHtml(data.category.toUpperCase())
    : "KAIZENHR INSIGHTS";

  const siteUrl = data.siteUrl || "https://kaizenhrms.com";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 36px 12px;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Card Container (600px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; margin: 0 auto;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #006B65 0%, #004D47 100%); background-color: #006B65; padding: 36px 32px 32px 32px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
                      KaiZen<span style="color: #5eead4;">HR</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #ccfbf1; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Newsletter &amp; Industry Insights
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            validImageUrl
              ? `
          <!-- Featured Hero Image -->
          <tr>
            <td style="padding: 0; background-color: #0f172a; text-align: center; line-height: 0;">
              <img src="${validImageUrl}" alt="${safeTitle}" width="600" style="width: 100%; max-width: 600px; height: auto; max-height: 320px; object-fit: cover; display: block; border: 0;" />
            </td>
          </tr>
          `
              : `
          <!-- Decorative Teal Accent Line when no image is present -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #14b8a6, #0d9488, #0f766e); line-height: 4px; font-size: 0;">&nbsp;</td>
          </tr>
          `
          }

          <!-- Main Article Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Category Pill Badge -->
                <tr>
                  <td style="padding-bottom: 14px;">
                    <span style="display: inline-block; background-color: #e6f4f1; color: #006b65; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${categoryLabel}
                    </span>
                  </td>
                </tr>

                <!-- Article Title -->
                <tr>
                  <td style="padding-bottom: 18px;">
                    <h1 style="margin: 0; font-size: 24px; line-height: 1.35; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${safeTitle}
                    </h1>
                  </td>
                </tr>

                <!-- Article Preview Text -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${safePreview}
                    </p>
                  </td>
                </tr>

                <!-- Call to Action Button (Inlined styling prevents email clients from applying default blue links) -->
                <tr>
                  <td align="center" style="padding-bottom: 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #007A78 0%, #005C5A 100%); background-color: #007A78;">
                          <a href="${data.readMoreUrl}" target="_blank" style="display: inline-block; padding: 15px 34px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none !important; border-radius: 10px; letter-spacing: 0.3px;">
                            <!--[if mso]>&nbsp;&nbsp;<![endif]-->Read Full Article &rarr;<!--[if mso]>&nbsp;&nbsp;<![endif]-->
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Sign-off Section -->
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Best regards,
                    </p>
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      The KaizenHR Team
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #007a78; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      Malaysia's Tier 1 Enterprise HR Solution
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 32px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 1.6; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <strong>KaiZenHR Sdn Bhd</strong><br />
                    Suite D-05-01, 5th Floor, Block D, Plaza Mont Kiara<br />
                    50480 Kuala Lumpur, Malaysia
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px; font-size: 11px; line-height: 1.5; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    You are receiving this email because you subscribed to updates from KaizenHR.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <a href="${siteUrl}" target="_blank" style="color: #007a78 !important; text-decoration: none; font-weight: 600; margin: 0 8px;">
                      Visit Website
                    </a>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <a href="${data.unsubscribeUrl}" target="_blank" style="color: #64748b !important; text-decoration: underline; margin: 0 8px;">
                      Unsubscribe
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
};