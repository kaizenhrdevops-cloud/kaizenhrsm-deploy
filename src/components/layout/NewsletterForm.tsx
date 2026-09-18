"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { loadTurnstile } from "@/lib/turnstile-client";

/**
 * Footer newsletter island (client). Uses an INVISIBLE Turnstile widget
 * (explicit render + execute on submit) so bots can't drain the Resend
 * free quota via /api/newsletter/subscribe.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey) return;

    let cancelled = false;

    const renderWidget = () => {
      if (
        cancelled ||
        !window.turnstile ||
        !containerRef.current ||
        widgetIdRef.current ||
        !sitekey
      ) {
        return;
      }
      try {
        // NOTE: "invisible" is NOT a valid `size` (Cloudflare only accepts
        // "normal" | "flexible" | "compact" — passing "invisible" throws
        // `TurnstileError: Invalid value for parameter "size"`).
        // Invisible-like behaviour = defer the challenge until submit via
        // execution:"execute", and only show the widget if interaction is
        // ever required via appearance:"interaction-only".
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          execution: "execute",
          appearance: "interaction-only",
          callback: (token: string) => {
            // Token ready: if a submit is waiting, finish it.
            if (pendingEmailRef.current) {
              const pending = pendingEmailRef.current;
              pendingEmailRef.current = null;
              void doSubmit(pending, token);
            }
          },
          "error-callback": () => {
            pendingEmailRef.current = null;
            setIsLoading(false);
            setMessage("Captcha verification failed. Please try again.");
            setIsError(true);
          },
          "expired-callback": () => {
            pendingEmailRef.current = null;
          },
        });
      } catch {
        // Widget failed to render; submit will surface an error.
      }
    };

    void loadTurnstile().then(() => {
      // The shared loader may resolve just before window.turnstile lands.
      if (window.turnstile) {
        renderWidget();
        return;
      }
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (cancelled || window.turnstile || tries > 50) {
          clearInterval(timer);
          renderWidget();
        }
      }, 100);
    });

    return () => {
      cancelled = true;
      // Clean up the widget so Fast Refresh / StrictMode remounts and
      // client-side navigations don't leave a stale widget id behind
      // (stale ids cause "Cannot find Widget cf-chl-widget-..." errors).
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget may already be gone
        }
      }
      widgetIdRef.current = null;
    };
  }, []);

  const doSubmit = async (targetEmail: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: targetEmail, captchaToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setMessage(data.message);
      setIsError(false);
      setEmail("");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
      setIsError(true);
    } finally {
      setIsLoading(false);
      // Refresh the widget so the next signup re-verifies.
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!email) {
      setMessage("Email address is required.");
      setIsError(true);
      return;
    }

    if (
      !window.turnstile ||
      !widgetIdRef.current ||
      !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ) {
      setMessage("Verification unavailable. Please try again.");
      setIsError(true);
      return;
    }

    // Invisible verification first; the widget callback finishes the submit.
    setIsLoading(true);
    pendingEmailRef.current = email;
    try {
      window.turnstile.execute(widgetIdRef.current);
    } catch {
      pendingEmailRef.current = null;
      setIsLoading(false);
      setMessage("Verification unavailable. Please try again.");
      setIsError(true);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex bg-white/10 hover:bg-white/15 focus-within:bg-white/20 border border-white/20 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/30 rounded-xl overflow-hidden backdrop-blur-xs transition-all shadow-inner">
          <input
            type="email"
            placeholder="Your business email"
            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-teal-100/60 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-900 px-5 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 font-semibold cursor-pointer shadow-xs"
            disabled={isLoading}
            aria-label="Subscribe to newsletter"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-slate-900" size={18} />
            ) : (
              <Send size={18} className="text-slate-900" />
            )}
          </button>
        </div>
        {/* Invisible Turnstile mount point. Hidden with CSS (not
            aria-hidden) so the injected challenge iframe never ends up as a
            focused descendant of an aria-hidden ancestor. */}
        <div ref={containerRef} className="h-0 overflow-hidden" />
      </form>
      {message && (
        <p
          className={`mt-2 text-xs font-medium ${
            isError ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
