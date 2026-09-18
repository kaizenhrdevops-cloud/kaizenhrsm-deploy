"use client";

import { X, Calendar, Edit, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateMY as formatDate } from "@/lib/format";
import ContactInfoGrid from "./ContactInfoGrid";
import ContactReplySection from "./ContactReplySection";

type Contact = {
  id: string;
  full_name: string;
  business_email: string;
  contact_number: string;
  company: string;
  company_size: string;
  message: string;
  status: string;
  created_at: string;
  last_reply_at?: string | null;
};

type ContactDetailModalProps = {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: "admin" | "super_admin" | null;
  onRefresh: () => void;
  // Added onStatusChange prop
  onStatusChange?: (id: string, status: string) => void;
};

export default function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  userRole,
  onRefresh,
  onStatusChange,
}: ContactDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  // State for status editing
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(contact?.status || "");
  const [statusError, setStatusError] = useState<string | null>(null);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal status with prop
  useEffect(() => {
    if (contact) {
      setCurrentStatus(contact.status);
    }
  }, [contact]);

  // Close modal on ESC key and lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleEsc);

      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!contact) return;

    setStatusError(null);
    try {
      const response = await fetch("/api/admin/contacts/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        setIsEditingStatus(false);
        if (onStatusChange) {
          onStatusChange(contact.id, newStatus);
        }
        onRefresh(); // Refresh parent data too
      } else {
        setStatusError("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusError("An error occurred while updating status");
    }
  };

  // After any reply: auto-mark replied when it was new/contacted.
  const handleReplySent = () => {
    if (!contact) return;
    if (contact.status === "new" || contact.status === "contacted") {
      handleStatusUpdate("replied");
    } else {
      onRefresh();
    }
  };

  if (!mounted || !isOpen || !contact) return null;

  const modalContent = (
    <>
      {/* Backdrop - Full Screen Fixed */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Modal Wrapper */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        <div
          className="pointer-events-auto relative w-full max-w-4xl bg-white rounded-lg shadow-2xl dark:bg-gray-800 my-8 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Contact Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-grow">
            {statusError && (
              <div className="p-3 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                {statusError}
              </div>
            )}
            {/* Status Badge & Edit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isEditingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => handleStatusUpdate(currentStatus)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingStatus(false);
                        setCurrentStatus(contact.status);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={contact.status} />
                    <button
                      onClick={() => setIsEditingStatus(true)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                      title="Change Status"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="inline w-4 h-4 mr-1" />
                {formatDate(contact.created_at)}
              </span>
            </div>

            <ContactInfoGrid contact={contact} />

            <ContactReplySection
              contactId={contact.id}
              contactName={contact.full_name}
              contactEmail={contact.business_email}
              userRole={userRole}
              onReplySent={handleReplySent}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Portal the modal to body to ensure z-index coverage
  return createPortal(modalContent, document.body);
}
