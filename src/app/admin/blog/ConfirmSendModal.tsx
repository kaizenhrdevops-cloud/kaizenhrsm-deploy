"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Users,
  Loader2,
  X,
  FileText,
  CalendarClock,
  Eye,
  Sparkles,
  Clock,
  Send,
  Check,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import {
  getNewsletterModalData,
  scheduleNewsletter,
  type ScheduleMode,
} from "./newsletterActions";
import type { PostWithAuthor } from "./posts-client";
import { toast } from "react-hot-toast";
import DateTimePicker from "@/components/admin/DateTimePicker";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithAuthor | null;
  onSendComplete: () => void;
};

type NewsletterData = {
  adminEmail: string;
  postTitle: string;
  postPreview: string;
  postImage: string | null;
  subscriberCount: number;
  dailyQuota?: number;
  frequency?: "daily" | "weekly";
  nextAutoSlot?: string;
  newsletterAllowanceToday?: number | null;
  reserve?: number;
};

function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
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

const getPresetTomorrow = (hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return toDatetimeLocalString(d);
};

const getDefaultScheduleTime = () => {
  const now = new Date();
  if (now.getHours() < 22) {
    return getPresetTonight(22);
  } else if (now.getHours() < 23) {
    return getPresetTonight(23);
  } else {
    return getPresetTomorrow(10);
  }
};

