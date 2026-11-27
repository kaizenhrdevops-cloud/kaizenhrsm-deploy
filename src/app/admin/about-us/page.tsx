// src/app/admin/about-us/page.tsx
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/public-settings";
import { getPublicNavItems } from "@/lib/nav-items";
import { DEFAULT_NAV_ITEMS } from "@/data/navbar-defaults";
import { buildTokenContext } from "@/data/about-us-defaults";
import { getAboutPageAdmin } from "./actions";
import AboutUsStudio from "./AboutUsStudio";

export const metadata: Metadata = {
  title: "About Us Studio | KaizenHRMS Admin",
};

export default async function AboutUsAdminPage() {
  // The canvas renders the real public Footer, so it needs the same cached
  // settings + navigation payloads the public layout distributes.
  const [result, settings, navItems] = await Promise.all([
    getAboutPageAdmin(),
    getPublicSettings().catch(() => ({})),
    getPublicNavItems().catch(() => DEFAULT_NAV_ITEMS),
  ]);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            About Us Studio
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Visual editor for the public /company/about-us page.
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-semibold">About Us Studio could not load.</p>
          <p className="mt-1 break-words">{result.message}</p>
          {result.migrationMissing ? (
            <p className="mt-3">
              Run{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs dark:bg-red-900/40">
                supabase/migrations/20261127000000_site_pages.sql
              </code>{" "}
              in the Supabase SQL Editor, then reload this page.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const tokenCtx = buildTokenContext(settings);

  return (
    <AboutUsStudio
      initialData={result.data}
      tokenCtx={tokenCtx}
      publicSettings={settings}
      publicNavItems={navItems}
    />
  );
}
