// src/app/admin/settings/actions.ts
"use server";

import { createClient } from "@/lib/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_SETTINGS_TAG } from "@/lib/cache-tags";
import { ALL_SETTING_KEYS } from "./settings-defaults";
import type { Json } from "@/types/supabase";

type SystemSettings = {
  [key: string]: string;
};

const ALLOWED_KEY_SET = new Set(ALL_SETTING_KEYS);

// Helper function to check if current user is an ACTIVE super_admin
// (a suspended super_admin keeps no settings power).
async function checkSuperAdminAccess(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, message: "Not authenticated", userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" || profile?.status !== "active") {
    return {
      authorized: false,
      message: "Access denied. Active super admin role required.",
      userId: user.id,
    };
  }

  return { authorized: true, userId: user.id };
}

export async function getSystemSettings(): Promise<{
  success: boolean;
  settings: SystemSettings;
  message: string;
}> {
  const supabase = await createClient();
  const authCheck = await checkSuperAdminAccess(supabase);
  if (!authCheck.authorized) {
    return {
      success: false,
      settings: {},
      message: authCheck.message || "Access denied.",
    };
  }

  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ALL_SETTING_KEYS);

  if (error) {
    return { success: false, settings: {}, message: error.message };
  }

  const settingsMap: SystemSettings = {};
  (data ?? []).forEach((row) => {
    const raw = row.value as unknown;
    const rawString = typeof raw === "string" ? raw : JSON.stringify(raw);
    try {
      const parsed = JSON.parse(rawString);
      settingsMap[row.key] =
        typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch {
      settingsMap[row.key] = rawString;
    }
  });

  return { success: true, settings: settingsMap, message: "Settings fetched" };
}

export async function updateSystemSetting(key: string, value: string) {
  return updateSystemSettingsBatch({ [key]: value });
}

export async function updateSystemSettingsBatch(
  updates: Record<string, string>
): Promise<{
  success: boolean;
  message: string;
  updatedKeys?: string[];
}> {
  const supabase = await createClient();
  const authCheck = await checkSuperAdminAccess(supabase);
  if (!authCheck.authorized || !authCheck.userId) {
    return {
      success: false,
      message: authCheck.message || "Access denied.",
    };
  }

  const entries = Object.entries(updates).filter(([key]) =>
    ALLOWED_KEY_SET.has(key)
  );

  if (entries.length === 0) {
    return { success: false, message: "No valid settings to update." };
  }

  const nowISO = new Date().toISOString();
  const rows = entries.map(([key, value]) => ({
    key,
    value: JSON.stringify(value) as Json,
    updated_by: authCheck.userId,
    updated_at: nowISO,
  }));

  const { error } = await supabase
    .from("system_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    return { success: false, message: error.message };
  }

  const updatedKeys = entries.map(([key]) => key);

  await supabase.from("admin_audit_log").insert({
    admin_id: authCheck.userId,
    action: "settings.update",
    details: {
      message:
        updatedKeys.length === 1
          ? `Updated setting: ${updatedKeys[0]}`
          : `Updated ${updatedKeys.length} settings: ${updatedKeys.join(", ")}`,
      keys: updatedKeys,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  // Instantly invalidate cached public settings (see lib/public-settings)
  revalidateTag(PUBLIC_SETTINGS_TAG);

  return {
    success: true,
    message:
      updatedKeys.length === 1
        ? "Setting saved successfully."
        : `${updatedKeys.length} settings saved successfully.`,
    updatedKeys,
  };
}
