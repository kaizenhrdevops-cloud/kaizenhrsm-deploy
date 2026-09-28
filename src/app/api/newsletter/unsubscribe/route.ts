// src/app/api/newsletter/unsubscribe/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabaseAdmin = getServiceClient();

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function overLimit(req: NextRequest): Promise<number | null> {
  const rate = await checkRateLimit({
    key: `unsubscribe:${clientIp(req)}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  return rate.allowed ? null : rate.retryAfterSeconds;
}

/**
 * GET never mutates. It validates the token and routes onward:
 * - unknown token  → error page
 * - already unsubscribed → success page (idempotent)
 * - otherwise → confirm screen (old inbox links keep working — they land
 *   on the confirm screen instead of instantly unsubscribing, so mail
 *   scanners/prefetchers can't nuke subscriptions).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("id"); // This 'id' is the unsubscribe_token

  if (!token) {
    return NextResponse.redirect(
      `${siteUrl()}/newsletter/unsubscribe?status=error&message=Invalid link: Token is missing.`
    );
  }

  if (await overLimit(req)) {
    return NextResponse.redirect(
      `${siteUrl()}/newsletter/unsubscribe?status=error&message=Too many attempts. Please try again later.`
    );
  }

  try {
    const { data: subscriber, error: findError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("unsubscribe_token", token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/unsubscribe?status=error&message=Invalid or expired link.`
      );
    }

    if (subscriber.status === "unsubscribed") {
      return NextResponse.redirect(
        `${siteUrl()}/newsletter/unsubscribe?status=success`
      );
    }

    return NextResponse.redirect(
      `${siteUrl()}/newsletter/unsubscribe?id=${encodeURIComponent(token)}&confirm=1`
    );
  } catch (error) {
    console.error("Unsubscribe process error:", error);
    return NextResponse.redirect(
      `${siteUrl()}/newsletter/unsubscribe?status=error&message=An unexpected error occurred.`
    );
  }
}

/** POST performs the actual mutation (called by the confirm screen). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { message: "Unsubscribe token is missing." },
      { status: 400 }
    );
  }

  if (await overLimit(req)) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { data: subscriber, error: findError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("unsubscribe_token", token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        { message: "Invalid or expired link." },
        { status: 400 }
      );
    }

    if (subscriber.status === "unsubscribed") {
      return NextResponse.json({ success: true, already: true });
    }

    const { error: updateError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("Unsubscribe update error:", updateError);
      return NextResponse.json(
        { message: "Could not process your request." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe process error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
