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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES = ["subscribed", "unverified", "unsubscribed"] as const;
type Status = (typeof STATUSES)[number];

/**
 * GET /api/admin/subscribers?status=&q=&page=&pageSize=
 * Server-driven list: optional status filter + email search, paged.
 * Also returns per-status counts for the stat cards (one extra query set).
 */
export async function GET(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") || "50", 10) || 50)
  );
  const status: Status | null =
    statusParam && (STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as Status)
      : null;

  const buildFiltered = () => {
    let query = supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, status, created_at, verified_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (q) {
      // Escape PostgREST wildcards so the search is literal.
      const safe = q.replace(/[%_\\]/g, (m) => `\\${m}`);
      query = query.ilike("email", `%${safe}%`);
    }
    return query;
  };

  const from = (page - 1) * pageSize;
  const [{ data, error, count }, countsRes] = await Promise.all([
    buildFiltered().range(from, from + pageSize - 1),
    supabaseAdmin.from("newsletter_subscribers").select("status"),
  ]);

  if (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to load subscribers." },
      { status: 500 }
    );
  }

  const counts: Record<Status | "total", number> = {
    total: 0,
    subscribed: 0,
    unverified: 0,
    unsubscribed: 0,
  };
  if (!countsRes.error && countsRes.data) {
    for (const row of countsRes.data) {
      counts.total += 1;
      if (row.status === "subscribed") counts.subscribed += 1;
      else if (row.status === "unverified") counts.unverified += 1;
      else if (row.status === "unsubscribed") counts.unsubscribed += 1;
    }
  }

  return NextResponse.json({
    data: data || [],
    total: count ?? 0,
    page,
    pageSize,
    counts,
  });
}

export async function PATCH(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;
  const status = body?.status;

  if (typeof id !== "string" || !UUID_RE.test(id) || status !== "unsubscribed") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // Unknown id surfaces as PGRST116 (no rows) — report 404, not 500.
    if ((error as { code?: string }).code === "PGRST116" || !data) {
      return NextResponse.json(
        { error: "Subscriber not found." },
        { status: 404 }
      );
    }
    console.error("Error updating subscriber:", error);
    return NextResponse.json(
      { error: "Failed to update subscriber." },
      { status: 500 }
    );
  }

  // Audit trail for the PII mutation.
  try {
    const admin = await requireAdmin();
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: admin?.user.id ?? null,
      action: "subscriber.unsubscribe",
      details: {
        message: `Admin unsubscribed ${data.email}`,
        subscriber_id: id,
      },
    });
  } catch (auditError) {
    console.error("Subscriber audit log failed:", auditError);
  }

  return NextResponse.json(data);
}
