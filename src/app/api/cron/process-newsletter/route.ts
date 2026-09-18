// src/app/api/cron/process-newsletter/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { processNewsletterQueue } from "@/app/admin/blog/newsletterActions";
import { getServiceClient } from "@/lib/supabase-admin";

// ADD THIS LINE EXACTLY HERE
export const dynamic = 'force-dynamic';
// ← this tells Next.js: “never run this API route at build time”

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
// ---------------------------------

export async function GET(req: NextRequest) {
  // 1. Secure the endpoint (prevent bypass if CRON_SECRET is undefined)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Run Maintenance Tasks (NEW)
    // We run this *before* or *alongside* the newsletter queue
    // "await" ensures it finishes before we return response
    await cleanupAuditLogs();

    // 3. Run Newsletter Queue
    const result = await processNewsletterQueue();
    
    if (!result.success) {
      console.error("Cron Job Error:", result.message);
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ 
      newsletter: result,
      maintenance: "Audit log cleanup attempted" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cron API Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}