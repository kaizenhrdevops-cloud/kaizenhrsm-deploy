// src/app/admin/dashboard/components/ContactsTable.tsx
"use client";

import { useState, useMemo } from "react";
import { ContactQuickView } from "@/types/dashboard";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Inbox,
} from "lucide-react";
import Link from "next/link";

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

const getStatusBadge = (status?: string | null) => {
  const norm = (status || "new").toLowerCase();
  switch (norm) {
    case "new":
      return {
        label: "New",
        classes:
          "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
        dot: "bg-amber-500",
      };
    case "contacted":
      return {
        label: "Contacted",
        classes:
          "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25",
        dot: "bg-blue-500",
      };
    case "replied":
      return {
        label: "Replied",
        classes:
          "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25",
        dot: "bg-emerald-500",
      };
    default:
      return {
        label: norm,
        classes:
          "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60",
        dot: "bg-slate-400",
      };
  }
};

const ITEMS_PER_PAGE = 8;

export default function ContactsTable({
  contacts,
}: {
  contacts: ContactQuickView[];
}) {
  const [filter, setFilter] = useState<"all" | "new" | "replied">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const newCount = useMemo(
    () => contacts.filter((c) => (c.status || "new") === "new").length,
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    if (filter === "all") return contacts;
    if (filter === "new") {
      return contacts.filter((c) => (c.status || "new") === "new");
    }
    return contacts.filter((c) => c.status === "replied");
  }, [contacts, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / ITEMS_PER_PAGE));

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  const handleFilterChange = (newFilter: "all" | "new" | "replied") => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm flex flex-col h-full transition-all">
      {/* Header with Title, Filter Tabs, and View All */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
            Recent Contacts
          </h3>
          {newCount > 0 && (
            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {newCount} pending
            </span>
          )}
        </div>

        {/* Filter buttons & Link */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50 text-xs">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange("new")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "new"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              New
            </button>
            <button
              onClick={() => handleFilterChange("replied")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "replied"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Replied
            </button>
          </div>

          <Link
            href="/admin/contacts"
            className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group shrink-0"
          >
            <span>View All</span>
            <ArrowRight
              size={13}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {filteredContacts.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No contacts in this view
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {filter === "all"
                ? "Submissions from your website contact form will appear here."
                : `No contacts currently marked as "${filter}".`}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedContacts.map((contact) => {
                const badge = getStatusBadge(contact.status);
                const initials = contact.full_name
                  ? contact.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "?";

                return (
                  <div
                    key={contact.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {contact.full_name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {contact.company || "No company"}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.classes}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                            />
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(contact.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/contacts?search=${encodeURIComponent(contact.full_name)}`}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all shrink-0"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout (>= 768px) */}
            <table className="w-full text-left text-sm hidden md:table">
              <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 sticky top-0">
                <tr>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedContacts.map((contact) => {
                  const badge = getStatusBadge(contact.status);
                  const initials = contact.full_name
                    ? contact.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "?";

                  return (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                            {initials}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px] lg:max-w-none">
                            {contact.full_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs">
                        {contact.company || "—"}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                        {formatDate(contact.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.classes}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                          />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/contacts?search=${encodeURIComponent(contact.full_name)}`}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Footer / Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/30 rounded-b-2xl">
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
