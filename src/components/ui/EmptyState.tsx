import React from "react";
import { FileText } from "lucide-react";

/**
 * Shared empty state (blog lists, tables, search results).
 */
export default function EmptyState({
  title = "Nothing here yet",
  message,
  action,
  icon,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center py-20">
      {icon || <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
      {message && <p className="text-gray-600 mb-6">{message}</p>}
      {action}
    </div>
  );
}
