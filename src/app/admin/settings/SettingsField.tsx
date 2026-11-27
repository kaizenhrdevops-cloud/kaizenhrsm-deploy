// src/app/admin/settings/SettingsField.tsx
"use client";

import type { ReactNode } from "react";
import { Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500";

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
      {children}
    </label>
  );
}

/**
 * Grouped settings card with plain-English subtitle and "Shown on" badge
 * so new super_admins immediately understand what each group controls.
 */
export function SettingsCard({
  title,
  description,
  whereUsed,
  headerAction,
  danger,
  children,
}: {
  title: string;
  description?: string;
  whereUsed?: string;
  headerAction?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border overflow-hidden transition-colors",
        danger
          ? "border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"
      )}
    >
      <div
        className={cn(
          "px-5 py-4 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-2",
          danger
            ? "border-red-200/80 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20"
            : "border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40"
        )}
      >
        <div className="space-y-0.5">
          <h3
            className={cn(
              "text-sm font-semibold",
              danger
                ? "text-red-900 dark:text-red-300"
                : "text-slate-900 dark:text-white"
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {whereUsed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/60">
              <Globe size={11} />
              <span>{whereUsed}</span>
            </span>
          )}
          {headerAction}
        </div>
      </div>

      <div className="p-5 space-y-5">{children}</div>
    </section>
  );
}

/**
 * Single text/email/number/textarea/select settings field.
 */
export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  headerAction,
  textarea,
  rows = 3,
  mono,
  select,
  options,
  clearable,
  highlighted,
}: {
  id?: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number" | "url";
  placeholder?: string;
  hint?: ReactNode;
  headerAction?: ReactNode;
  textarea?: boolean;
  rows?: number;
  mono?: boolean;
  select?: boolean;
  options?: { value: string; label: string }[];
  clearable?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      id={id}
      className={cn(
        "space-y-1.5 rounded-lg transition-all",
        highlighted &&
          "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/30 p-3 -m-3"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {headerAction}
      </div>

      {select && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(INPUT_CLASS, mono && "font-mono text-xs")}
        />
      ) : (
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              INPUT_CLASS,
              mono && "font-mono text-xs",
              clearable && value && "pr-9"
            )}
          />
          {clearable && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              title="Clear field"
              aria-label="Clear field"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {hint && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * On/off settings row with optional danger styling for high-impact switches.
 */
export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  danger,
  highlighted,
}: {
  id?: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  danger?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      id={id}
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-xl border transition-all",
        danger && checked
          ? "border-red-300 bg-red-50/80 dark:border-red-800 dark:bg-red-950/40"
          : "border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30",
        highlighted && "ring-2 ring-blue-500"
      )}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {label}
          </span>
          {danger && checked && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            "w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
            danger
              ? "peer-focus:ring-red-300 dark:peer-focus:ring-red-800 peer-checked:bg-red-600"
              : "peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600"
          )}
        />
      </label>
    </div>
  );
}
