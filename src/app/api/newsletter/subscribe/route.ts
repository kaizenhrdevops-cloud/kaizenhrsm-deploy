import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { getPublicSettings } from "@/lib/public-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { render } from "@react-email/render";

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabase = getServiceClient();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Resend cooldown between verification mails to the same address.
const RESEND_COOLDOWN_MS = 15 * 60 * 1000;

// Verify links stay valid for 24h from issue (enforced in verify route).
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const freshVerifyExpiry = () => new Date(Date.now() + VERIFY_TTL_MS).toISOString();

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

    // IP-level throttle (DB-backed — Vercel Hobby is stateless, so an
    // in-memory limiter would not work). 10 attempts / 10 min per IP.
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rate = await checkRateLimit({
      key: `subscribe:${clientIp}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
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
    // Priority: RESEND_FROM_EMAIL env, else the fail-loud placeholder below.
    // "example.com" can never deliver, so a missing sender fails loudly at
    // Resend (visible in email_send_log) instead of silently sending from a
    // test address that only reaches the Resend account owner.
    const senderEmail =
      process.env.RESEND_FROM_EMAIL || "unconfigured-sender@example.com";
    if (senderEmail === "unconfigured-sender@example.com") {
      console.warn(
        "Email sender is not configured. Set RESEND_FROM_EMAIL (env) to a verified-domain address."
      );
    }
    const senderName = settings.email_sender_name || "KaizenHR";
    const fromAddress = `${senderName} <${senderEmail}>`;

    // 4. Check existing subscriber
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("status, id, created_at")
      .eq("email", normalizedEmail)
      .single();

    // Resolved below for both new and returning subscribers.
    let subscriberId: string;
    // True when re-sending to an existing row (failure must NOT delete it).
    let isExistingRow = false;

    if (existingSubscriber) {
      if (existingSubscriber.status === "subscribed") {
        return NextResponse.json(
          { message: "You are already subscribed." },
          { status: 409 }
        );
      }

      if (existingSubscriber.status === "unsubscribed") {
        // Re-subscribe: flip back to unverified with a fresh token.
        // (Previously this fell through to insert → UNIQUE violation → 500.)
        const { data, error } = await supabase
          .from("newsletter_subscribers")
          .update({
            status: "unverified",
            verification_token: crypto.randomUUID(),
            verification_expires_at: freshVerifyExpiry(),
            verified_at: null,
            verification_used_at: null,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingSubscriber.id)
          .select("id")
          .single();

        if (error || !data) {
          console.error("Resubscribe update error:", error);
          return NextResponse.json(
            { message: "Could not subscribe. Please try again." },
            { status: 500 }
          );
        }
        subscriberId = data.id;
        isExistingRow = true;
      } else {
        // Unverified: per-address cooldown protects the daily quota.
        const createdAt = existingSubscriber.created_at
          ? new Date(existingSubscriber.created_at).getTime()
          : 0;
        if (Date.now() - createdAt < RESEND_COOLDOWN_MS) {
          return NextResponse.json(
            {
              message:
                "You have already signed up. Please check your email to verify.",
            },
            { status: 429 }
          );
        }
        // Past cooldown: rotate the token (old links die) and re-send.
        // (Previously this returned 409 with no email — an infinite loop.)
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({
            verification_token: crypto.randomUUID(),
            verification_expires_at: freshVerifyExpiry(),
            verification_used_at: null,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingSubscriber.id);

        if (error) {
          console.error("Verification resend update error:", error);
          return NextResponse.json(
            { message: "Could not subscribe. Please try again." },
            { status: 500 }
          );
        }
        subscriberId = existingSubscriber.id;
        isExistingRow = true;
      }
    } else {
      // 5. Insert new subscriber (Unverified)
      const { data: newSubscriber, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: normalizedEmail,
          status: "unverified",
          verification_expires_at: freshVerifyExpiry(),
        })
        .select("id")
        .single();

      if (insertError || !newSubscriber) {
        // Double-submit race: the other request won — treat as signed up.
        if ((insertError as { code?: string } | null)?.code === "23505") {
          return NextResponse.json(
            {
              message:
                "You have already signed up. Please check your email to verify.",
            },
            { status: 409 }
          );
        }
        console.error("Supabase insert error:", insertError);
        return NextResponse.json(
          { message: "Could not subscribe. Please try again." },
          { status: 500 }
        );
      }
      subscriberId = newSubscriber.id;
    }

    // 6. Load the (fresh) verification token for this subscriber
    const { data: tokenRow, error: tokenError } = await supabase
      .from("newsletter_subscribers")
      .select("verification_token")
      .eq("id", subscriberId)
      .single();

    if (tokenError || !tokenRow?.verification_token) {
      console.error("Verification token lookup error:", tokenError);
      return NextResponse.json(
        { message: "Could not subscribe. Please try again." },
        { status: 500 }
      );
    }

    // 7. Prepare + send verification email
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";
    const verificationUrl = `${siteUrl}/api/newsletter/verify?token=${tokenRow.verification_token}`;
    const emailHtml = await render(VerificationEmail({ verificationUrl }));

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: normalizedEmail,
      subject: "Verify Your Newsletter Subscription",
      html: emailHtml,
    });

    // 8. Log result & handle failure
    if (error) {
      console.error("Resend Error:", error);

      if (!isExistingRow) {
        // New row with no mail sent: delete so a retry starts clean
        // instead of landing in "already signed up" limbo.
        await supabase
          .from("newsletter_subscribers")
          .delete()
          .eq("id", subscriberId);
      }

      await supabase.from("email_send_log").insert({
        email_type: "subscriber_verification",
        status: "failed",
        error_message: error.message,
      });

      // Generic message — never leak provider internals to the client.
      return NextResponse.json(
        { message: "Could not send the verification email. Please try again." },
        { status: 500 }
      );
    }

    await supabase.from("email_send_log").insert({
      email_type: "subscriber_verification",
      status: "sent",
    });

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
