import React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared card shell (dashboard charts, stat panels, settings sections).
 */
export default function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200",
        "dark:border-slate-700 shadow-sm p-6",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {typeof title === "string" ? (
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {title}
            </h3>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
