"use client";

/**
 * Singleton Turnstile loader. Both the contact form and the footer
 * newsletter island share ONE script tag (?render=explicit) and render
 * their widgets explicitly — loading the script twice would reset
 * window.turnstile and break already-rendered widgets.
 */

declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          // Valid sizes per Cloudflare docs: "normal" | "flexible" | "compact".
          // NOTE: "invisible" is NOT a valid size and throws:
          //   TurnstileError: Invalid value for parameter "size".
          // For invisible-like behaviour use execution/appearance instead.
          size?: "normal" | "compact" | "flexible";
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
          execution?: "render" | "execute";
          callback?: (token: string) => void;
          "error-callback"?: (code?: string) => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
        }
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse?: (widgetId: string) => string | undefined;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loadPromise: Promise<void> | null = null;

export function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector(
      `script[src^="https://challenges.cloudflare.com/turnstile/"]`
    );
    if (existing) {
      // Another copy is (or was) loading; poll briefly for the API.
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (window.turnstile || tries > 50) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve(); // callers handle missing API
    document.body.appendChild(script);
  });

  return loadPromise;
}
