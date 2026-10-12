// src/app/api/auth/signout/route.ts
//
// Clears the Supabase session cookies server-side. Used by the admin
// session guard's tab-close beacon (fetch with keepalive) so closing the
// last admin tab reliably ends the session even if the page is already
// unloading. Also usable as a plain POST logout endpoint.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign-out API failed:", err);
  }
  return NextResponse.json({ success: true });
}
