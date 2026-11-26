// src/app/admin/navigation/DeleteNavItemModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldAlert, Trash2, X } from "lucide-react";
import {
  BIN_RETENTION_DAYS,
  type AdminNavItem,
} from "@/data/navbar-defaults";

type ModalMode = "soft-delete" | "permanent-delete";

export default function DeleteNavItemModal({
  item,
  mode,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  item: AdminNavItem | null;
  mode: ModalMode;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (confirmText: string) => void;
}) {
  // 3-step validation state for soft-delete (1: Impact -> 2: Checkboxes -> 3: Type Name)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ackWebsiteRemoval, setAckWebsiteRemoval] = useState(false);
  const [ackNoReAdd, setAckNoReAdd] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset modal validation state whenever target item or mode changes
  useEffect(() => {
    setStep(1);
    setAckWebsiteRemoval(false);
    setAckNoReAdd(false);
    setTypedConfirm("");
  }, [item?.key, mode]);

  // Focus text confirmation input when visible
  useEffect(() => {
    if (!item) return;
    if (mode === "permanent-delete" || step === 3) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [item, mode, step]);

  // Allow Escape key to close unless a submission is in flight
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, isSubmitting, onCancel]);

  if (!item) return null;

  const expectedText =
    mode === "soft-delete" ? item.label : `DELETE ${item.label}`;
  const isTextMatched = typedConfirm.trim() === expectedText.trim();
  const affectsFooter = Boolean(item.footer_section);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (mode === "soft-delete") {
      if (step === 1) {
        setStep(2);
        return;
      }
      if (step === 2) {
        if (!ackWebsiteRemoval || !ackNoReAdd) return;
        setStep(3);
        return;
      }
      if (!isTextMatched) return;
      onConfirm(typedConfirm.trim());
    } else {
      if (!ackNoReAdd || !isTextMatched) return;
      onConfirm(typedConfirm.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => {
        if (!isSubmitting) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-nav-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200 dark:border-slate-700 bg-red-50/70 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
              {mode === "permanent-delete" ? (
                <ShieldAlert size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>
            <div>
              <h2
                id="delete-nav-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {mode === "permanent-delete"
                  ? `Permanently Delete "${item.label}"`
                  : `Delete "${item.label}" Menu`}
              </h2>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                {mode === "permanent-delete"
                  ? "Irreversible action — cannot be restored or re-added"
                  : `3-Step Verification · Step ${step} of 3`}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-white/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator (Soft Delete Only) */}
        {mode === "soft-delete" && (
          <div className="px-5 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { num: 1, label: "1. Impact" },
                { num: 2, label: "2. Acknowledge" },
                { num: 3, label: "3. Verify Name" },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`text-center py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                    step === s.num
                      ? "bg-red-600 text-white border-red-600"
                      : step > s.num
                        ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        : "bg-slate-50 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {mode === "soft-delete" ? (
              <>
                {/* STEP 1: Impact Review */}
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      You are about to remove{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.label}
                      </span>{" "}
                      from the public navigation and move it to the Bin.
                    </p>

                    <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-2 text-sm text-amber-950 dark:text-amber-200">
                      <p className="font-semibold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        What will be affected immediately
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed">
                        <li>
                          Removed from the <strong>Desktop Navbar</strong>
                          {item.item_type === "dropdown"
                            ? " (including its dropdown panel)"
                            : ""}
                          .
                        </li>
                        <li>
                          Removed from the <strong>Mobile Menu</strong>.
                        </li>
                        {affectsFooter && (
                          <li>
                            Removed from the <strong>Public Footer</strong>{" "}
                            (the{" "}
                            <strong>{item.label}</strong> link section will
                            disappear).
                          </li>
                        )}
                        <li>
                          Kept in the <strong>Bin</strong> for{" "}
                          <strong>{BIN_RETENTION_DAYS} days</strong>, after
                          which it is automatically and permanently erased.
                        </li>
                        <li>
                          <strong>New menus cannot be added</strong> from the
                          admin dashboard once permanently erased.
                        </li>
                      </ul>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tip: If you only want to remove this menu temporarily
                      without risking permanent deletion, use{" "}
                      <strong>Hide</strong> instead.
                    </p>
                  </div>
                )}

                {/* STEP 2: Dual Acknowledgement Checkboxes */}
                {step === 2 && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Please confirm both statements below before continuing:
                    </p>

                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 cursor-pointer hover:border-red-300 dark:hover:border-red-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={ackWebsiteRemoval}
                        onChange={(e) => setAckWebsiteRemoval(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        I confirm I want to remove{" "}
                        <strong>{item.label}</strong> from the live Navbar
                        {affectsFooter ? " and Footer" : ""}.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 cursor-pointer hover:border-red-300 dark:hover:border-red-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={ackNoReAdd}
                        onChange={(e) => setAckNoReAdd(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        I understand it will stay in the Bin for{" "}
                        <strong>{BIN_RETENTION_DAYS} days</strong> and then be
                        permanently deleted (and new menus cannot be added
                        back).
                      </span>
                    </label>
                  </div>
                )}

                {/* STEP 3: Exact Name Verification */}
                {step === 3 && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Final check: type the exact menu name below to move{" "}
                      <strong>{item.label}</strong> to the Bin.
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Type exactly:</span>
                      <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-semibold border border-slate-200 dark:border-slate-700 select-all">
                        {expectedText}
                      </code>
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      value={typedConfirm}
                      onChange={(e) => setTypedConfirm(e.target.value)}
                      placeholder={expectedText}
                      autoComplete="off"
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                    />
                  </div>
                )}
              </>
            ) : (
              /* PERMANENT DELETE FROM BIN */
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 dark:border-red-800/70 bg-red-50/70 dark:bg-red-950/30 p-4 text-xs text-red-900 dark:text-red-200 leading-relaxed">
                  <strong>Warning:</strong> Permanently deleting{" "}
                  <strong>{item.label}</strong> skips the remaining{" "}
                  {BIN_RETENTION_DAYS}-day recovery window. Because new menus
                  cannot be created in the admin dashboard, this item cannot be
                  restored once deleted.
                </div>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ackNoReAdd}
                    onChange={(e) => setAckNoReAdd(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    I understand this deletion is permanent and irreversible.
                  </span>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Type exactly:</span>
                    <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-semibold border border-slate-200 dark:border-slate-700 select-all">
                      {expectedText}
                    </code>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={typedConfirm}
                    onChange={(e) => setTypedConfirm(e.target.value)}
                    placeholder={expectedText}
                    autoComplete="off"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div>
              {mode === "soft-delete" && step > 1 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              {mode === "soft-delete" && step === 1 && (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                >
                  Proceed to Step 2
                </button>
              )}

              {mode === "soft-delete" && step === 2 && (
                <button
                  type="submit"
                  disabled={!ackWebsiteRemoval || !ackNoReAdd}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Proceed to Final Step
                </button>
              )}

              {mode === "soft-delete" && step === 3 && (
                <button
                  type="submit"
                  disabled={!isTextMatched || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                  {isSubmitting ? "Moving to Bin..." : "Move to Bin"}
                </button>
              )}

              {mode === "permanent-delete" && (
                <button
                  type="submit"
                  disabled={!ackNoReAdd || !isTextMatched || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                  {isSubmitting ? "Deleting..." : "Delete Permanently"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
