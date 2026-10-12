"use client";

import { useState, useEffect } from "react";
import { getBrowserClient } from "@/lib/client";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import {
  markTabSessionActive,
  SESSION_EXPIRED_PARAM,
} from "@/lib/admin-session";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = getBrowserClient();

  // Apply URL-based errors
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType === "suspended") {
      triggerError("Your account has been suspended. Contact admin.");
    } else if (errorType === "inactive") {
      triggerError("Your account is currently inactive.");
    } else if (errorType === "invalid_link" || errorType === "expired_link") {
      triggerError(
        "That password link is invalid or expired. Please request a new one."
      );
    } else if (errorType === SESSION_EXPIRED_PARAM) {
      triggerError("Your session ended. Please sign in again.");
    } else if (errorType === "idle") {
      triggerError(
        "You were signed out after 30 minutes of inactivity. Please sign in again."
      );
    } else if (errorType === "expired") {
      triggerError(
        "Your session reached the 8-hour limit. Please sign in again."
      );
    }
    if (searchParams.get("reset") === "success") {
      setNotice("Password updated. Please sign in with your new password.");
    }
  }, [searchParams]);

  // Centralized error trigger (shake + fade)
  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        if (authError.message === "Invalid login credentials") {
          triggerError("Invalid email or password.");
        } else if (authError.message.includes("banned")) {
          triggerError("Your account has been suspended.");
        } else {
          triggerError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      // Check profile status. Deny when the profile is missing/blocked —
      // never let a session without a valid active profile through to the
      // dashboard (previously a null profile fell through to login).
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile || profile.status !== "active") {
          await supabase.auth.signOut();
          triggerError(
            profile?.status === "suspended"
              ? "Your account has been suspended. Contact admin."
              : profile?.status === "inactive"
                ? "Your account is inactive. Contact admin."
                : "Your account is not set up. Contact admin."
          );
          setIsLoading(false);
          return;
        }
      }

      // Mark this tab as a legitimate session so the admin session
      // guard keeps it alive (refresh/navigation safe, reopen requires
      // login). Must run in the same tab before entering /admin.
      markTabSessionActive();

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      triggerError("Unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`
        w-full max-w-md 
        bg-white/40 dark:bg-white/10 
        backdrop-blur-2xl 
        border border-white/30 dark:border-white/10 
        shadow-2xl rounded-2xl 
        p-10 animate-fadeIn
        transition-transform duration-300
        ${shake ? "animate-shake" : ""}
      `}
    >
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
          <Lock className="text-white" size={24} />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          Admin Login
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Sign in to manage your system
        </p>
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            Email Address
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              mt-2 w-full px-4 py-3 
              bg-white/70 dark:bg-gray-900/30 
              border border-gray-300 dark:border-gray-700 
              text-gray-900 dark:text-white 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none
            "
            placeholder="admin@company.com"
          />
        </div>

        {/* Password + Error */}
        <div>
          <label
            htmlFor="admin-password"
            className="block text-sm font-medium text-gray-800 dark:text-gray-300"
          >
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-4 py-3 pr-12
                bg-white/70 dark:bg-gray-900/30
                border border-gray-300 dark:border-gray-700
                text-gray-900 dark:text-white
                rounded-lg focus:ring-2 focus:ring-blue-500 outline-none
              "
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
              className={`
                absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
                ${
                  showPassword
                    ? "text-blue-700 bg-blue-600/10 hover:bg-blue-600/20 dark:text-blue-300 dark:bg-blue-400/15 dark:hover:bg-blue-400/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/15"
                }
              `}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Fade-In Error Under Password */}
          {error && (
            <div
              className="
                mt-4 p-4 rounded-lg
                bg-red-950/30 border border-red-600 
                text-red-200 flex gap-3 text-sm
                animate-fadeInError
              "
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success notice (e.g. after a password reset) */}
          {notice && !error && (
            <div
              className="
                mt-4 p-4 rounded-lg
                bg-green-950/30 border border-green-600
                text-green-200 flex gap-3 text-sm
                animate-fadeInError
              "
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{notice}</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full flex justify-center items-center 
            px-4 py-3 font-semibold 
            rounded-lg 
            bg-blue-600 hover:bg-blue-700 
            text-white shadow-md transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}
