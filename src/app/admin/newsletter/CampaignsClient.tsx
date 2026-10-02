// src/app/admin/newsletter/CampaignsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { type Column } from "@/components/shared/DataTable";
import type { CampaignWithDetails } from "@/types/newsletter";
import {
  CampaignStatusBadge,
  StatCard,
  formatDateTime,
} from "@/components/admin/NewsletterBadges";
import { deleteCampaign } from "@/app/admin/blog/newsletterActions";
import RescheduleCampaignModal from "@/components/admin/RescheduleCampaignModal";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
  Trash2,
  XCircle,
  CalendarClock,
} from "lucide-react";

export default function CampaignsClient({
  campaigns,
  stats, // <-- Receive stats as a prop
  capped,
}: {
  campaigns: CampaignWithDetails[];
  stats: {
    totalCampaigns: number;
    totalSent: number;
    totalFailed: number;
  };
  capped: boolean;
}) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<CampaignWithDetails | null>(null);

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setActionError(null);
    try {
      const result = await deleteCampaign(id);
      if (!result.success) {
        setActionError(result.message);
        return;
      }
      router.refresh();
    } finally {
      setPendingDeleteId(null);
      setConfirmingDeleteId(null);
    }
  };

  const columns: Column<CampaignWithDetails>[] = [
    {
      key: "subject",
      label: "Subject",
      render: (campaign) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {campaign.subject}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (campaign) => <CampaignStatusBadge status={campaign.status} />,
    },
    {
      key: "recipients",
      label: "Recipients",
      render: (campaign) => (
        <div className="flex flex-col">
          <span className="text-slate-800 dark:text-slate-200">
            {campaign.sent_count || 0} sent
          </span>
          <span className="text-xs text-slate-500">
            {campaign.queued_count || 0} queued
          </span>
          <span className="text-xs text-red-400">
            {campaign.total_failed || 0} failed
          </span>
        </div>
      ),
    },
    {
      key: "total_recipients",
      label: "Total",
      sortable: true,
      render: (campaign) => (
        <span className="font-medium">{campaign.total_recipients ?? 0}</span>
      ),
    },
    {
      key: "sent_by",
      label: "Sent By",
      render: (campaign) => (
        <span>{campaign.profiles?.full_name || "N/A"}</span>
      ),
    },
    {
      key: "scheduled_at",
      label: "Scheduled At",
      sortable: true,
      render: (campaign) => formatDateTime(campaign.scheduled_at),
    },
  ];

  const actions = (campaign: CampaignWithDetails) => {
    if (campaign.status === "in_progress") return null;
    if (confirmingDeleteId === campaign.id) {
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Delete?</span>
          <button
            onClick={() => void handleDelete(campaign.id)}
            disabled={pendingDeleteId !== null}
            className="font-bold text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
          >
            {pendingDeleteId === campaign.id ? "Deleting…" : "Yes"}
          </button>
          <button
            onClick={() => setConfirmingDeleteId(null)}
            disabled={pendingDeleteId !== null}
            className="font-bold text-slate-600 hover:underline dark:text-slate-300 disabled:opacity-50 cursor-pointer"
          >
            No
          </button>
        </span>
      );
    }
    return (
      <div className="inline-flex items-center justify-center gap-1">
        {(campaign.status === "scheduled" || campaign.status === "draft") && (
          <button
            onClick={() => setRescheduleTarget(campaign)}
            title="Change scheduled time or send now"
            className="p-2 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <CalendarClock size={16} />
          </button>
        )}
        <button
          onClick={() => setConfirmingDeleteId(campaign.id)}
          disabled={pendingDeleteId !== null}
          title="Delete campaign"
          className="p-2 text-slate-500 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {pendingDeleteId === campaign.id ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={Send}
        />
        <StatCard
          title="Total Sent"
          value={stats.totalSent}
          icon={CheckCircle}
        />
        <StatCard
          title="Total Failed"
          value={stats.totalFailed}
          icon={XCircle}
        />
      </div>

      {actionError && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle size={15} />
          {actionError}
        </p>
      )}
      {capped && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing the {campaigns.length} most recent campaigns of{" "}
          {stats.totalCampaigns} total.
        </p>
      )}
      <DataTable
        data={campaigns}
        columns={columns}
        searchable={true}
        searchKeys={["subject", "status"]}
        pagination={true}
        itemsPerPage={15}
        actionsAlign="center"
        actions={actions}
        onRowClick={(campaign) => {
          router.push(`/admin/newsletter/${campaign.id}`);
        }}
        emptyMessage="No campaigns found."
      />

      <RescheduleCampaignModal
        isOpen={rescheduleTarget !== null}
        onClose={() => setRescheduleTarget(null)}
        campaign={rescheduleTarget}
        onSuccess={() => {
          setRescheduleTarget(null);
          router.refresh();
        }}
      />
    </div>
  );
}

