// src/app/admin/settings/page.tsx
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { getSystemSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  // 1. Check user, active status, and super_admin role
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
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Denied
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  // 2. Fetch all settings
  const { settings, success, message } = await getSystemSettings();

  if (!success) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        Error fetching settings: {message}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          General Settings
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Configure company information, homepage media, footer links, email
          delivery, and site-wide safety controls.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
