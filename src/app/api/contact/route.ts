import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { getPublicSettings } from "@/lib/public-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import {
  userConfirmationTemplate,
  adminNotificationTemplate,
  type ContactFormData,
} from "@/lib/email-templates/contact-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabase = getServiceClient();

// Must match the dropdown in ContactForm.tsx — anything else is rejected
// instead of persisted.
const ALLOWED_COMPANY_SIZES = new Set([
  "1-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000-1500",
  "1501-2000",
  "2001-3000",
  "3000+",
]);

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.formData || typeof body.formData !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { formData, captchaToken } = body;

    if (!captchaToken || typeof captchaToken !== "string") {
      return NextResponse.json({ error: "Captcha verification required" }, { status: 400 });
    }
    const isCaptchaValid = await verifyTurnstileToken(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 });
    }

    // Throttle: every hit costs a DB row + up to 2 Resend sends.
    const rate = await checkRateLimit({
      key: `contact:${clientIp(req)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }

    const requiredFields = ["fullName", "contactNumber", "company", "email", "companySize"] as const;
    for (const field of requiredFields) {
      const val = formData[field];
      if (typeof val !== "string" || !val.trim()) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const sanitizedData = {
      fullName: String(formData.fullName).trim().slice(0, 120),
      contactNumber: String(formData.contactNumber).trim().slice(0, 50),
      company: String(formData.company).trim().slice(0, 150),
      email: String(formData.email).trim().toLowerCase().slice(0, 255),
      companySize: String(formData.companySize).trim().slice(0, 50),
      message: typeof formData.message === "string" ? formData.message.trim().slice(0, 5000) : "",
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (!ALLOWED_COMPANY_SIZES.has(sanitizedData.companySize)) {
      return NextResponse.json({ error: "Invalid company size" }, { status: 400 });
    }
    if (
      sanitizedData.fullName.length < 2 ||
      sanitizedData.company.length < 2 ||
      sanitizedData.contactNumber.replace(/\D/g, "").length < 7
    ) {
      return NextResponse.json(
        { error: "Please provide a valid name, company, and contact number." },
        { status: 400 }
      );
    }

    const { data: contact, error: dbError } = await supabase
      .from("contacts")
      .insert({
        full_name: sanitizedData.fullName,
        contact_number: sanitizedData.contactNumber,
        company: sanitizedData.company,
        business_email: sanitizedData.email,
        company_size: sanitizedData.companySize,
        message: sanitizedData.message,
        status: "new",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to save contact information" }, { status: 500 });
    }

    // --- DYNAMIC SETTINGS (cross-request cached, see lib/public-settings) ---
    const cachedSettings = await getPublicSettings();
    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      cachedSettings.admin_notification_email ||
      "kaizenhr.devops@gmail.com";
    const senderName = cachedSettings.email_sender_name || "KaizenHR";
    // Hierarchy: Env Var > DB Setting > fail-loud placeholder.
    // "example.com" can never deliver, so a missing sender fails loudly at
    // Resend (visible in email_send_log) instead of silently sending from a
    // test address that only reaches the Resend account owner.
    const senderEmail =
      process.env.RESEND_FROM_EMAIL ||
      cachedSettings.email_sender_address ||
      "unconfigured-sender@example.com";
    if (senderEmail === "unconfigured-sender@example.com") {
      console.warn(
        "Email sender is not configured. Set RESEND_FROM_EMAIL (env) or email_sender_address (Admin > Settings) to a verified-domain address."
      );
    }
    const fromAddress = `${senderName} <${senderEmail}>`;
    // ------------------------

    const contactData: ContactFormData = {
      fullName: sanitizedData.fullName,
      contactNumber: sanitizedData.contactNumber,
      company: sanitizedData.company,
      email: sanitizedData.email,
      companySize: sanitizedData.companySize,
      message: sanitizedData.message,
    };

    const emailLogs: any[] = [];
    let userMailOk = false;
    let adminMailOk = false;

    try {
      const { error: userEmailError } = await resend.emails.send({
        from: fromAddress,
        to: sanitizedData.email,
        subject: "Thank You for Contacting KaizenHR",
        html: userConfirmationTemplate(contactData),
      });

      if (userEmailError) {
        console.error("Resend Error (User):", userEmailError);
        emailLogs.push({ email_type: "contact_reply", status: "failed", error_message: (userEmailError as Error).message });
      } else {
        userMailOk = true;
        emailLogs.push({ email_type: "contact_reply", status: "sent" });
      }
    } catch (emailError) {
      console.error("Error sending user confirmation email:", emailError);
      emailLogs.push({ email_type: "contact_reply", status: "failed", error_message: (emailError as Error).message });
    }

    try {
      const { error: adminEmailError } = await resend.emails.send({
        from: fromAddress,
        to: adminEmail,
        subject: `🔔 New Contact Form Submission from ${sanitizedData.company}`,
        html: adminNotificationTemplate(contactData),
      });
      if (adminEmailError) {
        console.error("Resend Error (Admin):", adminEmailError);
        emailLogs.push({ email_type: "contact_notification", status: "failed", error_message: (adminEmailError as Error).message });
      } else {
        adminMailOk = true;
        emailLogs.push({ email_type: "contact_notification", status: "sent" });
      }
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
      emailLogs.push({ email_type: "contact_notification", status: "failed", error_message: (emailError as Error).message });
    }

    if (emailLogs.length > 0) {
      await supabase.from("email_send_log").insert(emailLogs);
    }

    // Honest response: the inquiry is saved either way (visible in admin),
    // but say so explicitly when a notification mail failed.
    if (!adminMailOk || !userMailOk) {
      const missing = [
        !userMailOk ? "confirmation" : null,
        !adminMailOk ? "admin notification" : null,
      ]
        .filter(Boolean)
        .join(" and ");
      return NextResponse.json(
        {
          success: true,
          message: "Contact form submitted successfully",
          data: contact,
          mailWarning: `Your inquiry was saved, but our ${missing} email failed — we will still follow up from the dashboard queue.`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, message: "Contact form submitted successfully", data: contact }, { status: 200 });

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 });
  }
}