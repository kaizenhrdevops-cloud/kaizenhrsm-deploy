"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  isBusy?: boolean;
};

/**
 * Generic confirm dialog (NOT delete-specific — use ConfirmDeleteModal
 * for deletes). Replaces raw confirm() calls.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "primary",
  isBusy = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modal = (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[9998]"
        onClick={onClose}
        style={{ top: 0, left: 0, right: 0, bottom: 0, position: "fixed" }}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto w-full max-w-md rounded-xl bg-white dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  variant === "danger"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-blue-100 dark:bg-blue-900/30"
                )}
              >
                {variant === "danger" ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex justify-end gap-3 p-5 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isBusy}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isBusy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
