// src/app/admin/about-us/components/StudioModals.tsx
"use client";

import React, { useState } from "react";
import {
  History,
  Monitor,
  RotateCcw,
  Search,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";
import {
  type DynamicTokenContext,
  type FreeformDocument,
  type PageSeoMetadata,
} from "@/data/about-us-defaults";
import type { AboutPageRevisionSummary } from "../actions";
import FreeformPageRenderer from "@/components/page-builder/FreeformPageRenderer";
import SettingsImageUploader from "@/components/admin/SettingsImageUploader";
import Footer from "@/components/layout/Footer";
import { useNavItems } from "@/components/layout/NavProvider";

export function PreviewModal({
  isOpen,
  onClose,
  doc,
  tokenCtx,
}: {
  isOpen: boolean;
  onClose: () => void;
  doc: FreeformDocument;
  tokenCtx: DynamicTokenContext;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const navItems = useNavItems();

  if (!isOpen) return null;

  const frameWidthClass =
    device === "desktop"
      ? "w-full max-w-[1440px]"
      : device === "tablet"
        ? "w-[820px] max-w-full"
        : "w-[390px] max-w-full";

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/85 backdrop-blur-sm flex flex-col">
      <div className="h-14 px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
        <span className="text-sm font-semibold">Live About Us Preview</span>

        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          {(
            [
              { id: "desktop", icon: Monitor, label: "Desktop" },
              { id: "tablet", icon: Tablet, label: "Tablet (820px)" },
              { id: "mobile", icon: Smartphone, label: "Mobile (390px)" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                device === id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
        >
          <X size={15} />
          Close Preview
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
        <div
          className={`${frameWidthClass} bg-white rounded-xl shadow-2xl overflow-y-auto overflow-x-hidden border border-slate-700`}
        >
          {/* Synced Public Navbar Shell */}
          <div className="h-20 px-6 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-3xl font-bold text-[#008080] tracking-tight">
              kaizen
            </span>
            {device !== "mobile" && (
              <div className="flex items-center gap-5 text-xs font-semibold text-slate-600">
                {navItems.map((item) => (
                  <span key={item.key}>{item.label}</span>
                ))}
              </div>
            )}
            <span className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900">
              Contact Us
            </span>
          </div>

          <FreeformPageRenderer
            doc={doc}
            tokenCtx={tokenCtx}
            forcedBreakpoint={device === "mobile" ? "mobile" : "desktop"}
          />

          {/* Real Live Public Footer */}
          <div className="pointer-events-none select-none">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SeoModal({
  isOpen,
  onClose,
  seo,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  seo: PageSeoMetadata;
  onChange: (next: PageSeoMetadata) => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              About Us SEO &amp; Social Metadata
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Meta Title
              </span>
              <span className="text-slate-400">{seo.metaTitle.length}/60</span>
            </div>
            <input
              type="text"
              value={seo.metaTitle}
              maxLength={70}
              onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Meta Description
              </span>
              <span className="text-slate-400">
                {seo.metaDescription.length}/160
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={170}
              value={seo.metaDescription}
              onChange={(e) =>
                onChange({ ...seo, metaDescription: e.target.value })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </label>

          <SettingsImageUploader
            label="Open Graph Share Image"
            value={seo.ogImage}
            onChange={(ogImage) => onChange({ ...seo, ogImage })}
            hint="Displayed when sharing /company/about-us on LinkedIn, WhatsApp, or X."
          />

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 bg-slate-50 dark:bg-slate-900/50 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Google Search Preview
            </span>
            <p className="text-xs text-blue-600">
              https://kaizenhrms.com/company/about-us
            </p>
            <p className="text-base font-medium text-blue-700 dark:text-blue-400 truncate">
              {seo.metaTitle || "About Us"} | KaizenHR
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {seo.metaDescription || "No description provided."}
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
          >
            Done (Autosaves to Draft)
          </button>
        </div>
      </div>
    </div>
  );
}

export function RevisionsModal({
  isOpen,
  onClose,
  revisions,
  isRestoring,
  onRestore,
}: {
  isOpen: boolean;
  onClose: () => void;
  revisions: AboutPageRevisionSummary[];
  isRestoring: boolean;
  onRestore: (revisionId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Published Revision History
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
          {revisions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No published revisions recorded yet. Each time you click Publish,
              a restore point is saved automatically.
            </p>
          ) : (
            revisions.map((rev) => (
              <div
                key={rev.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      v{rev.revision_number}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {rev.created_at
                        ? new Date(rev.created_at).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 truncate">
                    {rev.change_summary || "Published update"}
                  </p>
                  {rev.created_by_name && (
                    <p className="text-[11px] text-slate-400">
                      By {rev.created_by_name}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={() => onRestore(rev.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  Load Draft
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
