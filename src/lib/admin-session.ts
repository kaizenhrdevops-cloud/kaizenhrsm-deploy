// src/lib/admin-session.ts
//
// Shared tab-session + idle-timeout helpers for the admin area.
//
// Goal: closing the last admin tab signs the user out, so reopening
// /admin/* in a fresh tab requires a new login. Refreshing or navigating
// inside the same tab keeps the session alive.
//
// Storage model:
// - sessionStorage (per-tab): tab id + "validated" flag. Survives refresh,
//   cleared when the tab closes.
// - localStorage (shared across tabs): list of live admin tab ids, last
//   activity timestamp, login timestamp, logout broadcast event.

export const TAB_ID_KEY = "kaizen-admin-tab-id";
export const TAB_VALIDATED_KEY = "kaizen-admin-tab-validated";
export const TABS_KEY = "kaizen-admin-tabs";
export const LAST_ACTIVITY_KEY = "kaizen-admin-last-activity";
export const LOGIN_AT_KEY = "kaizen-admin-login-at";
export const LOGOUT_EVENT_KEY = "kaizen-admin-logout-event";

/** 30 minutes of inactivity -> auto sign-out. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** 8 hours absolute max session -> force re-login. */
export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export const SESSION_EXPIRED_PARAM = "session_expired";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getTabId(): string | null {
  if (!isBrowser()) return null;
  try {
    return sessionStorage.getItem(TAB_ID_KEY);
  } catch {
    return null;
  }
}

export function ensureTabId(): string | null {
  if (!isBrowser()) return null;
  try {
    let id = sessionStorage.getItem(TAB_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(TAB_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function isTabValidated(): boolean {
  if (!isBrowser()) return false;
  try {
    return sessionStorage.getItem(TAB_VALIDATED_KEY) === "1";
  } catch {
    return false;
  }
}

export function readLiveTabs(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeLiveTabs(ids: string[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode) — session guard degrades
    // to idle-timeout only.
  }
}

export function registerTab(tabId: string): void {
  const live = readLiveTabs();
  if (!live.includes(tabId)) {
    writeLiveTabs([...live, tabId]);
  }
}

export function unregisterTab(tabId: string): string[] {
  const remaining = readLiveTabs().filter((id) => id !== tabId);
  writeLiveTabs(remaining);
  return remaining;
}

/**
 * Called after a successful login (same tab that will enter /admin).
 * Marks this tab as a legitimate session so the guard doesn't mistake a
 * just-logged-in navigation for a "reopened after close" restore.
 */
export function markTabSessionActive(): void {
  if (!isBrowser()) return;
  try {
    const tabId = ensureTabId();
    if (tabId) registerTab(tabId);
    sessionStorage.setItem(TAB_VALIDATED_KEY, "1");
    const now = Date.now().toString();
    localStorage.setItem(LAST_ACTIVITY_KEY, now);
    // A login always starts a fresh absolute window (previous sessions end
    // with an explicit sign-out that clears these markers). Second tabs
    // never pass through LoginForm, so this can't extend their timeout.
    localStorage.setItem(LOGIN_AT_KEY, now);
  } catch {
    // ignore storage errors
  }
}

export function touchActivity(): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

export function broadcastLogout(): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

export function readTimestamp(key: string): number | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
