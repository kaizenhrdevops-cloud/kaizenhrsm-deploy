// src/app/api/newsletter/verify/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabase = getServiceClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!token) {
    // Redirect to an error page if no token is provided
    return NextResponse.redirect(
      `${siteUrl}/newsletter/error?message=Verification token is missing.`
    );
  }

  try {
    // 1. Find the subscriber with the matching token
    const { data: subscriber, error: findError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("verification_token", token)
      .single();

    if (findError || !subscriber) {
      console.error("Verification find error:", findError);
      return NextResponse.redirect(
        `${siteUrl}/newsletter/error?message=Invalid or expired token.`
      );
    }

    // 2. If subscriber is found and is 'unverified', update their status
    if (subscriber.status === "unverified") {
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "subscribed",
          verified_at: new Date().toISOString(),
          verification_token: null, // Clear the token after use
        })
        .eq("id", subscriber.id);

      if (updateError) {
        console.error("Verification update error:", updateError);
        return NextResponse.redirect(
          `${siteUrl}/newsletter/error?message=Failed to verify your email. Please try again.`
        );
      }

      // 3. Redirect to a success page
      return NextResponse.redirect(`${siteUrl}/newsletter/verified`);
    }

    // If the token was already used/verified
    if (subscriber.status === "subscribed") {
      return NextResponse.redirect(
        `${siteUrl}/newsletter/verified?message=Email already verified.`
      );
    }

    // Fallback for any other status
    return NextResponse.redirect(
      `${siteUrl}/newsletter/error?message=This token cannot be used.`
    );
  } catch (error) {
    console.error("Verification process error:", error);
    return NextResponse.redirect(`${siteUrl}/newsletter/error`);
  }
}
