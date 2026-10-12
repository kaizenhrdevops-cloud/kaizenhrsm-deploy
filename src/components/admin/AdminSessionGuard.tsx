// src/components/admin/AdminSessionGuard.tsx
"use client";

import { useEffect, useRef } from "react";
import { getBrowserClient } from "@/lib/client";
import {
  ABSOLUTE_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  LOGIN_AT_KEY,
  LOGOUT_EVENT_KEY,
  SESSION_EXPIRED_PARAM,
  broadcastLogout,
  ensureTabId,
  readLiveTabs,
  readTimestamp,
  registerTab,
  touchActivity,
  unregisterTab,
} from "@/lib/admin-session";

/**
 * Enforces admin session lifetime:
 * - Closing the last admin tab ends the session: reopening /admin in a
 *   fresh tab requires a new login (fresh-tab check in initialise()).
 * - 30 min inactivity or 8 h absolute session auto sign-out.
 * - Logging out in one tab redirects the other open admin tabs.
 *
 * Refreshing or navigating inside the same tab keeps the session alive
 * (sessionStorage survives reload; it is cleared only on tab close).
 */
export default function AdminSessionGuard() {
  const didRedirect = useRef(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    const tabId = ensureTabId();
    if (!tabId) return;

    const redirectToLogin = (error: string) => {
      if (didRedirect.current) return;
      didRedirect.current = true;
      try {
        broadcastLogout();
      } catch {
        // ignore
      }
      window.location.href = `/login?error=${error}`;
    };

    const clientSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore — server beacon is the reliable path on unload
      }
    };

    // Beacon to the server so cookies are cleared even while unloading.
    const serverSignOutBeacon = () => {
      try {
        fetch("/api/auth/signout", {
          method: "POST",
          keepalive: true,
          credentials: "same-origin",
        }).catch(() => {});
      } catch {
        // ignore
      }
    };

    const fullSignOut = async (error: string) => {
      serverSignOutBeacon();
      await clientSignOut();
      try {
        unregisterTab(tabId);
      } catch {
        // ignore
      }
      try {
        localStorage.removeItem(LOGIN_AT_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        sessionStorage.removeItem("kaizen-admin-tab-validated");
      } catch {
        // ignore
      }
      redirectToLogin(error);
    };

    // --- Fresh-tab check: reopened after close with a stale cookie session?
    const liveBefore = readLiveTabs().filter((id) => id !== tabId);
    const validated =
      typeof window !== "undefined" &&
      sessionStorage.getItem("kaizen-admin-tab-validated") === "1";

    const initialise = async () => {
      if (!validated && liveBefore.length === 0) {
        // No other admin tabs alive and this tab never logged in:
        // either a clean logged-out visit (no session -> nothing to do)
        // or a reopen-after-close with leftover cookies (-> force logout).
        let hasSession = false;
        try {
          const { data } = await supabase.auth.getSession();
          hasSession = !!data.session;
        } catch {
          hasSession = false;
        }
        if (hasSession) {
          await fullSignOut(SESSION_EXPIRED_PARAM);
          return;
        }
      }
      // Legitimate tab (just logged in, second tab, or refresh).
      try {
        sessionStorage.setItem("kaizen-admin-tab-validated", "1");
      } catch {
        // ignore
      }
      registerTab(tabId);
      touchActivity();
      void checkTimeouts();
    };

    // --- Idle / absolute timeout checks ---
    const checkTimeouts = async (): Promise<boolean> => {
      if (didRedirect.current) return true;
      const now = Date.now();
      const lastActivity = readTimestamp(LAST_ACTIVITY_KEY);
      const loginAt = readTimestamp(LOGIN_AT_KEY);

      if (loginAt !== null && now - loginAt > ABSOLUTE_TIMEOUT_MS) {
        await fullSignOut("expired");
        return true;
      }
      if (lastActivity !== null && now - lastActivity > IDLE_TIMEOUT_MS) {
        await fullSignOut("idle");
        return true;
      }
      return false;
    };

    let lastTouch = 0;
    const onActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes (one tab's typing shouldn't spam disk).
      if (now - lastTouch < 30_000) return;
      lastTouch = now;
      touchActivity();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        touchActivity();
        void checkTimeouts();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOGOUT_EVENT_KEY && e.newValue) {
        redirectToLogin(SESSION_EXPIRED_PARAM);
      }
    };

    // --- Tab-close bookkeeping ---
    // NOTE: pagehide/beforeunload fire on refresh too, so we must NOT sign
    // out here (that would log users out on every reload). We only drop
    // this tab from the live list. If it was the last tab, cookies briefly
    // linger — but the fresh-tab check in initialise() signs out on the
    // next /admin visit in a new tab, so reopening always requires login.
    const handleUnload = () => {
      try {
        unregisterTab(tabId);
      } catch {
        // ignore
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !didRedirect.current) {
        redirectToLogin(SESSION_EXPIRED_PARAM);
      }
    });

    const interval = window.setInterval(() => {
      void checkTimeouts();
    }, 30_000);

    const events: Array<[string, EventListener]> = [
      ["mousemove", onActivity],
      ["mousedown", onActivity],
      ["keydown", onActivity],
      ["scroll", onActivity],
      ["touchstart", onActivity],
      ["click", onActivity],
    ];
    events.forEach(([name, fn]) =>
      window.addEventListener(name, fn, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    // pagehide/beforeunload fire on tab close AND on refresh/navigation —
    // handleUnload only unregisters the tab (never signs out) so reloads
    // stay logged in while closed tabs are forgotten.
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    void initialise();

    return () => {
      window.clearInterval(interval);
      events.forEach(([name, fn]) => window.removeEventListener(name, fn));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      subscription.unsubscribe();
      // Leaving /admin (navigation, not tab close): stop counting this tab
      // so a later fresh tab is correctly seen as "no tabs alive".
      // No sign-out here — the pagehide handler already covers real closes.
      try {
        unregisterTab(tabId);
      } catch {
        // ignore
      }
    };
  }, []);

  return null;
}