function formatMYTDateTime(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function ConfirmSendModal({
  isOpen,
  onClose,
  post,
  onSendComplete,
}: ModalProps) {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [confirmingSchedule, setConfirmingSchedule] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Delivery timing states: "auto" | "now" | "custom"
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("auto");
  const [customDateTime, setCustomDateTime] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isScheduling) onClose();
      };
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose, isScheduling]);

  useEffect(() => {
    if (isOpen && post) {
      setLoading(true);
      setError(null);
      setData(null);
      setConfirmingSchedule(false);
      setScheduleMode("auto");
      setCustomDateTime(getDefaultScheduleTime());

      getNewsletterModalData(post.id)
        .then((result) => {
          if (result.success) {
            setData(result as NewsletterData);
          } else {
            setError(result.message || "Failed to load data.");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, post]);

  const handleScheduleOrSend = async () => {
    if (!data || !post) return;

    if (scheduleMode === "custom") {
      if (!customDateTime) {
        toast.error("Please pick a scheduled date and time.");
        return;
      }
      const targetTime = new Date(customDateTime).getTime();
      if (isNaN(targetTime)) {
        toast.error("Invalid scheduled date/time.");
        return;
      }
      if (targetTime <= Date.now()) {
        toast.error("Scheduled time must be in the future. Or switch to 'Send Immediately'.");
        return;
      }
    }

    // Two-step inline confirm
    if (!confirmingSchedule) {
      setConfirmingSchedule(true);
      return;
    }
    setConfirmingSchedule(false);

    setIsScheduling(true);
    const toastId = toast.loading(
      scheduleMode === "now"
        ? `Sending newsletter immediately to ${data.subscriberCount} subscribers...`
        : `Scheduling newsletter for ${data.subscriberCount} subscribers...`
    );

    const customIso =
      scheduleMode === "custom" ? new Date(customDateTime).toISOString() : null;

    const result = await scheduleNewsletter(post.id, scheduleMode, customIso);

    if (result.success) {
      toast.success(result.message || "Newsletter scheduled successfully!", {
        id: toastId,
        duration: 5000,
      });
      onSendComplete();
    } else {
      toast.error(`Failed: ${result.message}`, { id: toastId });
    }
    setIsScheduling(false);
  };

  if (!mounted || !isOpen || !post) return null;

  const autoSlotFormatted = formatMYTDateTime(data?.nextAutoSlot);
  const customFormatted = formatMYTDateTime(customDateTime);

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={!isScheduling ? onClose : undefined}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-8 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Send / Schedule Newsletter
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Review post and select delivery timing for your subscribers
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isScheduling}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Loading newsletter details...
                </p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Error loading data
                </p>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center max-w-md">
                  {error}
                </p>
              </div>
            )}

            {data && (
              <>
                {/* Email Preview Card */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-xs">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Email Preview
                      </label>
                    </div>

                    <div className="flex gap-4">
                      {data.postImage ? (
                        <div className="relative shrink-0">
                          <img
                            src={data.postImage}
                            alt="Preview"
                            className="w-24 h-24 rounded-xl object-cover shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-xs">
                          <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Subject
                          </span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5 line-clamp-2">
                            {data.postTitle}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Preview Text
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {data.postPreview}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscriber & Priority Quota Status Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Subscribers
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {data.subscriberCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                      Active verified recipients
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Today's Newsletter Quota
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {data.newsletterAllowanceToday != null
                            ? `${data.newsletterAllowanceToday} mails`
                            : "Ready"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                      {data.reserve ?? 20} mails reserved for high-priority contact replies
                    </p>
                  </div>
                </div>

                {/* Delivery Mode Selection */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Delivery Timing
                      </label>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Timezone: MYT (GMT+8)
                    </span>
                  </div>

                  {/* 3-Way Mode Switcher: Auto Schedule vs Send Immediately vs Custom */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-gray-200/70 dark:bg-gray-900/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleMode("auto");
                        setConfirmingSchedule(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        scheduleMode === "auto"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Calendar size={14} />
                      <span>Auto Schedule ({data.frequency || "weekly"})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScheduleMode("now");
                        setConfirmingSchedule(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        scheduleMode === "now"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Send size={14} />
                      <span>Send Immediately</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScheduleMode("custom");
                        setConfirmingSchedule(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        scheduleMode === "custom"
                          ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Clock size={14} />
                      <span>Custom Time</span>
                    </button>
                  </div>

                  {/* Mode details */}
                  {scheduleMode === "auto" && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
                        <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>
                          Next Scheduled Slot: <strong>{autoSlotFormatted || "Calculating..."}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-blue-700/80 dark:text-blue-300/80 pl-5">
                        Follows your <strong>{data.frequency || "weekly"}</strong> delivery schedule configured in{" "}
                        <span className="font-semibold">Admin → Settings → Newsletter Delivery</span>.
                        Multiple queued posts automatically queue one after another.
                      </p>
                    </div>
                  )}

                  {scheduleMode === "now" && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        <Send size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Immediate Delivery via Resend Batch API</span>
                      </div>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 pl-5">
                        Delivers directly to your active subscribers right now, without waiting for any cron cycle.
                        Protects a reserve of {data.reserve ?? 20} emails for incoming contact inquiries.
                      </p>
                    </div>
                  )}

                  {scheduleMode === "custom" && (
                    <div className="pt-1">
                      <DateTimePicker
                        value={customDateTime}
                        onChange={(val) => {
                          setCustomDateTime(val);
                          setConfirmingSchedule(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons (Send Test removed as requested) */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {data.subscriberCount === 0 ? (
                      <span className="text-amber-600">No subscribed recipients found.</span>
                    ) : (
                      <span>Ready to send to {data.subscriberCount} subscriber(s)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isScheduling}
                      className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleScheduleOrSend}
                      disabled={isScheduling || data.subscriberCount === 0}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:bg-gray-400 w-full sm:w-auto ${
                        scheduleMode === "now"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : scheduleMode === "custom"
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isScheduling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : scheduleMode === "now" ? (
                        <Send className="w-4 h-4" />
                      ) : (
                        <CalendarClock className="w-4 h-4" />
                      )}
                      <span>
                        {confirmingSchedule
                          ? scheduleMode === "now"
                            ? "Click again to confirm immediate send"
                            : "Click again to confirm schedule"
                          : scheduleMode === "now"
                          ? `Send Immediately (${data.subscriberCount} Subscribers)`
                          : scheduleMode === "auto"
                          ? `Schedule for ${autoSlotFormatted || "Next Slot"}`
                          : `Schedule for ${customFormatted || "Custom Time"}`}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
