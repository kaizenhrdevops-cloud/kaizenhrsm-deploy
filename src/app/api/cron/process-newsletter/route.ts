// src/app/api/cron/process-newsletter/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { processNewsletterQueue } from "@/lib/newsletter-queue";
import { getServiceClient } from "@/lib/supabase-admin";

// ADD THIS LINE EXACTLY HERE
export const dynamic = 'force-dynamic';
// ← this tells Next.js: “never run this API route at build time”

// Vercel Hobby allows up to 60s per function invocation.
export const maxDuration = 60;

// Stop starting new newsletter batches after this long (leaves headroom
// for DB writes before the 60s hard limit).
const QUEUE_TIME_BUDGET_MS = 40_000;

// --- NEW: Maintenance Function ---
async function cleanupAuditLogs() {
  // Use service role client: cron requests have no user session cookies,
  // and anon key is blocked by RLS from deleting admin audit logs.
  const supabase = getServiceClient();

  try {
    // 1. Get the retention setting
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "audit_log_retention_days")
      .single();

    // Default to 30 days if not set (fits Supabase free 500MB DB)
    let retentionDays = 30;
    
    if (setting?.value) {
      // Handle case where value might be a JSON string like "\"0.0416\""
      const rawValue = setting.value; 
      const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      retentionDays = parseFloat(parsed);
    }

    // If set to 0, keep forever (disable cleanup)
    if (retentionDays <= 0) {
      console.log("CRON: Audit log retention set to 0 (Keep Forever). Skipping cleanup.");
      return;
    }

    // 2. Calculate the cutoff timestamp
    // Current Time - (Days * 24 * 60 * 60 * 1000)
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
    const cutoffISO = cutoffDate.toISOString();

    console.log(`CRON: Cleaning audit logs older than ${retentionDays} days (Limit: ${cutoffISO})`);

    // 3. Delete old logs
    const { error, count } = await supabase
      .from("admin_audit_log")
      .delete({ count: "exact" }) 
      .lt("created_at", cutoffISO);

    if (error) {
      console.error("CRON: Failed to clean audit logs:", error.message);
    } else {
      console.log(`CRON: Deleted ${count} old audit log entries.`);
    }

  } catch (error) {
    console.error("CRON: Error in cleanupAuditLogs:", error);
  }
}

// Log tables grow with every send/attempt. On Supabase free (500MB) they
// must be pruned; history older than the window below has no operational
// use (campaign counters live on newsletter_campaigns).
const EMAIL_LOG_RETENTION_DAYS = 90;
const ABUSE_ATTEMPTS_RETENTION_HOURS = 24;

async function cleanupEmailAndAbuseLogs() {
  const supabase = getServiceClient();
  try {
    const emailCutoff = new Date(
      Date.now() - EMAIL_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const [emailLog, sendLog] = await Promise.all([
      supabase
        .from("email_send_log")
        .delete({ count: "exact" })
        .lt("created_at", emailCutoff),
      // Only terminal rows — queued/sending rows belong to live campaigns.
      supabase
        .from("newsletter_send_log")
        .delete({ count: "exact" })
        .in("status", ["sent", "failed", "bounced"])
        .lt("created_at", emailCutoff),
    ]);

    if (emailLog.error) {
      console.error("CRON: Failed to clean email_send_log:", emailLog.error.message);
    } else {
      console.log(`CRON: Deleted ${emailLog.count} old email_send_log rows.`);
    }
    if (sendLog.error) {
      console.error("CRON: Failed to clean newsletter_send_log:", sendLog.error.message);
    } else {
      console.log(`CRON: Deleted ${sendLog.count} old newsletter_send_log rows.`);
    }

    const abuseCutoff = new Date(
      Date.now() - ABUSE_ATTEMPTS_RETENTION_HOURS * 60 * 60 * 1000
    ).toISOString();
    const { error: abuseError, count: abuseCount } = await supabase
      .from("abuse_attempts")
      .delete({ count: "exact" })
      .lt("created_at", abuseCutoff);
    if (abuseError) {
      console.error("CRON: Failed to clean abuse_attempts:", abuseError.message);
    } else {
      console.log(`CRON: Deleted ${abuseCount} old abuse_attempts rows.`);
    }
  } catch (error) {
    console.error("CRON: Error in cleanupEmailAndAbuseLogs:", error);
  }
}
// ---------------------------------

export async function GET(req: NextRequest) {
  // 1. Secure the endpoint (prevent bypass if CRON_SECRET is undefined)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Maintenance (log pruning) — once a day is plenty. The Vercel daily
    // cron (user-agent "vercel-cron") or ?maintenance=1 triggers it; the
    // frequent external scheduler (every 5 min) skips it.
    const isDailyRun =
      (req.headers.get("user-agent") || "").includes("vercel-cron") ||
      req.nextUrl.searchParams.get("maintenance") === "1";
    if (isDailyRun) {
      await cleanupAuditLogs();
      await cleanupEmailAndAbuseLogs();
    }

    // 3. Run Newsletter Queue (low-priority mail, quota-aware)
    const result = await processNewsletterQueue({
      timeBudgetMs: QUEUE_TIME_BUDGET_MS,
    });
    
    if (!result.success) {
      console.error("Cron Job Error:", result.message);
      return NextResponse.json({ error: result.message, newsletter: result }, { status: 500 });
    }

    return NextResponse.json({ 
      newsletter: result,
      maintenance: isDailyRun ? "Log cleanup attempted" : "skipped",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cron API Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}