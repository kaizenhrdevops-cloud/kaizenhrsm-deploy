"use client";

import { useState, useEffect } from "react";
import { getBrowserClient } from "@/lib/client";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Lock } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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

      // Check profile status
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", data.user.id)
          .single();

        if (profile?.status === "suspended") {
          await supabase.auth.signOut();
          triggerError("Your account has been suspended. Contact admin.");
          setIsLoading(false);
          return;
        }

        if (profile?.status === "inactive") {
          await supabase.auth.signOut();
          triggerError("Your account is inactive. Contact admin.");
          setIsLoading(false);
          return;
        }
      }

      router.push("/admin/dashboard");
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
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              mt-2 w-full px-4 py-3 
              bg-white/70 dark:bg-gray-900/30 
              border border-gray-300 dark:border-gray-700 
              text-gray-900 dark:text-white 
              rounded-lg focus:ring-2 focus:ring-blue-500 outline-none
            "
            placeholder="••••••••"
          />

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
