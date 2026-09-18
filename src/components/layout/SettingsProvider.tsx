"use client";

import { createContext, useContext } from "react";
import type { PublicSettings } from "@/lib/public-settings";

const SettingsContext = createContext<PublicSettings>({});

/**
 * Settings distributed from (public)/layout (one cached read per
 * request) to all client components (Footer, contact form, blog
 * layout) — no per-component fetch waterfalls.
 */
export function SettingsProvider({
  value,
  children,
}: {
  value: PublicSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}
