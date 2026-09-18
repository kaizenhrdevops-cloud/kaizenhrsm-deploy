// src/app/admin/newsletter/[campaign_id]/CampaignDetailsClient.tsx
"use client";

import { useState, useMemo } from "react";
import DataTable, { type Column } from "@/components/shared/DataTable";
import { CampaignWithDetails, SendLog } from "./page"; // Import types from server
import { cn } from "@/lib/utils";
import {
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  MailWarning, // Use a different icon for queued
} from "lucide-react";
import Link from "next/link";

// --- ✅ ADDED: Your StatCard component ---
function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow dark:bg-slate-800">
      <div className="flex items-center">
        <div className="p-2 mr-3 bg-blue-100 rounded-full dark:bg-blue-900">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
// --- END ---

// Helper to format dates
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper to generate a status badge
const StatusBadge = ({ status }: { status: string | null }) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full";
  let colorClasses = "";
  const text =
    (status || "unknown").charAt(0).toUpperCase() +
    (status || "unknown").slice(1);
  let icon = <Clock size={12} />;

  switch (status) {
    case "sent":
      colorClasses =
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      icon = <CheckCircle size={12} />;
      break;
    case "queued":
      colorClasses =
        "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      icon = <Clock size={12} />;
      break;
    case "failed":
      colorClasses =
        "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      icon = <AlertCircle size={12} />;
      break;
    default:
      colorClasses =
        "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  }
  return (
    <span className={cn(baseClasses, colorClasses)}>
      {icon} {text}
    </span>
  );
};

export default function CampaignDetailsClient({
  campaign,
  logs,
}: {
  campaign: CampaignWithDetails;
  logs: SendLog[];
}) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    if (statusFilter === "all") return logs;
    return logs.filter((log) => log.status === statusFilter);
  }, [logs, statusFilter]);

  const postPath =
    campaign.posts?.category === "blog"
      ? "resources/blog-articles"
      : "company/developments";
  const postUrl = campaign.posts ? `/${postPath}/${campaign.posts.slug}` : null;

  const columns: Column<SendLog>[] = [
    {
      key: "email",
      label: "Recipient Email",
      render: (log) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {log.email}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (log) => <StatusBadge status={log.status} />,
    },
    {
      key: "sent_at",
      label: "Sent At",
      sortable: true,
      render: (log) => formatDate(log.sent_at),
    },
    {
      key: "error_message",
      label: "Error",
      render: (log) => (
        <span className="text-xs text-red-500 dark:text-red-400">
          {log.error_message || "N/A"}
        </span>
      ),
    },
  ];

  const filterControls = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="w-full sm:w-48 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
    >
      <option value="all">All Statuses</option>
      <option value="queued">Queued</option>
      <option value="sent">Sent</option>
      <option value="failed">Failed</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {campaign.subject}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Sent by {campaign.profiles?.full_name || "Unknown"} on{" "}
          {formatDate(campaign.scheduled_at)}
        </p>
        {postUrl && (
          <Link
            href={postUrl}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400 mt-3"
          >
            <LinkIcon size={14} />
            View Original Post
          </Link>
        )}
      </div>

      {/* --- ✅ YOUR STAT CARDS, populated with CORRECT data --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Mail}
          title="Total Recipients"
          value={campaign.total_recipients}
        />
        <StatCard
          icon={Send}
          title="Successfully Sent"
          value={campaign.sent_count || 0}
        />
        <StatCard
          icon={MailWarning} // Using this for Queued
          title="Queued"
          value={campaign.queued_count || 0}
        />
        <StatCard
          icon={AlertCircle}
          title="Failed"
          value={campaign.total_failed || 0}
        />
      </div>
      {/* --- END --- */}

      <DataTable
        data={filteredLogs}
        columns={columns}
        searchable={true}
        searchKeys={["email", "error_message"]}
        filterControls={filterControls}
        pagination={true}
        itemsPerPage={20}
        emptyMessage="No logs found for this campaign."
      />
    </div>
  );
}
