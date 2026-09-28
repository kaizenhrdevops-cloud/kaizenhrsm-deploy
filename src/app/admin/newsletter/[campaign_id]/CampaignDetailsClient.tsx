// src/app/admin/newsletter/[campaign_id]/CampaignDetailsClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  Loader2,
  Mail,
  MailWarning,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  cancelCampaign,
  deleteCampaign,
  retryCampaign,
} from "@/app/admin/blog/newsletterActions";
import {
  CampaignStatusBadge,
  SendLogStatusBadge,
  StatCard,
  formatDateTime,
} from "@/components/admin/NewsletterBadges";
import type {
  CampaignWithDetails,
  LogStatusCounts,
  SendLog,
} from "@/types/newsletter";
import { EMPTY_LOG_COUNTS } from "@/types/newsletter";

type LogStatusFilter =
  | "all"
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "bounced";

type PendingAction = "retry" | "cancel" | "delete" | null;

export default function CampaignDetailsClient({
  campaign,
  initialLogs,
  initialTotal,
  initialCounts,
  pageSize,
}: {
  campaign: CampaignWithDetails;
  initialLogs: SendLog[];
  initialTotal: number;
  initialCounts: LogStatusCounts;
  pageSize: number;
}) {
  const router = useRouter();
  const [logs, setLogs] = useState<SendLog[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [counts, setCounts] = useState<LogStatusCounts>(initialCounts);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LogStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [listLoading, setListLoading] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmingAction, setConfirmingAction] = useState<PendingAction>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep SSR props in sync on navigation/refresh.
  useEffect(() => {
    setLogs(initialLogs);
    setTotal(initialTotal);
    setCounts(initialCounts);
    setPage(1);
  }, [initialLogs, initialTotal, initialCounts, campaign.id]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const fetchLogs = useCallback(
    async (nextPage: number, nextStatus: LogStatusFilter, nextQuery: string) => {
      setListLoading(true);
      try {
        const params = new URLSearchParams({
          campaign: campaign.id,
          page: String(nextPage),
          pageSize: String(pageSize),
        });
        if (nextStatus !== "all") params.set("status", nextStatus);
        if (nextQuery) params.set("q", nextQuery);
        const response = await fetch(`/api/admin/newsletter/logs?${params}`);
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load send logs.");
        }
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setCounts(data.counts || EMPTY_LOG_COUNTS);
        setPage(data.page || nextPage);
      } catch {
        // Table keeps stale rows; the toolbar shows the failure below.
        setActionError("Could not refresh send logs. Showing cached rows.");
      } finally {
        setListLoading(false);
      }
    },
    [campaign.id, pageSize]
  );

  const firstPaint = useRef(true);
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    void fetchLogs(page, statusFilter, debouncedQuery);
  }, [page, statusFilter, debouncedQuery, fetchLogs]);

  const changeFilter = (next: LogStatusFilter) => {
    setStatusFilter(next);
    setPage(1);
  };

  const runAction = async (action: Exclude<PendingAction, null>) => {
    setPendingAction(action);
    setActionError(null);
    setActionOk(null);
    try {
      const result =
        action === "retry"
          ? await retryCampaign(campaign.id)
          : action === "cancel"
            ? await cancelCampaign(campaign.id)
            : await deleteCampaign(campaign.id);
      if (!result.success) {
        setActionError(result.message);
        return;
      }
      if (action === "delete") {
        router.push("/admin/newsletter");
        return;
      }
      setActionOk(result.message);
      router.refresh();
    } finally {
      setPendingAction(null);
      setConfirmingAction(null);
    }
  };

  const postPath =
    campaign.posts?.category === "blog"
      ? "resources/blog-articles"
      : "company/developments";
  const postUrl = campaign.posts?.slug ? `/${postPath}/${campaign.posts.slug}` : null;

  const canRetry = campaign.status === "failed";
  const canCancel =
    campaign.status === "scheduled" || campaign.status === "in_progress";
  const canDelete = campaign.status !== "in_progress";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const errorDetails =
    campaign.status === "failed"
      ? ((campaign.error_details as { error?: string } | null)?.error ?? null)
      : null;

  const actionButton = (
    action: Exclude<PendingAction, null>,
    label: string,
    busyLabel: string,
    className: string
  ) => {
    if (confirmingAction === action) {
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Are you sure?</span>
          <button
            onClick={() => void runAction(action)}
            disabled={pendingAction !== null}
            className="font-bold text-red-600 hover:underline disabled:opacity-50"
          >
            {pendingAction === action ? busyLabel : "Yes"}
          </button>
          <button
            onClick={() => setConfirmingAction(null)}
            disabled={pendingAction !== null}
            className="font-bold text-slate-600 hover:underline dark:text-slate-300 disabled:opacity-50"
          >
            No
          </button>
        </span>
      );
    }
    return (
      <button
        onClick={() => setConfirmingAction(action)}
        disabled={pendingAction !== null}
        className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${className}`}
      >
        {pendingAction === action ? (
          <Loader2 size={15} className="animate-spin" />
        ) : null}
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {campaign.subject}
              </h2>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Sent by {campaign.profiles?.full_name || "Unknown"} · Scheduled{" "}
              {formatDateTime(campaign.scheduled_at)}
              {campaign.completed_at
                ? ` · Completed ${formatDateTime(campaign.completed_at)}`
                : ""}
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
          <div className="flex flex-wrap items-center gap-2">
            {canRetry &&
              actionButton(
                "retry",
                "Retry failed",
                "Retrying…",
                "text-white bg-blue-600 hover:bg-blue-700"
              )}
            {canCancel &&
              actionButton(
                "cancel",
                "Cancel",
                "Cancelling…",
                "text-white bg-amber-600 hover:bg-amber-700"
              )}
            {canDelete &&
              actionButton(
                "delete",
                "Delete",
                "Deleting…",
                "text-red-600 border border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              )}
          </div>
        </div>

        {actionError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertCircle size={15} />
            {actionError}
          </p>
        )}
        {actionOk && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">
            {actionOk}
          </p>
        )}
        {errorDetails && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Failure reason
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-300 font-mono break-words">
              {errorDetails}
            </p>
          </div>
        )}
      </div>

      {/* Stat cards: live breakdown (server counts) + campaign counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Mail} title="Total Recipients" value={campaign.total_recipients ?? 0} />
        <StatCard icon={Send} title="Sent" value={counts.sent} />
        <StatCard icon={MailWarning} title="Queued" value={counts.queued} />
        <StatCard icon={Clock} title="Sending" value={counts.sending} />
        <StatCard icon={AlertCircle} title="Failed" value={counts.failed} />
        <StatCard icon={Ban} title="Bounced" value={counts.bounced} />
      </div>
      {(counts.total !== (campaign.total_recipients ?? 0) ||
        counts.sent !== (campaign.sent_count ?? 0)) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Live log rows ({counts.total}) can differ from the campaign snapshot
          below when recipients unsubscribed mid-send (their rows are removed)
          or old rows were pruned by retention cleanup — counters are the
          source of truth for totals.
        </p>
      )}

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          <RotateCcw size={14} />
          {listLoading ? "Refreshing…" : `${total} recipient${total === 1 ? "" : "s"}`}
        </div>
        <div className="flex flex-col w-full gap-2 md:flex-row md:w-auto md:items-center">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => changeFilter(e.target.value as LogStatusFilter)}
              aria-label="Filter by status"
              className="w-full sm:w-48 pl-3 pr-9 py-2 text-sm border rounded-lg appearance-none bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="queued">Queued</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </select>
            <ChevronDown
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search
              size={18}
              className="absolute text-slate-400 transform -translate-y-1/2 left-3 top-1/2"
            />
            <input
              type="text"
              placeholder="Search email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search by email"
              className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="overflow-hidden bg-white border rounded-xl shadow-sm dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Recipient Email
                </th>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Sent At
                </th>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {listLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">No logs found for this campaign.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {log.email}
                    </td>
                    <td className="px-6 py-4">
                      <SendLogStatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      {formatDateTime(log.sent_at)}
                    </td>
                    <td className="px-6 py-4">
                      {log.status === "failed" && log.error_message ? (
                        <span className="text-xs text-red-500 dark:text-red-400">
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || listLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages} · {total} total
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || listLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
