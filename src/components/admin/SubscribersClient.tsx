"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  UserX,
  AlertCircle,
  Users,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Mail,
  Search,
} from "lucide-react";
import type {
  Subscriber,
  SubscriberCounts,
} from "@/app/admin/subscribers/page";

type StatusFilter = "all" | Subscriber["status"];

const EMPTY_COUNTS: SubscriberCounts = {
  total: 0,
  subscribed: 0,
  unverified: 0,
  unsubscribed: 0,
};

// Export is capped so one click can't dump an unbounded table.
const EXPORT_ROW_LIMIT = 5000;

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

/** RFC-4180 quoting + spreadsheet formula-injection guard. */
function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

const StatusBadge = ({ status }: { status: Subscriber["status"] }) => {
  const baseClasses =
    "inline-block px-2.5 py-1 text-xs font-medium rounded-full";
  const colorClasses =
    status === "subscribed"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : status === "unverified"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        : status === "unsubscribed"
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  const text = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`${baseClasses} ${colorClasses}`}>{text}</span>;
};

const StatCard = ({
  title,
  count,
  icon: Icon,
  colorClass,
}: {
  title: string;
  count: number;
  icon: typeof Users;
  colorClass: string;
}) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {count}
      </h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function SubscribersClient({
  initialRows,
  initialTotal,
  initialCounts,
  initialPage,
  initialStatus,
  initialQuery,
  pageSize,
}: {
  initialRows: Subscriber[];
  initialTotal: number;
  initialCounts: SubscriberCounts;
  initialPage: number;
  initialStatus: StatusFilter;
  initialQuery: string;
  pageSize: number;
}) {
  const [rows, setRows] = useState<Subscriber[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [counts, setCounts] = useState<SubscriberCounts>(initialCounts);
  const [page, setPage] = useState(initialPage);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(initialStatus);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [listLoading, setListLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep SSR props in sync on navigation (back/forward, revalidation).
  useEffect(() => {
    setRows(initialRows);
    setTotal(initialTotal);
    setCounts(initialCounts);
    setPage(initialPage);
    setFilterStatus(initialStatus);
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [
    initialRows,
    initialTotal,
    initialCounts,
    initialPage,
    initialStatus,
    initialQuery,
  ]);

  // Debounce the email search so we don't hammer the API per keystroke.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const fetchRows = useCallback(
    async (nextPage: number, nextStatus: StatusFilter, nextQuery: string) => {
      setListLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          pageSize: String(pageSize),
        });
        if (nextStatus !== "all") params.set("status", nextStatus);
        if (nextQuery) params.set("q", nextQuery);
        const response = await fetch(`/api/admin/subscribers?${params}`);
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load subscribers.");
        }
        setRows(data.data || []);
        setTotal(data.total || 0);
        setCounts(data.counts || EMPTY_COUNTS);
        setPage(data.page || nextPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        setListLoading(false);
      }
    },
    [pageSize]
  );

  // Refetch when the view changes (skip the SSR-provided first paint).
  const firstPaint = useRef(true);
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    void fetchRows(page, filterStatus, debouncedQuery);
  }, [page, filterStatus, debouncedQuery, fetchRows]);

  const changeFilter = (next: StatusFilter) => {
    setFilterStatus(next);
    setPage(1);
  };

  const handleUnsubscribe = async (id: string) => {
    setError(null);
    setSavingId(id);
    try {
      const response = await fetch("/api/admin/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "unsubscribed" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update subscriber.");
      }
      const updated = data as Subscriber;
      setRows((prev) =>
        prev.map((sub) => (sub.id === updated.id ? updated : sub))
      );
      // A subscribed→unsubscribed move shifts the stat cards too.
      setCounts((prev) => ({
        ...prev,
        subscribed: Math.max(0, prev.subscribed - 1),
        unsubscribed: prev.unsubscribed + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSavingId(null);
      setConfirmingId(null);
    }
  };

  const handleDownloadCSV = async () => {
    setExporting(true);
    setError(null);
    try {
      // Export exactly what's filtered on screen (not the whole table).
      const params = new URLSearchParams({
        page: "1",
        pageSize: String(EXPORT_ROW_LIMIT),
      });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (debouncedQuery) params.set("q", debouncedQuery);
      const response = await fetch(`/api/admin/subscribers?${params}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to export subscribers.");
      }
      const exportRows = (data.data || []) as Subscriber[];
      if (exportRows.length === 0) {
        setError("No subscribers to export.");
        return;
      }
      const csvHeader = "email,status,subscribed_at,verified_at\n";
      const csvRows = exportRows
        .map((s) =>
          [
            csvCell(s.email),
            csvCell(s.status),
            csvCell(formatDate(s.created_at)),
            csvCell(formatDate(s.verified_at)),
          ].join(",")
        )
        .join("\n");
      // BOM so Excel opens UTF-8 correctly.
      const blob = new Blob(["\uFEFF" + csvHeader + csvRows], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subscribers_${filterStatus}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Subscribers"
          count={counts.subscribed}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          title="Total (All Time)"
          count={counts.total}
          icon={CalendarDays}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
        />
        <StatCard
          title="Unsubscribed"
          count={counts.unsubscribed}
          icon={Clock}
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
        />
        <StatCard
          title="Unverified / Pending"
          count={counts.unverified}
          icon={AlertCircle}
          colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300"
        />
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-2"
          role="alert"
        >
          <AlertCircle size={20} />
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3 font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Toolbar: export + filter + search */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <button
          onClick={handleDownloadCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? "Exporting…" : "Download CSV"}
        </button>

        <div className="flex flex-col w-full gap-2 md:flex-row md:w-auto md:items-center">
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
            <select
              value={filterStatus}
              onChange={(e) => changeFilter(e.target.value as StatusFilter)}
              aria-label="Filter by status"
              className="w-full pl-9 pr-10 py-2 text-sm border rounded-lg appearance-none bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-[180px]"
            >
              <option value="all">All Status</option>
              <option value="subscribed">Subscribed</option>
              <option value="unverified">Unverified</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search
              className="absolute text-slate-400 transform -translate-y-1/2 left-3 top-1/2"
              size={20}
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

      {/* Table */}
      <div className="overflow-hidden bg-white border rounded-xl shadow-sm dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Email
                </th>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Subscribed At
                </th>
                <th scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                  Verified At
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {listLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">No subscribers found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      {formatDate(item.verified_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        {confirmingId === item.id ? (
                          <>
                            <span className="text-sm">Are you sure?</span>
                            <button
                              onClick={() => handleUnsubscribe(item.id)}
                              disabled={savingId === item.id}
                              className="font-bold text-red-600 hover:underline text-sm disabled:opacity-50"
                            >
                              {savingId === item.id ? "Saving…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmingId(null)}
                              disabled={savingId === item.id}
                              className="font-bold hover:underline text-sm disabled:opacity-50"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          item.status !== "unsubscribed" && (
                            <button
                              onClick={() => setConfirmingId(item.id)}
                              disabled={savingId !== null}
                              className="p-2 text-slate-500 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                              title="Unsubscribe user"
                            >
                              <UserX size={18} />
                            </button>
                          )
                        )}
                      </div>
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
