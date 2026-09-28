// src/app/auth/callback/route.ts
//
// Consumer for Supabase recovery/magic links: exchanges the `code` for a
// session (cookies persisted via the full setAll client) and sends the
// user to set a new password. Without this route, emailed auth links had
// nowhere to land.
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/auth/reset-password";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", req.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback exchange failed:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=expired_link", req.url)
    );
  }

  // Only allow same-origin relative destinations.
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/auth/reset-password";
  return NextResponse.redirect(new URL(destination, req.url));
}
