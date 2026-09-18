import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { getPublicSettings } from "@/lib/public-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { Resend } from "resend";
import {
  userConfirmationTemplate,
  adminNotificationTemplate,
  type ContactFormData,
} from "@/lib/email-templates/contact-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabase = getServiceClient();

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
    // Hierarchy: Env Var > DB Setting > Fallback
    const senderEmail =
      process.env.RESEND_FROM_EMAIL ||
      cachedSettings.email_sender_address ||
      "onboarding@resend.dev";
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
      if (adminEmailError) console.error("Resend Error (Admin):", adminEmailError);
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
    }

    if (emailLogs.length > 0) {
      await supabase.from("email_send_log").insert(emailLogs);
    }

    return NextResponse.json({ success: true, message: "Contact form submitted successfully", data: contact }, { status: 200 });

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 });
  }
}