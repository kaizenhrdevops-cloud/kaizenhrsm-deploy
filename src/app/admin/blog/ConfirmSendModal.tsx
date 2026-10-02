"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Mail,
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
} from "lucide-react";
import {
  getNewsletterModalData,
  sendTestNewsletter,
  scheduleNewsletter,
} from "./newsletterActions";
import type { PostWithAuthor } from "./posts-client";
import { toast } from "react-hot-toast";

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

export default function ConfirmSendModal({
  isOpen,
  onClose,
  post,
  onSendComplete,
}: ModalProps) {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [confirmingSchedule, setConfirmingSchedule] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Delivery timing states
  const [scheduleType, setScheduleType] = useState<"now" | "later">("later");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");

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
      setScheduleType("later");
      setScheduledDateTime(getDefaultScheduleTime());

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

  const handleSendTest = async () => {
    if (!post || !data) return;
    setIsSendingTest(true);
    const toastId = toast.loading("Sending test email...");
    const result = await sendTestNewsletter(post.id, data.adminEmail);
    if (result.success) {
      toast.success("Test email sent successfully!", { id: toastId });
    } else {
      toast.error(`Failed to send test: ${result.message}`, { id: toastId });
    }
    setIsSendingTest(false);
  };

  const handleScheduleAll = async () => {
    if (!data || !post) return;

    if (scheduleType === "later") {
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
      scheduleType === "later"
        ? `Scheduling newsletter for ${data.subscriberCount} subscribers...`
        : `Queuing immediate newsletter for ${data.subscriberCount} subscribers...`
    );

    const targetIso =
      scheduleType === "later"
        ? new Date(scheduledDateTime).toISOString()
        : null;

    const result = await scheduleNewsletter(post.id, targetIso);

    if (result.success) {
      toast.success(result.message || "Campaign scheduled successfully!", { id: toastId });
      onSendComplete();
    } else {
      toast.error(`Failed to schedule: ${result.message}`, { id: toastId });
    }
    setIsScheduling(false);
  };

  const formatSchedulePreview = () => {
    if (!scheduledDateTime) return "";
    try {
      const d = new Date(scheduledDateTime);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("en-MY", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return scheduledDateTime;
    }
  };

  if (!mounted || !isOpen || !post) return null;

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
                    Review post and choose delivery time for your subscribers
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
                  Loading newsletter data...
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

                {/* Subscriber Count Card */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-md text-white">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Active Verified Subscribers
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                        {data.subscriberCount.toLocaleString()}
                      </p>
                    </div>
                    {data.subscriberCount > 0 ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                        Ready to send
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                        No subscribers
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Timing Section */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Delivery Schedule
                      </label>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Timezone: MYT (GMT+8)
                    </span>
                  </div>

                  {/* Mode switcher: Schedule for Later vs Send Immediately */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200/70 dark:bg-gray-900/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleType("later");
                        setConfirmingSchedule(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        scheduleType === "later"
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Clock size={14} />
                      <span>Schedule for Specific Time</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleType("now");
                        setConfirmingSchedule(false);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        scheduleType === "now"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Send size={14} />
                      <span>Send Immediately</span>
                    </button>
                  </div>

                  {scheduleType === "later" ? (
                    <div className="space-y-3 pt-1">
                      {/* Presets */}
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                          Quick Presets
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setScheduledDateTime(getPresetTonight(22));
                              setConfirmingSchedule(false);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-center cursor-pointer"
                          >
                            Tonight 10:00 PM
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduledDateTime(getPresetTonight(23));
                              setConfirmingSchedule(false);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-center cursor-pointer"
                          >
                            Tonight 11:00 PM
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduledDateTime(getPresetTomorrow(9));
                              setConfirmingSchedule(false);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-center cursor-pointer"
                          >
                            Tomorrow 9:00 AM
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setScheduledDateTime(getPresetTomorrow(22));
                              setConfirmingSchedule(false);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-center cursor-pointer"
                          >
                            Tomorrow 10:00 PM
                          </button>
                        </div>
                      </div>

                      {/* Custom Datetime Input */}
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                          Or Choose Exact Date & Time
                        </span>
                        <input
                          type="datetime-local"
                          value={scheduledDateTime}
                          onChange={(e) => {
                            setScheduledDateTime(e.target.value);
                            setConfirmingSchedule(false);
                          }}
                          min={toDatetimeLocalString(new Date())}
                          className="w-full px-3.5 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>

                      {scheduledDateTime && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                          <Check size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>
                            Delivery starts at:{" "}
                            <strong>{formatSchedulePreview()}</strong>. The cron will not process this campaign before this time.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Emails will start sending immediately on the next scheduled queue cycle.
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isSendingTest || isScheduling}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSendingTest ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>Send Test to {data.adminEmail}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScheduleAll}
                    disabled={
                      isSendingTest ||
                      isScheduling ||
                      data.subscriberCount === 0
                    }
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:bg-gray-400 ${
                      scheduleType === "now"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isScheduling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : scheduleType === "now" ? (
                      <Send className="w-4 h-4" />
                    ) : (
                      <CalendarClock className="w-4 h-4" />
                    )}
                    <span>
                      {confirmingSchedule
                        ? `Click again to confirm (${data.subscriberCount.toLocaleString()} subscribers)`
                        : scheduleType === "now"
                        ? `Send Now (${data.subscriberCount.toLocaleString()} Subscribers)`
                        : `Schedule for ${formatSchedulePreview() || "Selected Time"} (${data.subscriberCount.toLocaleString()} Subscribers)`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isScheduling}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl sm:ml-auto hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
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

