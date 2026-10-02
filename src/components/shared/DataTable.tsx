// src/components/shared/DataTable.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pagination?: boolean;
  itemsPerPage?: number;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  actionsLabel?: string;
  actionsAlign?: "right" | "center" | "left";
  emptyMessage?: string;
  className?: string;
  headerActions?: React.ReactNode;
  filterControls?: React.ReactNode;
  /** Stable row identity. Defaults to item.id (falls back to index). */
  rowKey?: (item: T, index: number) => React.Key;
};

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchKeys = [],
  pagination = false,
  itemsPerPage = 10,
  onRowClick,
  actions,
  actionsLabel = "Actions",
  actionsAlign = "right",
  emptyMessage = "No data available",
  className = "",
  headerActions,
  filterControls,
  rowKey,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchable, searchKeys]);

  // Sorting after filtering
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Reset to page 1 when search or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data]); // Changed useMemo to useEffect to avoid side-effects in render

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header: actions + search */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex-shrink-0">{headerActions}</div>

        <div className="flex flex-col w-full gap-2 md:flex-row md:w-auto md:items-center">
          {filterControls}
          {searchable && (
            <div className="relative w-full md:max-w-xs">
              <Search
                className="absolute text-slate-400 transform -translate-y-1/2 left-3 top-1/2"
                size={20}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-slate-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border rounded-xl shadow-sm dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-4 font-medium whitespace-nowrap ${column.className || ""} ${
                      column.sortable
                        ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        : ""
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            size={10}
                            className={`-mb-0.5 ${
                              sortConfig?.key === column.key &&
                              sortConfig.direction === "asc"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-400"
                            }`}
                          />
                          <ChevronDown
                            size={10}
                            className={`-mt-0.5 ${
                              sortConfig?.key === column.key &&
                              sortConfig.direction === "desc"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}

                {actions && (
                  <th
                    scope="col"
                    className={`px-6 py-4 font-medium whitespace-nowrap ${
                      actionsAlign === "center"
                        ? "text-center"
                        : actionsAlign === "left"
                        ? "text-left"
                        : "text-right"
                    }`}
                  >
                    <span>{actionsLabel}</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center py-4">
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={rowKey ? rowKey(item, index) : (item.id ?? index)}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-slate-900 dark:text-slate-200 ${
                          column.className || ""
                        }`}
                      >
                        {column.render
                          ? column.render(item)
                          : (item[column.key] ?? (
                              <span className="text-slate-400">-</span>
                            ))}
                      </td>
                    ))}

                    {actions && (
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-2 ${
                            actionsAlign === "center"
                              ? "justify-center"
                              : actionsAlign === "left"
                              ? "justify-start"
                              : "justify-end"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- UPDATED: Pagination Footer (Matching Audit Log Style) --- */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
