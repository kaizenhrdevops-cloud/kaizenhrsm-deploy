// src/app/admin/newsletter/page.tsx
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import CampaignsClient from "./CampaignsClient";
import { Mail } from "lucide-react";
import type { CampaignWithDetails } from "@/types/newsletter";

// Server caps the initial payload; the table still searches/sorts/paginates
// client-side within the window. Campaign rows grow one-per-send, so this
// bound is generous — and the exact count keeps the UI honest.
const LIST_LIMIT = 500;

export default async function NewsletterCampaignsPage() {
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

  // Only super admins can view this page
  if (profile?.role !== "super_admin" || profile?.status !== "active") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // 2. Fetch recent campaigns with post title and author name (+ exact count)
  const [{ data: campaigns, error }, { count: totalCount }] = await Promise.all([
    supabase
      .from("newsletter_campaigns")
      .select(
        `
        *,
        posts ( title, slug, category ),
        profiles ( full_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase
      .from("newsletter_campaigns")
      .select("*", { count: "exact", head: true }),
  ]);

  if (error) {
    console.error("Error fetching campaigns:", error);
    return (
      <div className="p-4 text-red-500">
        Error fetching campaigns: {error.message}
      </div>
    );
  }

  const rows = (campaigns || []) as CampaignWithDetails[];

  // --- Calculate stats on the server ---
  let totalSent = 0;
  let totalFailed = 0;
  rows.forEach((campaign) => {
    totalSent += campaign.sent_count || 0; // Use the correct column
    totalFailed += campaign.total_failed || 0; // Use the correct column
  });

  const stats = {
    totalCampaigns: totalCount ?? rows.length,
    totalSent,
    totalFailed,
  };
  // --- END ---

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Newsletter Campaigns
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          View all past, present, and scheduled newsletter sends.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
            No Campaigns Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Once you schedule a newsletter from the Blog page, it will appear
            here.
          </p>
        </div>
      ) : (
        <CampaignsClient
          campaigns={rows}
          stats={stats}
          capped={rows.length >= LIST_LIMIT}
        />
      )}
    </div>
  );
}
