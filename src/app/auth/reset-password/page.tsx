// src/app/auth/reset-password/page.tsx
"use client";

import { useState } from "react";
import { resetPassword } from "./actions";

/** NEXT_REDIRECT thrown by redirect() carries a digest starting this way. */
function isRedirectError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const digest = (err as Error & { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strongEnough = (value: string) =>
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!strongEnough(password)) {
      setError(
        "Use at least 8 characters with upper + lower case letters and a number."
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword(password);
      // resetPassword redirects to /login on success (throws NEXT_REDIRECT).
      if (!result.success) {
        setError(result.message);
        setSubmitting(false);
      }
    } catch (err) {
      // Success path surfaces as a redirect — let it through. Anything
      // else is a real failure: show it and release the form.
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 space-y-5 bg-white rounded-lg shadow-md dark:bg-slate-800"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter a new password for your account.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save New Password"}
        </button>
      </form>
    </div>
  );
}
