"use client";

import { useEffect, useState } from "react";
import { Send, ExternalLink, History } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDateMY as formatDate } from "@/lib/format";

type Reply = {
  id: string;
  reply_message: string;
  reply_method: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
};

/**
 * Reply history + reply composer. Extracted from ContactDetailModal.
 * Calls onReplySent() after any successful reply so the parent can
 * bump the contact status / refresh its list.
 */
export default function ContactReplySection({
  contactId,
  contactName,
  contactEmail,
  userRole,
  onReplySent,
}: {
  contactId: string;
  contactName: string;
  contactEmail: string;
  userRole: "admin" | "super_admin" | null;
  onReplySent: () => void;
}) {
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isLoggingNote, setIsLoggingNote] = useState(false);

  useEffect(() => {
    fetchReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const response = await fetch(
        `/api/admin/contacts/reply?contactId=${contactId}`
      );
      const data = await response.json();

      if (response.ok) {
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    setIsSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/contacts/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          replyMessage: replyMessage.trim(),
          replyMethod: "in_app",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotice({ type: "success", text: "Reply sent successfully!" });
        setReplyMessage("");
        setShowReplyForm(false);
        fetchReplies();
        onReplySent();
      } else {
        setNotice({
          type: "error",
          text: data.error || "Failed to send reply",
        });
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      setNotice({
        type: "error",
        text: "An error occurred while sending the reply",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogNote = async () => {
    if (!noteText.trim()) return;
    setIsLoggingNote(true);
    try {
      const response = await fetch("/api/admin/contacts/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          replyMessage: noteText.trim(),
          replyMethod: "email_client",
        }),
      });

      if (response.ok) {
        setNotice({ type: "success", text: "Reply logged." });
        setNoteText("");
        setShowNotePanel(false);
        fetchReplies();
        onReplySent();
      } else {
        setNotice({ type: "error", text: "Failed to log reply." });
      }
    } catch (error) {
      console.error("Error logging reply:", error);
      setNotice({ type: "error", text: "Failed to log reply." });
    } finally {
      setIsLoggingNote(false);
    }
  };

  const handleEmailClientReply = () => {
    const subject = encodeURIComponent("Re: Your KaizenHR Inquiry");
    const body = encodeURIComponent(
      `Dear ${contactName},\n\nThank you for contacting KaizenHR.\n\n\n\nBest regards,\nKaizenHR Team`
    );

    window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, "_blank");

    // Show the tracking-note panel instead of a blocking prompt().
    setNoteText("");
    setShowNotePanel(true);
  };

  const displayedReplies = showAllReplies ? replies : replies.slice(0, 1);

  return (
    <>
      {/* Inline status (Toast can't show above modal backdrops) */}
      {notice && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            notice.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          {notice.text}
        </div>
      )}
      {/* Reply History */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              <History className="inline w-5 h-5 mr-2" />
              Reply History
            </h3>
            {replies.length > 1 && (
              <button
                onClick={() => setShowAllReplies(!showAllReplies)}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {showAllReplies
                  ? "Show Latest Only"
                  : `View All ${replies.length} Replies`}
              </button>
            )}
          </div>

          {loadingReplies ? (
            <p className="text-sm text-gray-500">Loading replies...</p>
          ) : (
            <div className="space-y-3">
              {displayedReplies.map((reply) => (
                <div
                  key={reply.id}
                  className="p-4 border-l-4 border-green-500 bg-green-50 rounded-lg dark:bg-green-900/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-green-800 dark:text-green-400">
                      {reply.reply_method === "in_app"
                        ? "📧 In-App Reply"
                        : "✉️ Email Client"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                    {reply.reply_message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By {reply.profiles.full_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply Section (Super Admin Only) */}
      {userRole === "super_admin" && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          {!showReplyForm && !showNotePanel ? (
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setShowReplyForm(true)}>
                <Send size={16} />
                Quick Reply (In-App)
              </Button>
              <Button onClick={handleEmailClientReply}>
                <ExternalLink size={16} />
                Reply via Email
              </Button>
            </div>
          ) : showNotePanel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Log Email Reply
                </h3>
                <button
                  onClick={() => {
                    setShowNotePanel(false);
                    setNoteText("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your mail app should have opened. Enter a brief note about
                your reply for tracking purposes:
              </p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                placeholder="e.g. Sent pricing details + brochure…"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
              <Button
                variant="primary"
                onClick={handleLogNote}
                disabled={isLoggingNote || !noteText.trim()}
                loading={isLoggingNote}
              >
                {isLoggingNote ? "Logging…" : "Log Reply"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Send Reply
                </h3>
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyMessage("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
                placeholder="Type your reply here..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
              <Button
                variant="primary"
                onClick={handleSendReply}
                disabled={isSending || !replyMessage.trim()}
                loading={isSending}
              >
                {!isSending && <Send size={16} />}
                {isSending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
