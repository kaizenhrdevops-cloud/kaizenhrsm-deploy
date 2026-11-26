// src/app/(public)/layout.tsx
import React from "react";
import { getPublicSettings } from "@/lib/public-settings";
import { getPublicNavItems } from "@/lib/nav-items";
import { DEFAULT_NAV_ITEMS } from "@/data/navbar-defaults";
import { SettingsProvider } from "@/components/layout/SettingsProvider";
import { NavProvider } from "@/components/layout/NavProvider";

// Re-check the DB-backed maintenance flag at most once a minute.
// (Middleware only checks the MAINTENANCE_MODE env var so it stays
// free of per-request DB queries.)
export const revalidate = 60;

function isMaintenanceOn(value: unknown): boolean {
  return value === "true" || value === true || value === '"true"';
}

function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white text-slate-900">
      <h1 className="text-3xl font-bold mb-3">We&apos;ll be right back.</h1>
      <p className="text-slate-500">
        The system is currently undergoing scheduled maintenance.
      </p>
    </div>
  );
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A nested layout should just return its children directly.
  // The <html> and <body> from the root layout will wrap this.
  if (process.env.MAINTENANCE_MODE === "true") {
    return <MaintenancePage />;
  }

  // Single cached settings + navigation read per request (cross-request
  // cached 1hr, invalidated instantly on admin save). Shared with client
  // components below — they must NOT fetch settings/nav themselves.
  const [settings, navItems] = await Promise.all([
    getPublicSettings().catch(() => ({})),
    getPublicNavItems().catch(() => DEFAULT_NAV_ITEMS),
  ]);

  if (
    isMaintenanceOn(
      (settings as Record<string, unknown>).enable_maintenance_mode
    )
  ) {
    return <MaintenancePage />;
  }

  return (
    <SettingsProvider value={settings}>
      <NavProvider value={navItems}>{children}</NavProvider>
    </SettingsProvider>
  );
}
