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
  return date.toLocaleDateString();
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "post":
      return (
        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <FileText size={16} />
        </div>
      );
    case "contact":
      return (
        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
          <Mail size={16} />
        </div>
      );
    case "campaign":
      return (
        <div className="bg-green-100 text-green-600 p-2 rounded-full">
          <Send size={16} />
        </div>
      );
    case "audit_log":
      return (
        <div className="bg-gray-100 text-gray-600 p-2 rounded-full">
          <Shield size={16} />
        </div>
      );
    default:
      return (
        <div className="bg-gray-100 text-gray-600 p-2 rounded-full">
          <Clock size={16} />
        </div>
      );
  }
};

const ITEMS_PER_PAGE = 9;

export default function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">No recent activity</div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          Recent Activity
        </h3>
        <Link
          href="/admin/audit-log"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="p-4 sm:p-6 flex-1">
        <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6 sm:space-y-8">
          {paginatedItems.map((item) => (
            <div key={item.id} className="relative pl-8">
              <div className="absolute -left-4 top-0 bg-white dark:bg-slate-800 p-1">
                <TypeIcon type={item.type} />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <Link
                    href={item.href}
                    className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  {item.subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 capitalize">
                      {item.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {item.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap mt-2 sm:mt-0">
                  {timeAgo(item.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} className="text-slate-500" />
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} className="text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
}
