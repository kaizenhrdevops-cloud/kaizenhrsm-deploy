// Confirm screen form: posts the token; only explicit clicks unsubscribe.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UnsubscribeConfirmForm({
  token,
  maskedEmail,
}: {
  token: string;
  maskedEmail: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Could not process your request.");
      }
      router.push("/newsletter/unsubscribe?status=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="text-center">
      <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Unsubscribe?
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {maskedEmail ? (
          <>
            Stop sending newsletters to{" "}
            <span className="font-mono font-semibold">{maskedEmail}</span>?
          </>
        ) : (
          "Stop sending newsletters to this email address?"
        )}
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {submitting ? "Unsubscribing…" : "Yes, unsubscribe me"}
        </button>
        <Link
          href="/"
          className="px-6 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          Keep me subscribed
        </Link>
      </div>
    </div>
  );
}
