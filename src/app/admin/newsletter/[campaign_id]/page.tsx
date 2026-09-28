// src/app/admin/newsletter/[campaign_id]/page.tsx
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import CampaignDetailsClient from "./CampaignDetailsClient";
import type {
  CampaignWithDetails,
  LogStatusCounts,
  SendLog,
} from "@/types/newsletter";
import { EMPTY_LOG_COUNTS } from "@/types/newsletter";

const LOG_PAGE_SIZE = 50;

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaign_id: string }>;
}) {
  const { campaign_id } = await params;
  const supabase = await createClient();

  // 1. Check user, role, and active status
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" || profile?.status !== "active") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // 2. Fetch campaign + first page of logs in parallel (independent queries)
  const [{ data: campaign, error: campaignError }, logsRes] = await Promise.all([
    supabase
      .from("newsletter_campaigns")
      .select(
        `
        *,
        posts ( title, slug, category ),
        profiles ( full_name )
      `
      )
      .eq("id", campaign_id)
      .single(),
    supabase
      .from("newsletter_send_log")
      .select("id, email, status, sent_at, error_message, created_at", {
        count: "exact",
      })
      .eq("campaign_id", campaign_id)
      .order("created_at", { ascending: true })
      .range(0, LOG_PAGE_SIZE - 1),
  ]);

  if (campaignError || !campaign) {
    return (
      <div className="p-6">
        <Link
          href="/admin/newsletter"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to all campaigns
        </Link>
        <div className="p-10 text-center bg-white border border-red-200 rounded-lg dark:bg-gray-800 dark:border-red-700 mt-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
            Error: Campaign Not Found
          </h3>
          <p className="text-red-600 dark:text-red-400">
            {campaignError?.message || "The requested campaign does not exist."}
          </p>
        </div>
      </div>
    );
  }

  // 3. Logs error is surfaced — never disguised as "no logs".
  if (logsRes.error) {
    console.error("Error fetching send logs:", logsRes.error);
    return (
      <div className="p-6">
        <Link
          href="/admin/newsletter"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to all campaigns
        </Link>
        <div className="p-10 text-center bg-white border border-red-200 rounded-lg dark:bg-gray-800 dark:border-red-700 mt-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
            Error: Could Not Load Send Logs
          </h3>
          <p className="text-red-600 dark:text-red-400">
            {logsRes.error.message || "Please try again."}
          </p>
        </div>
      </div>
    );
  }

  // 4. Breakdown counts for the stat cards (one narrow scan).
  const { data: statusRows } = await supabase
    .from("newsletter_send_log")
    .select("status")
    .eq("campaign_id", campaign_id);

  const logCounts: LogStatusCounts = { ...EMPTY_LOG_COUNTS };
  for (const row of statusRows || []) {
    logCounts.total += 1;
    switch (row.status) {
      case "queued":
        logCounts.queued += 1;
        break;
      case "sending":
        logCounts.sending += 1;
        break;
      case "sent":
        logCounts.sent += 1;
        break;
      case "failed":
        logCounts.failed += 1;
        break;
      case "bounced":
        logCounts.bounced += 1;
        break;
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/newsletter"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to all campaigns
      </Link>

      <CampaignDetailsClient
        campaign={campaign as CampaignWithDetails}
        initialLogs={(logsRes.data || []) as SendLog[]}
        initialTotal={logsRes.count ?? 0}
        initialCounts={logCounts}
        pageSize={LOG_PAGE_SIZE}
      />
    </div>
  );
}
