// src/app/admin/navigation/NavigationManager.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Info,
  Lock,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  BIN_RETENTION_DAYS,
  DEFAULT_NAV_LABEL_BY_KEY,
  NAV_LABEL_MAX_LENGTH,
  type AdminNavItem,
  type NavItemKey,
} from "@/data/navbar-defaults";
import {
  moveNavItem,
  permanentlyDeleteNavItem,
  restoreNavItem,
  softDeleteNavItem,
  toggleNavItemVisibility,
  updateNavItemLabel,
} from "./actions";
import DeleteNavItemModal from "./DeleteNavItemModal";

function getBinCountdown(deletedAt: string, now: number) {
  const deletedDate = new Date(deletedAt);
  const purgeDate = new Date(
    deletedDate.getTime() + BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  const msRemaining = purgeDate.getTime() - now;
  const daysRemaining = Math.max(
    0,
    Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
  );

  return {
    deletedFormatted: deletedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    purgeFormatted: purgeDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    daysRemaining,
  };
}

export default function NavigationManager({
  initialItems,
}: {
  initialItems: AdminNavItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<AdminNavItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"active" | "bin">("active");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  // Computed after mount so server/client render the same bin labels and
  // countdowns (avoids timezone/date hydration mismatches).
  const [now, setNow] = useState<number | null>(null);

  // Inline rename state
  const [editingKey, setEditingKey] = useState<NavItemKey | null>(null);
  const [draftLabel, setDraftLabel] = useState("");

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    item: AdminNavItem;
    mode: "soft-delete" | "permanent-delete";
  } | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const activeItems = useMemo(
    () =>
      items
        .filter((i) => !i.deleted_at)
        .sort((a, b) => a.order_index - b.order_index),
    [items]
  );

  const visibleItems = useMemo(
    () => activeItems.filter((i) => i.is_visible),
    [activeItems]
  );

  const binnedItems = useMemo(
    () =>
      items
        .filter((i) => Boolean(i.deleted_at))
        .sort(
          (a, b) =>
            new Date(b.deleted_at || 0).getTime() -
            new Date(a.deleted_at || 0).getTime()
        ),
    [items]
  );

  const footerItems = useMemo(
    () => items.filter((i) => Boolean(i.footer_section)),
    [items]
  );

  const isBusy = busyKey !== null;

  const startEditing = (item: AdminNavItem) => {
    setEditingKey(item.key);
    setDraftLabel(item.label);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setDraftLabel("");
  };

  const handleMove = async (key: NavItemKey, direction: "left" | "right") => {
    if (isBusy) return;
    setBusyKey(key);
    try {
      const res = await moveNavItem(key, direction);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      if (res.items) setItems(res.items);
      toast.success(res.message);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveLabel = async (item: AdminNavItem) => {
    if (isBusy) return;
    const trimmed = draftLabel.replace(/[\r\n\t]+/g, " ").trim();
    if (!trimmed) {
      toast.error("Menu name cannot be empty.");
      return;
    }
    if (trimmed.length > NAV_LABEL_MAX_LENGTH) {
      toast.error(
        `Menu name must be ${NAV_LABEL_MAX_LENGTH} characters or fewer.`
      );
      return;
    }
    if (trimmed === item.label) {
      cancelEditing();
      return;
    }

    setBusyKey(item.key);
    try {
      const res = await updateNavItemLabel(item.key, trimmed);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      if (res.items) setItems(res.items);
      cancelEditing();
      toast.success(res.message);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleVisibility = async (item: AdminNavItem) => {
    if (isBusy) return;
    setBusyKey(item.key);
    try {
      const res = await toggleNavItemVisibility(item.key, !item.is_visible);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      if (res.items) setItems(res.items);
      toast.success(res.message);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleConfirmDelete = async (confirmText: string) => {
    if (!deleteTarget || isBusy) return;
    const { item, mode } = deleteTarget;
    setBusyKey(item.key);
    try {
      const res =
        mode === "soft-delete"
          ? await softDeleteNavItem(item.key, confirmText)
          : await permanentlyDeleteNavItem(item.key, confirmText);

      if (!res.success) {
        toast.error(res.message);
        return;
      }
      if (res.items) setItems(res.items);
      if (editingKey === item.key) cancelEditing();
      setDeleteTarget(null);
      toast.success(res.message);
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const handleRestore = async (item: AdminNavItem) => {
    if (isBusy) return;
    setBusyKey(item.key);
    try {
      const res = await restoreNavItem(item.key);
      if (res.items) setItems(res.items);
      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
      }
      router.refresh();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* LIVE PREVIEW PANEL */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Live Public Navbar Preview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Changes take effect immediately on the public Navbar, Mobile Menu,
              and synced Footer sections.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {visibleItems.length} visible
          </span>
        </div>

        {/* Simulated Public Navbar Bar */}
        <div className="p-5 overflow-x-auto bg-slate-100/70 dark:bg-slate-900/40">
          <div className="min-w-[680px] bg-white rounded-xl border border-slate-200 shadow-xs px-6 h-16 flex items-center justify-between gap-6">
            <span className="text-2xl font-bold text-[#008080] tracking-tight shrink-0">
              kaizen
            </span>

            <div className="flex items-center justify-center gap-5 flex-1 min-w-0">
              {visibleItems.length === 0 ? (
                <span className="text-xs italic text-slate-400">
                  No visible top-level menu items
                </span>
              ) : (
                visibleItems.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 whitespace-nowrap"
                  >
                    <span>{item.label}</span>
                    {item.item_type === "dropdown" && (
                      <ChevronDown size={13} className="text-slate-400" />
                    )}
                  </span>
                ))
              )}
            </div>

            <span className="shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-4 py-1.5 rounded-full font-semibold text-xs shadow-xs">
              Contact Us
              <Lock size={11} className="opacity-70" />
            </span>
          </div>
        </div>

        {/* Footer Sync Indicator Strip */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-teal-50/40 dark:bg-teal-950/20 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-teal-900 dark:text-teal-200 mr-1">
            Footer Sections Sync:
          </span>
          {footerItems.length === 0 ? (
            <span className="text-slate-500 italic">
              All footer link sections permanently removed
            </span>
          ) : (
            footerItems.map((item) => {
              const status = item.deleted_at
                ? "bin"
                : item.is_visible
                  ? "live"
                  : "hidden";
              return (
                <span
                  key={item.key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border ${
                    status === "live"
                      ? "bg-teal-100/80 text-teal-900 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-800"
                      : status === "hidden"
                        ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 line-through"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="opacity-75 text-[10px] uppercase">
                    {status === "live"
                      ? "Shown"
                      : status === "hidden"
                        ? "Hidden"
                        : "In Bin"}
                  </span>
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* TABS + POLICY NOTE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === "active"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Active Menus ({activeItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bin")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === "bin"
                ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Trash2 size={14} />
            <span>Bin ({binnedItems.length})</span>
          </button>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info size={14} className="shrink-0 text-blue-500" />
          <span>
            Adding new menus is disabled. Only the 6 canonical top-level menus
            can be managed.
          </span>
        </div>
      </div>

      {/* TAB 1: ACTIVE MENUS */}
      {activeTab === "active" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
          {activeItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              All menus are currently in the Bin or permanently deleted.
              {binnedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("bin")}
                  className="block mx-auto mt-3 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  View Bin ({binnedItems.length})
                </button>
              )}
            </div>
          ) : (
            activeItems.map((item, idx) => {
              const isEditing = editingKey === item.key;
              const isRowBusy = busyKey === item.key;
              const defaultLabel = DEFAULT_NAV_LABEL_BY_KEY[item.key];
              const isRenamed = item.label !== defaultLabel;

              return (
                <div
                  key={item.key}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    !item.is_visible
                      ? "bg-slate-50/80 dark:bg-slate-900/30"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {/* Left: Position + Left/Right Controls + Name & Metadata */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* Position + Reposition Left/Right */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center"
                        title={`Position ${idx + 1} from left`}
                      >
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === 0 || isBusy}
                        onClick={() => handleMove(item.key, "left")}
                        title="Move Left"
                        aria-label={`Move ${item.label} left`}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === activeItems.length - 1 || isBusy}
                        onClick={() => handleMove(item.key, "right")}
                        title="Move Right"
                        aria-label={`Move ${item.label} right`}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowRight size={15} />
                      </button>
                    </div>

                    {/* Label (View or Inline Edit) + Badges */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={draftLabel}
                            onChange={(e) => setDraftLabel(e.target.value)}
                            maxLength={NAV_LABEL_MAX_LENGTH}
                            autoFocus
                            disabled={isBusy}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveLabel(item);
                              } else if (e.key === "Escape") {
                                cancelEditing();
                              }
                            }}
                            className="w-full sm:w-64 px-3 py-1.5 text-sm font-semibold rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            aria-label="Edit menu name"
                          />
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {draftLabel.trim().length}/{NAV_LABEL_MAX_LENGTH}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isBusy || !draftLabel.trim()}
                              onClick={() => handleSaveLabel(item)}
                              title="Save name"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={cancelEditing}
                              title="Cancel"
                              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                            {draftLabel.trim() !== defaultLabel && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setDraftLabel(defaultLabel)}
                                title={`Reset to default ("${defaultLabel}")`}
                                className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-base font-semibold ${
                              item.is_visible
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400 dark:text-slate-500 line-through"
                            }`}
                          >
                            {item.label}
                          </span>

                          {isRenamed && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              (Default: {defaultLabel})
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.is_visible
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}
                          >
                            {item.is_visible ? "Visible" : "Hidden"}
                          </span>
                        </div>
                      )}

                      {/* Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 font-medium">
                          {item.item_type === "dropdown"
                            ? "Dropdown Menu"
                            : `Link · ${item.href}`}
                        </span>
                        {item.footer_section && (
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium">
                            Synced with Footer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Rename / Hide-Show / Delete Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pl-10 sm:pl-0">
                    <button
                      type="button"
                      disabled={isBusy || isEditing}
                      onClick={() => startEditing(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Pencil size={13} />
                      Rename
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleVisibility(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-40 ${
                        item.is_visible
                          ? "border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                          : "border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                      }`}
                    >
                      {item.is_visible ? (
                        <>
                          <EyeOff size={13} />
                          {isRowBusy ? "Updating..." : "Hide"}
                        </>
                      ) : (
                        <>
                          <Eye size={13} />
                          {isRowBusy ? "Updating..." : "Show"}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        setDeleteTarget({ item, mode: "soft-delete" })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800/70 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: 30-DAY BIN */}
      {activeTab === "bin" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <Clock size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold">
                Automatic {BIN_RETENTION_DAYS}-Day Bin Cleanup
              </p>
              <p className="leading-relaxed">
                Deleted menus stay here for{" "}
                <strong>{BIN_RETENTION_DAYS} days</strong> before being
                automatically and permanently erased by the daily maintenance
                cron job. Restore any menu before its expiration date if you
                need it back — once permanently deleted, new menus cannot be
                added.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
            {binnedItems.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Trash2
                  size={30}
                  className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
                />
                <p className="text-sm font-medium">The bin is empty.</p>
                <p className="text-xs mt-1">
                  Deleted navbar menus will appear here for {BIN_RETENTION_DAYS}{" "}
                  days before permanent removal.
                </p>
              </div>
            ) : (
              binnedItems.map((item) => {
                const countdown = item.deleted_at
                  ? now !== null
                    ? getBinCountdown(item.deleted_at, now)
                    : null
                  : null;
                const defaultLabel = DEFAULT_NAV_LABEL_BY_KEY[item.key];
                const isRowBusy = busyKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
                          {item.label}
                        </span>
                        {item.label !== defaultLabel && (
                          <span className="text-[11px] text-slate-400">
                            (Default: {defaultLabel})
                          </span>
                        )}
                        {countdown && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              countdown.daysRemaining <= 5
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}
                          >
                            <Clock size={11} />
                            {countdown.daysRemaining === 0
                              ? "Expires today"
                              : `${countdown.daysRemaining} day${
                                  countdown.daysRemaining === 1 ? "" : "s"
                                } left`}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {countdown && (
                          <>
                            <span>Deleted {countdown.deletedFormatted}</span>
                            <span>·</span>
                            <span>Auto-purges {countdown.purgeFormatted}</span>
                          </>
                        )}
                        {item.deleted_by_name && (
                          <>
                            <span>·</span>
                            <span>By {item.deleted_by_name}</span>
                          </>
                        )}
                        {item.footer_section && (
                          <>
                            <span>·</span>
                            <span className="text-teal-700 dark:text-teal-300 font-medium">
                              Synced with Footer
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestore(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <RotateCcw size={13} />
                        {isRowBusy ? "Restoring..." : "Restore"}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          setDeleteTarget({ item, mode: "permanent-delete" })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800/70 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3-Step Soft Delete & Permanent Delete Modal */}
      <DeleteNavItemModal
        item={deleteTarget?.item ?? null}
        mode={deleteTarget?.mode ?? "soft-delete"}
        isSubmitting={isBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
