// src/app/admin/dashboard/components/QuickActions.tsx
"use client";

import { Plus, Mail, Send, UserCog, Settings } from "lucide-react";
import Link from "next/link";

export default function QuickActions({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* Primary Action: New Post */}
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-600/20 transition-all"
      >
        <Plus size={16} className="stroke-[2.5]" />
        <span>New Post</span>
      </Link>

      {/* Quick navigation icons */}
      <div className="flex items-center gap-1.5">
        <Link
          href="/admin/contacts"
          title="Contacts & Inquiries"
          aria-label="Contacts & Inquiries"
          className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111A2E]/85 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-colors"
        >
          <Mail size={16} />
        </Link>

        {isSuperAdmin && (
          <>
            <Link
              href="/admin/newsletter"
              title="Newsletter Campaigns"
              aria-label="Newsletter Campaigns"
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111A2E]/85 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-colors"
            >
              <Send size={16} />
            </Link>

            <Link
              href="/admin/users"
              title="Manage Users"
              aria-label="Manage Users"
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111A2E]/85 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-colors"
            >
              <UserCog size={16} />
            </Link>

            <Link
              href="/admin/settings"
              title="System Settings"
              aria-label="System Settings"
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111A2E]/85 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-colors"
            >
              <Settings size={16} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
