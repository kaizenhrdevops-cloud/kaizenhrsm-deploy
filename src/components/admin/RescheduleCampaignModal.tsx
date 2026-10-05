"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarClock,
  Send,
  Loader2,
  X,
} from "lucide-react";
import {
  updateCampaignSchedule,
  sendCampaignNow,
} from "@/app/admin/blog/newsletterActions";
import type { CampaignWithDetails } from "@/types/newsletter";
import { formatDateTime } from "@/components/admin/NewsletterBadges";
import DateTimePicker from "@/components/admin/DateTimePicker";
import { toast } from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignWithDetails | null;
  onSuccess: () => void;
};

function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = date.getDate();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const getPresetTonight = (hour: number) => {
  const d = new Date();
  if (d.getHours() >= hour) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(hour, 0, 0, 0);
  return toDatetimeLocalString(d);
};

export default function RescheduleCampaignModal({
  isOpen,
  onClose,
  campaign,
  onSuccess,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNow, setIsSendingNow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (campaign?.scheduled_at) {
      const d = new Date(campaign.scheduled_at);
      if (!isNaN(d.getTime())) {
        setScheduledDateTime(toDatetimeLocalString(d));
      } else {
        setScheduledDateTime(getPresetTonight(22));
      }
    } else {
      setScheduledDateTime(getPresetTonight(22));
    }
  }, [campaign]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isSaving && !isSendingNow) onClose();
      };
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose, isSaving, isSendingNow]);

  if (!mounted || !isOpen || !campaign) return null;

  const handleUpdate = async () => {
    if (!scheduledDateTime) {
      toast.error("Please pick a scheduled date and time.");
      return;
    }
    const targetTime = new Date(scheduledDateTime).getTime();
    if (isNaN(targetTime)) {
      toast.error("Invalid scheduled date/time.");
      return;
    }
    if (targetTime <= Date.now()) {
      toast.error("Scheduled time must be in the future, or click 'Send Now Instead'.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Updating scheduled time...");
    try {
      const result = await updateCampaignSchedule(
        campaign.id,
        scheduledDateTime
      );
      if (result.success) {
        toast.success(result.message, { id: toastId });
        onSuccess();
        onClose();
      } else {
        toast.error(result.message, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update schedule.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    setIsSendingNow(true);
    const toastId = toast.loading("Starting immediate delivery...");
    try {
      const result = await sendCampaignNow(campaign.id);
      if (result.success) {
        toast.success(result.message, { id: toastId });
        onSuccess();
        onClose();
      } else {
        toast.error(result.message, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send campaign.", { id: toastId });
    } finally {
      setIsSendingNow(false);
    }
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={!isSaving && !isSendingNow ? onClose : undefined}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-600 rounded-xl text-white shadow-md">
                <CalendarClock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reschedule Campaign
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Change delivery time for this newsletter
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving || isSendingNow}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Campaign Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Campaign Subject
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {campaign.subject}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{campaign.total_recipients} recipient(s)</span>
                <span>•</span>
                <span>
                  Current:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatDateTime(campaign.scheduled_at)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Interactive DateTimePicker */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                Select Exact Date &amp; Time (MYT GMT+8)
              </label>
              <DateTimePicker
                value={scheduledDateTime}
                onChange={setScheduledDateTime}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky bottom-0 z-10 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleSendNow}
              disabled={isSaving || isSendingNow}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50 cursor-pointer"
              title="Start sending right now without waiting"
            >
              {isSendingNow ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>Send Now Instead</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isSendingNow}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isSaving || isSendingNow || !scheduledDateTime}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CalendarClock size={14} />
                )}
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
