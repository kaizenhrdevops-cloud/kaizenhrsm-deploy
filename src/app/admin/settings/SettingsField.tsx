"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white";

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {children}
    </label>
  );
}

/**
 * Single text/email/number/textarea/select settings field.
 * Collapses the ~15 identical label+input blocks in SettingsClient.
 */
export function Field({
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
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number";
  placeholder?: string;
  hint?: ReactNode;
  headerAction?: ReactNode;
  textarea?: boolean;
  rows?: number;
  mono?: boolean;
  select?: boolean;
  options?: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
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
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
      )}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/**
 * On/off settings row. Replaces the two pasted toggle blocks.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
      <div>
        <label className="text-sm font-medium text-gray-900 dark:text-white block">
          {label}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
