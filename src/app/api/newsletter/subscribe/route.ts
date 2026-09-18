import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { getPublicSettings } from "@/lib/public-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { Resend } from "resend";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { render } from "@react-email/render";

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabase = getServiceClient();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { email, captchaToken } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { message: "A valid email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase().slice(0, 255);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Anti-abuse: bots must not be able to drain the Resend free quota
    // (100/day) by spraying this endpoint.
    if (!captchaToken || typeof captchaToken !== "string") {
      return NextResponse.json(
        { message: "Captcha verification required." },
        { status: 400 }
      );
    }
    const isCaptchaValid = await verifyTurnstileToken(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json(
        { message: "Captcha verification failed. Please try again." },
        { status: 400 }
      );
    }

    // 1. Fetch Settings (cross-request cached, see lib/public-settings)
    const settings = await getPublicSettings();

    // 2. Check Feature Toggle
    if (settings.enable_public_registration === "false") {
      return NextResponse.json(
        { message: "New newsletter registrations are currently disabled." },
        { status: 403 }
      );
    }

    // 3. Determine Sender Details
    // IMPORTANT: On Resend Free Tier, you MUST send from 'onboarding@resend.dev'
    // unless you have verified your own domain.
    // We prioritize the environment variable RESEND_FROM_EMAIL if set.
    // Otherwise, we fallback to 'onboarding@resend.dev'.
    const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const senderName = settings.email_sender_name || "KaizenHR";
    const fromAddress = `${senderName} <${senderEmail}>`;

    // 4. Check existing subscriber
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("status, id, created_at")
      .eq("email", normalizedEmail)
      .single();

    if (existingSubscriber) {
      if (existingSubscriber.status === "subscribed") {
        return NextResponse.json(
          { message: "You are already subscribed." },
          { status: 409 }
        );
      }
      // Resend cooldown: don't re-send verification emails more than
      // once per 15 minutes for the same address (quota protection).
      if (existingSubscriber.status === "unverified") {
        const createdAt = existingSubscriber.created_at
          ? new Date(existingSubscriber.created_at).getTime()
          : 0;
        if (Date.now() - createdAt < 15 * 60 * 1000) {
          return NextResponse.json(
            {
              message:
                "You have already signed up. Please check your email to verify.",
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          {
            message:
              "You have already signed up. Please check your email to verify.",
          },
          { status: 409 }
        );
      }
    }

    // 5. Insert new subscriber (Unverified)
    const { data: newSubscriber, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: normalizedEmail, status: "unverified" })
      .select("verification_token, id")
      .single();

    if (insertError || !newSubscriber) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { message: "Could not subscribe. Please try again." },
        { status: 500 }
      );
    }

    // 6. Prepare Verification Email
    const verificationToken = newSubscriber.verification_token;
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/verify?token=${verificationToken}`;
    const emailHtml = await render(VerificationEmail({ verificationUrl }));

    // 7. Send Verification Email
    const { data, error } = await resend.emails.send({
      from: fromAddress, 
      to: normalizedEmail,
      subject: "Verify Your Newsletter Subscription",
      html: emailHtml,
    });

    // 8. Log Result & Handle Failure
    if (error) {
      console.error("Resend Error:", error);
      
      // CRITICAL FIX: If sending fails, delete the subscriber so they can try again later
      // otherwise they are stuck in "already signed up" limbo without an email.
      await supabase.from("newsletter_subscribers").delete().eq("id", newSubscriber.id);

      await supabase.from("email_send_log").insert({
        email_type: "subscriber_verification",
        status: "failed",
        error_message: error.message,
      });
      
      return NextResponse.json({ message: `Email sending failed: ${error.message}` }, { status: 500 });
    } else {
      await supabase.from("email_send_log").insert({
        email_type: "subscriber_verification",
        status: "sent",
      });
    }

    console.log("Resend Success Response:", data);

    return NextResponse.json(
      { message: "Subscription pending! Please check your email to verify." },
      { status: 200 }
    );

  } catch (error) {
    console.error("Subscription process error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
