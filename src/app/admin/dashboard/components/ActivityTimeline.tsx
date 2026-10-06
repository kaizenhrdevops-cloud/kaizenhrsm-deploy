// src/app/admin/dashboard/components/ActivityTimeline.tsx
"use client";

import { useState } from "react";
import { ActivityItem } from "@/types/dashboard";
import {
  FileText,
  Mail,
  Send,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "post":
      return (
        <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25 shadow-xs">
          <FileText size={15} />
        </div>
      );
    case "contact":
      return (
        <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25 shadow-xs">
          <Mail size={15} />
        </div>
      );
    case "campaign":
      return (
        <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25 shadow-xs">
          <Send size={15} />
        </div>
      );
    case "audit_log":
      return (
        <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25 shadow-xs">
          <Shield size={15} />
        </div>
      );
    default:
      return (
        <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 shadow-xs">
          <Clock size={15} />
        </div>
      );
  }
};

const ITEMS_PER_PAGE = 7;

export default function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm p-6 text-center py-12 text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm flex flex-col h-full transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
            Recent Activity
          </h3>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <Link
          href="/admin/audit-log"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group"
        >
          <span>Audit Log</span>
          <ArrowRight
            size={13}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* Feed Items */}
      <div className="p-4 sm:p-5 flex-1">
        <div className="relative border-l border-slate-200/80 dark:border-slate-800/90 ml-3 sm:ml-3.5 space-y-4 sm:space-y-5">
          {paginatedItems.map((item) => (
            <div key={item.id} className="relative pl-6 sm:pl-7 group">
              {/* Icon node on timeline */}
              <div className="absolute -left-3.5 sm:-left-4 top-0 bg-white dark:bg-[#111A2E] p-0.5 rounded-full transition-transform group-hover:scale-110">
                <TypeIcon type={item.type} />
              </div>

              {/* Item Details */}
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={item.href}
                    className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>

                {item.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </p>
                )}

                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 capitalize">
                    {item.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {item.type.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/30 rounded-b-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
