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

    // Two-step inline confirm instead of blocking confirm().
    if (!confirmingSchedule) {
      setConfirmingSchedule(true);
      return;
    }
    setConfirmingSchedule(false);

    setIsScheduling(true);
    const toastId = toast.loading(
      `Scheduling newsletter for ${data.subscriberCount} subscribers...`
    );

    const result = await scheduleNewsletter(post.id);

    if (result.success) {
      toast.success(result.message || "Campaign scheduled!", { id: toastId });
      onSendComplete();
    } else {
      toast.error(`Failed to schedule: ${result.message}`, { id: toastId });
    }
    setIsScheduling(false);
  };

  if (!mounted || !isOpen || !post) return null;

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={!isScheduling ? onClose : undefined}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div className="relative overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Schedule Newsletter
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Review and send to your subscribers
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isScheduling}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 disabled:opacity-50 transition-all duration-200"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
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
              <div className="space-y-6">
                {/* Email Preview Card */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Email Preview
                      </label>
                    </div>

                    <div className="flex gap-5">
                      {data.postImage ? (
                        <div className="relative flex-shrink-0">
                          <img
                            src={data.postImage}
                            alt="Preview"
                            className="w-28 h-28 rounded-xl object-cover shadow-md ring-2 ring-gray-100 dark:ring-gray-700"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-28 h-28 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-md">
                          <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Subject
                          </span>
                          <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1 line-clamp-2">
                            {data.postTitle}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Preview Text
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {data.postPreview}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscriber Count Card */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Subscribers
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {data.subscriberCount.toLocaleString()}
                        </p>
                      </div>
                      {data.subscriberCount > 0 && (
                        <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                            Ready
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isSendingTest || isScheduling}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-all duration-200"
                  >
                    {isSendingTest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
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
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isScheduling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CalendarClock className="w-4 h-4" />
                    )}
                    <span>
                      {confirmingSchedule
                        ? `Click again to confirm (${data.subscriberCount.toLocaleString()} subscribers)`
                        : `Schedule for ${data.subscriberCount.toLocaleString()} Subscribers`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isScheduling}
                    className="px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl sm:ml-auto hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
