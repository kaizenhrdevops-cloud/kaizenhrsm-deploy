// src/app/api/admin/subscribers/route.ts
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/api-auth";

// Shared service-role client for actions that bypass RLS.
const supabaseAdmin = getServiceClient();

// Shared admin auth check (see src/lib/api-auth.ts)
async function isAuthorizedAdmin() {
  return (await requireAdmin()) !== null;
}

export async function GET(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, email, status, created_at, verified_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, status } = await request.json();

  if (!id || status !== "unsubscribed") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating subscriber:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
