// src/app/admin/about-us/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getPublicSettings } from "@/lib/public-settings";
import { getPublicNavItems } from "@/lib/nav-items";
import { DEFAULT_NAV_ITEMS } from "@/data/navbar-defaults";
import { buildTokenContext } from "@/data/about-us-defaults";
import { getAboutPageAdmin } from "./actions";
import AboutUsStudio from "./AboutUsStudio";

export const dynamic = "force-dynamic";

export default async function AboutUsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.status !== "active" ||
    profile.role !== "super_admin"
  ) {
    redirect("/admin/dashboard");
  }

  const [aboutResult, publicSettings, publicNavItems] = await Promise.all([
    getAboutPageAdmin(),
    getPublicSettings().catch(() => ({})),
    getPublicNavItems().catch(() => DEFAULT_NAV_ITEMS),
  ]);

  if (aboutResult.migrationMissing) {
    return (
      <div className="max-w-3xl space-y-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 text-sm text-amber-900 dark:text-amber-200">
        <h1 className="text-lg font-bold">Database Migration Required</h1>
        <p>
          Run{" "}
          <code className="font-mono font-semibold">
            supabase/migrations/20261127000000_site_pages.sql
          </code>{" "}
          in your Supabase Dashboard SQL Editor, then refresh this page.
        </p>
      </div>
    );
  }

  if (!aboutResult.success || !aboutResult.data) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        Error loading About Us Studio: {aboutResult.message}
      </div>
    );
  }

  const tokenCtx = buildTokenContext(publicSettings);

  return (
    <AboutUsStudio
      initialData={aboutResult.data}
      tokenCtx={tokenCtx}
      publicSettings={publicSettings}
      publicNavItems={publicNavItems}
    />
  );
}
