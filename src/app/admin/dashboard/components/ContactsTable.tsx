// src/app/admin/dashboard/components/ContactsTable.tsx
"use client";

import { useState } from "react";
import { ContactQuickView } from "@/types/dashboard";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

const getStatusColor = (status?: string | null) => {
  switch (status || "new") {
    case "new":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "contacted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "replied":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

const ITEMS_PER_PAGE = 10;

export default function ContactsTable({
  contacts,
}: {
  contacts: ContactQuickView[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(contacts.length / ITEMS_PER_PAGE);

  const paginatedContacts = contacts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          Recent Inquiries
        </h3>
        <Link
          href="/admin/contacts"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No recent inquiries found.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {contact.full_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {contact.company}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {formatDate(contact.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(contact.status)}`}
                    >
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/contacts`}
                      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
