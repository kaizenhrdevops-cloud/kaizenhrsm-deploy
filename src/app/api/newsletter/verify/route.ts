// src/app/api/newsletter/verify/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabase = getServiceClient();

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      `${siteUrl()}/newsletter/error?message=Verification token is missing.`
    );
  }

  // Generous throttle: scanners/proxies also hit these links.
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rate = await checkRateLimit({
    key: `verify:${clientIp}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.redirect(
      `${siteUrl()}/newsletter/error?message=Too many attempts. Please try again later.`
    );
  }

  try {
    // 1. Find the subscriber with the matching token
    const { data: subscriber, error: findError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, verification_expires_at, verification_used_at")
      .eq("verification_token", token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/error?message=Invalid or expired token.`
      );
    }

    // 2. Already verified (link re-clicked): friendly success, no mutation.
    // The token is kept after first use precisely so this branch works.
    if (subscriber.status === "subscribed") {
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/verified?message=Email already verified.`
      );
    }

    if (subscriber.status !== "unverified") {
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/error?message=This token cannot be used.`
      );
    }

    // 3. Enforce the 24h link expiry (set at subscribe/resend time).
    if (
      subscriber.verification_expires_at &&
      new Date(subscriber.verification_expires_at).getTime() < Date.now()
    ) {
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/error?message=This link has expired. Please subscribe again to get a fresh link.`
      );
    }

    // 4. Flip to subscribed. Token is kept (marked used) so re-clicks land
    // on "already verified" instead of "invalid token".
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "subscribed",
        verified_at: new Date().toISOString(),
        verification_used_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("Verification update error:", updateError);
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/error?message=Failed to verify your email. Please try again.`
      );
    }

    return NextResponse.redirect(`${siteUrl()}/newsletter/verified`);
  } catch (error) {
    console.error("Verification process error:", error);
    return NextResponse.redirect(`${siteUrl()}/newsletter/error`);
  }
}
