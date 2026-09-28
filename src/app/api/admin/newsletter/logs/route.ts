// GET /api/admin/newsletter/logs?campaign=&status=&q=&page=&pageSize=
// Server-driven send-log list for the campaign detail page. Logs grow one
// row per recipient, so unlike campaigns they must page on the server.
// Only super_admin (mirrors the /admin/newsletter pages).
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/api-auth";
import {
  EMPTY_LOG_COUNTS,
  SEND_LOG_STATUSES,
  type LogStatusCounts,
} from "@/types/newsletter";

const supabaseAdmin = getServiceClient();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const admin = await requireAdmin(undefined, { roles: ["super_admin"] });
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const campaign = searchParams.get("campaign") || "";
  const statusParam = searchParams.get("status");
  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") || "50", 10) || 50)
  );

  if (!UUID_RE.test(campaign)) {
    return NextResponse.json({ error: "Invalid campaign id." }, { status: 400 });
  }

  const status =
    statusParam && (SEND_LOG_STATUSES as readonly string[]).includes(statusParam)
      ? statusParam
      : null;

  const buildFiltered = () => {
    let query = supabaseAdmin
      .from("newsletter_send_log")
      .select("id, email, status, sent_at, error_message, created_at", {
        count: "exact",
      })
      .eq("campaign_id", campaign)
      .order("created_at", { ascending: true });
    if (status) query = query.eq("status", status);
    if (q) {
      const safe = q.replace(/[%_\\]/g, (m) => `\\${m}`);
      query = query.ilike("email", `%${safe}%`);
    }
    return query;
  };

  const from = (page - 1) * pageSize;
  const [{ data, error, count }, statusRes] = await Promise.all([
    buildFiltered().range(from, from + pageSize - 1),
    // One narrow column scan for the breakdown cards (cheaper than 6 counts).
    supabaseAdmin
      .from("newsletter_send_log")
      .select("status")
      .eq("campaign_id", campaign),
  ]);

  if (error) {
    console.error("Error fetching send logs:", error);
    return NextResponse.json(
      { error: "Failed to load send logs." },
      { status: 500 }
    );
  }

  const counts: LogStatusCounts = { ...EMPTY_LOG_COUNTS };
  if (!statusRes.error && statusRes.data) {
    for (const row of statusRes.data) {
      counts.total += 1;
      switch (row.status) {
        case "queued":
          counts.queued += 1;
          break;
        case "sending":
          counts.sending += 1;
          break;
        case "sent":
          counts.sent += 1;
          break;
        case "failed":
          counts.failed += 1;
          break;
        case "bounced":
          counts.bounced += 1;
          break;
      }
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
