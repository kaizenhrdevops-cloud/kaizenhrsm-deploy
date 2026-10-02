// src/app/admin/audit-log/audit-log-table.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  details: any;
  created_at: string;
  admin: {
    full_name: string | null;
    email: string;
  } | null;
};

const ITEMS_PER_PAGE = 25;

export default function AuditLogTable({
  initialLogs,
}: {
  initialLogs: AuditLog[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter States
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if the underlying data changes (e.g. new filter applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [initialLogs]);

  // Debounce filter application
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const newQuery = params.toString();
      if (searchParams.toString() !== newQuery) {
        router.replace(`/admin/audit-log?${newQuery}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, dateFrom, dateTo, router, searchParams]);

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    router.replace("/admin/audit-log");
  };

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getPrimaryMessage = (details: any) => {
    if (!details) return "-";
    if (typeof details === "string") return details;
    if (details.message) return String(details.message);
    try {
      return JSON.stringify(details).replace(/[{}"]/g, " ").trim();
    } catch {
      return "-";
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(initialLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = initialLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center px-3 py-2 border-r border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 font-medium mr-2 uppercase tracking-wider">
                From
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none w-auto cursor-pointer"
              />
            </div>
            <div className="flex items-center px-3 py-2">
              <span className="text-xs text-slate-500 font-medium mr-2 uppercase tracking-wider">
                To
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none w-auto cursor-pointer"
              />
            </div>
          </div>

          {(dateFrom || dateTo || searchTerm) && (
            <button
              onClick={clearFilters}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
              title="Clear Filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Admin</th>
              <th className="px-6 py-3 min-w-[280px]">Details</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Calendar size={32} className="text-slate-300 mb-2" />
                    <p>No logs found matching your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <span className="truncate max-w-[150px] block">
                      {log.admin?.full_name || log.admin?.email || "System"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <div className="max-w-md flex items-center gap-2">
                      <div className="overflow-x-auto whitespace-nowrap scrollbar-thin py-1 font-mono text-xs text-slate-700 dark:text-slate-300 flex-1">
                        {getPrimaryMessage(log.details)}
                      </div>
                      {log.details && typeof log.details === "object" && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 shrink-0 font-sans font-medium px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          title="View complete payload"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {selectedLog.action}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                  Admin
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  {selectedLog.admin?.full_name
                    ? `${selectedLog.admin.full_name} (${selectedLog.admin.email})`
                    : selectedLog.admin?.email || "System"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                  Details Payload
                </p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
