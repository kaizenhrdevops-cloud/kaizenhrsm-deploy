// src/app/admin/newsletter/[campaign_id]/page.tsx
import { createClient } from "@/lib/server";
import { Database } from "@/types/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import CampaignDetailsClient from "./CampaignDetailsClient";

// Types for our data
export type CampaignWithDetails =
  Database["public"]["Tables"]["newsletter_campaigns"]["Row"] & {
    profiles: { full_name: string | null } | null;
    posts: { title: string | null; slug: string; category: string } | null;
  };
export type SendLog = Pick<
  Database["public"]["Tables"]["newsletter_send_log"]["Row"],
  "id" | "email" | "status" | "sent_at" | "error_message" | "created_at"
>;

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaign_id: string }>;
}) {
  const { campaign_id } = await params;
  const supabase = await createClient();

  // 1. Check user and role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
      </div>
    );
  }

  // 2. Fetch Campaign Details (with joins)
  const { data: campaign, error: campaignError } = await supabase
    .from("newsletter_campaigns")
    .select(
      `
      *,
      posts ( title, slug, category ),
      profiles ( full_name )
    `
    )
    .eq("id", campaign_id)
    .single();

  // 3. Fetch All Send Logs for this campaign
  const { data: logs, error: logsError } = await supabase
    .from("newsletter_send_log")
    .select("id, email, status, sent_at, error_message, created_at")
    .eq("campaign_id", campaign_id)
    .order("created_at", { ascending: true });

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
        logs={logs || []}
      />
    </div>
  );
}
