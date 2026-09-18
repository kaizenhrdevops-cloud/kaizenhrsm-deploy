// src/app/api/newsletter/unsubscribe/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";

// Shared service-role client (see src/lib/supabase-admin.ts)
const supabaseAdmin = getServiceClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("id"); // This 'id' is the unsubscribe_token
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!token) {
    return NextResponse.redirect(
      `${siteUrl}/newsletter/unsubscribe?status=error&message=Invalid link: Token is missing.`
    );
  }

  try {
    // STEP 1: Find the subscriber by their TOKEN.
    const { data: subscriber, error: findError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("unsubscribe_token", token) // <-- Correct column
      .single();

    // If no subscriber is found, the link is invalid.
    if (findError || !subscriber) {
      console.error("Unsubscribe find error:", findError);
      // ✅ --- IMPROVEMENT: Use a more generic error message ---
      return NextResponse.redirect(
        `${siteUrl}/newsletter/unsubscribe?status=error&message=Invalid or expired link.`
      );
    }

    // STEP 2: Check if they are already unsubscribed.
    if (subscriber.status === "unsubscribed") {
      return NextResponse.redirect(
        `${siteUrl}/newsletter/unsubscribe?status=success`
      );
    }

    // STEP 3: Update their status using their PRIMARY KEY (id).
    const { error: updateError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("id", subscriber.id); // <-- Use the 'subscriber.id'

    if (updateError) {
      console.error("Unsubscribe update error:", updateError);
      return NextResponse.redirect(
        `${siteUrl}/newsletter/unsubscribe?status=error&message=Could not process your request.`
      );
    }

    return NextResponse.redirect(
      `${siteUrl}/newsletter/unsubscribe?status=success`
    );
  } catch (error) {
    console.error("Unsubscribe process error:", error);
    return NextResponse.redirect(
      `${siteUrl}/newsletter/unsubscribe?status=error&message=An unexpected error occurred.`
    );
  }
}