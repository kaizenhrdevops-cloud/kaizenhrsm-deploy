// src/app/admin/navigation/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { PUBLIC_NAV_TAG } from "@/lib/cache-tags";
import {
  BIN_RETENTION_DAYS,
  NAV_LABEL_MAX_LENGTH,
  type AdminNavItem,
  type DropdownKey,
  type FooterSectionKey,
  type NavItemKey,
  type NavItemType,
} from "@/data/navbar-defaults";
import type { Json } from "@/types/supabase";

const RETENTION_MS = BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null as null, error: "Not authenticated." };
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
    return {
      user: null as null,
      error: "Access denied. Super admin privileges required.",
    };
  }

  return { user, error: null };
}

async function logNavAudit(
  adminId: string | null,
  action: string,
  details: { [key: string]: Json | undefined }
) {
  try {
    const adminClient = getServiceClient();
    await adminClient.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      details,
    });
  } catch (err) {
    console.error("Failed to write navigation audit log:", err);
  }
}

function revalidateNavigation() {
  revalidateTag(PUBLIC_NAV_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
}

/**
 * Permanently removes bin items older than BIN_RETENTION_DAYS (30 days).
 * Safe to call during page load because it does not invoke revalidateTag.
 */
async function purgeExpiredBinRows(): Promise<number> {
  const adminClient = getServiceClient();
  const cutoffISO = new Date(Date.now() - RETENTION_MS).toISOString();

  const { data: purged, error } = await adminClient
    .from("navbar_items")
    .delete()
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoffISO)
    .select("key, label");

  if (error || !purged || purged.length === 0) {
    return 0;
  }

  await logNavAudit(null, "PURGE_EXPIRED_NAV_ITEMS", {
    message: `Automatically purged ${purged.length} expired navbar menu(s) after ${BIN_RETENTION_DAYS} days in the bin.`,
    purged_items: purged.map((p) => `${p.label} (${p.key})`),
  });

  return purged.length;
}

async function loadAllAdminNavItems(): Promise<{
  items: AdminNavItem[];
  error: string | null;
  migrationMissing?: boolean;
}> {
  const adminClient = getServiceClient();

  // Opportunistically clean any rows past the 30-day retention window.
  await purgeExpiredBinRows();

  const { data, error } = await adminClient
    .from("navbar_items")
    .select(
      "key, label, item_type, href, dropdown_key, footer_section, order_index, is_visible, deleted_at, deleted_by, updated_at"
    )
    .order("order_index", { ascending: true })
    .order("key", { ascending: true });

  if (error) {
    const missing =
      error.code === "42P01" ||
      /relation .*navbar_items.* does not exist/i.test(error.message) ||
      /could not find the table .*navbar_items/i.test(error.message);

    return {
      items: [],
      error: error.message,
      migrationMissing: missing,
    };
  }

  const rows = data ?? [];
  const deletedByIds = Array.from(
    new Set(
      rows
        .map((r) => r.deleted_by)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const profileNameMap = new Map<string, string>();
  if (deletedByIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", deletedByIds);

    (profiles ?? []).forEach((p) => {
      profileNameMap.set(p.id, p.full_name || p.email);
    });
  }

  return {
    items: rows.map((row) => ({
      key: row.key as NavItemKey,
      label: row.label,
      item_type: row.item_type as NavItemType,
      href: row.href,
      dropdown_key: row.dropdown_key as DropdownKey | null,
      footer_section: row.footer_section as FooterSectionKey | null,
      order_index: row.order_index,
      is_visible: row.is_visible,
      deleted_at: row.deleted_at,
      deleted_by: row.deleted_by,
      deleted_by_name: row.deleted_by
        ? profileNameMap.get(row.deleted_by) ?? null
        : null,
      updated_at: row.updated_at,
    })),
    error: null,
  };
}

export async function getAdminNavItems(): Promise<{
  success: boolean;
  items: AdminNavItem[];
  message: string;
  migrationMissing?: boolean;
}> {
  const { error } = await requireSuperAdmin();
  if (error) {
    return { success: false, items: [], message: error };
  }

  const result = await loadAllAdminNavItems();
  if (result.error) {
    return {
      success: false,
      items: [],
      message: result.error,
      migrationMissing: result.migrationMissing,
    };
  }

  return { success: true, items: result.items, message: "ok" };
}

export async function moveNavItem(
  key: NavItemKey,
  direction: "left" | "right"
): Promise<{
  success: boolean;
  message: string;
  items?: AdminNavItem[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { data: activeRows, error: fetchError } = await adminClient
    .from("navbar_items")
    .select("key, label, order_index")
    .is("deleted_at", null)
    .order("order_index", { ascending: true })
    .order("key", { ascending: true });

  if (fetchError || !activeRows) {
    return {
      success: false,
      message: fetchError?.message || "Failed to load navbar items.",
    };
  }

  const idx = activeRows.findIndex((item) => item.key === key);
  if (idx === -1) {
    return { success: false, message: "Menu item not found or is in the bin." };
  }

  const targetIdx = direction === "left" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= activeRows.length) {
    return {
      success: false,
      message:
        direction === "left"
          ? "Menu item is already at the leftmost position."
          : "Menu item is already at the rightmost position.",
    };
  }

  const reordered = [...activeRows];
  const [moved] = reordered.splice(idx, 1);
  reordered.splice(targetIdx, 0, moved);

  const updates = await Promise.all(
    reordered.map((item, position) =>
      adminClient
        .from("navbar_items")
        .update({ order_index: position })
        .eq("key", item.key)
    )
  );

  const failedUpdate = updates.find((u) => u.error);
  if (failedUpdate?.error) {
    return { success: false, message: failedUpdate.error.message };
  }

  await logNavAudit(user.id, "REORDER_NAV_ITEMS", {
    message: `Moved "${moved.label}" ${direction} (position ${idx + 1} → ${targetIdx + 1}).`,
    key: moved.key,
    label: moved.label,
    direction,
    new_order: reordered.map((r) => r.key),
  });

  revalidateNavigation();
  const refreshed = await loadAllAdminNavItems();

  return {
    success: true,
    message: `Moved "${moved.label}" ${direction}.`,
    items: refreshed.items,
  };
}

export async function updateNavItemLabel(
  key: NavItemKey,
  rawLabel: string
): Promise<{
  success: boolean;
  message: string;
  items?: AdminNavItem[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const cleanedLabel = rawLabel.replace(/[\r\n\t]+/g, " ").trim();
  if (!cleanedLabel) {
    return { success: false, message: "Menu name cannot be empty." };
  }
  if (cleanedLabel.length > NAV_LABEL_MAX_LENGTH) {
    return {
      success: false,
      message: `Menu name must be ${NAV_LABEL_MAX_LENGTH} characters or fewer.`,
    };
  }

  const adminClient = getServiceClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("navbar_items")
    .select("key, label, deleted_at, footer_section")
    .eq("key", key)
    .single();

  if (fetchError || !existing) {
    return { success: false, message: "Menu item not found." };
  }
  if (existing.deleted_at) {
    return {
      success: false,
      message: "Restore the menu item from the bin before renaming it.",
    };
  }
  if (existing.label === cleanedLabel) {
    return { success: true, message: "No changes made." };
  }

  const { error: updateError } = await adminClient
    .from("navbar_items")
    .update({ label: cleanedLabel })
    .eq("key", key);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await logNavAudit(user.id, "RENAME_NAV_ITEM", {
    message: `Renamed navbar menu "${existing.label}" to "${cleanedLabel}".`,
    key,
    old_label: existing.label,
    new_label: cleanedLabel,
    syncs_footer: Boolean(existing.footer_section),
  });

  revalidateNavigation();
  const refreshed = await loadAllAdminNavItems();

  return {
    success: true,
    message: `Renamed "${existing.label}" to "${cleanedLabel}".`,
    items: refreshed.items,
  };
}

export async function toggleNavItemVisibility(
  key: NavItemKey,
  isVisible: boolean
): Promise<{
  success: boolean;
  message: string;
  items?: AdminNavItem[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("navbar_items")
    .select("key, label, deleted_at, footer_section")
    .eq("key", key)
    .single();

  if (fetchError || !existing || existing.deleted_at) {
    return { success: false, message: "Active menu item not found." };
  }

  const { error: updateError } = await adminClient
    .from("navbar_items")
    .update({ is_visible: isVisible })
    .eq("key", key);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  const footerNote = existing.footer_section ? " and Footer" : "";
  await logNavAudit(user.id, isVisible ? "SHOW_NAV_ITEM" : "HIDE_NAV_ITEM", {
    message: isVisible
      ? `Shown "${existing.label}" in Navbar${footerNote}.`
      : `Hidden "${existing.label}" from Navbar${footerNote}.`,
    key,
    label: existing.label,
    is_visible: isVisible,
    footer_section: existing.footer_section,
  });

  revalidateNavigation();
  const refreshed = await loadAllAdminNavItems();

  return {
    success: true,
    message: isVisible
      ? `"${existing.label}" is now visible in Navbar${footerNote}.`
      : `"${existing.label}" is now hidden from Navbar${footerNote}.`,
    items: refreshed.items,
  };
}

export async function softDeleteNavItem(
  key: NavItemKey,
  confirmLabel: string
): Promise<{
  success: boolean;
  message: string;
  items?: AdminNavItem[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("navbar_items")
    .select("key, label, deleted_at, footer_section")
    .eq("key", key)
    .single();

  if (fetchError || !existing) {
    return { success: false, message: "Menu item not found." };
  }
  if (existing.deleted_at) {
    return { success: false, message: "This menu item is already in the bin." };
  }

  // Server-side enforcement of Step 3 exact-name validation
  if (confirmLabel.trim() !== existing.label.trim()) {
    return {
      success: false,
      message: `Confirmation failed. Please type "${existing.label}" exactly.`,
    };
  }

  const nowISO = new Date().toISOString();
  const { error: deleteError } = await adminClient
    .from("navbar_items")
    .update({
      deleted_at: nowISO,
      deleted_by: user.id,
      is_visible: false,
    })
    .eq("key", key);

  if (deleteError) {
    return { success: false, message: deleteError.message };
  }

  // Re-normalize order_index for remaining active items
  const { data: remaining } = await adminClient
    .from("navbar_items")
    .select("key")
    .is("deleted_at", null)
    .order("order_index", { ascending: true })
    .order("key", { ascending: true });

  if (remaining && remaining.length > 0) {
    await Promise.all(
      remaining.map((row, idx) =>
        adminClient
          .from("navbar_items")
          .update({ order_index: idx })
          .eq("key", row.key)
      )
    );
  }

  const footerNote = existing.footer_section ? " and Footer" : "";
  await logNavAudit(user.id, "SOFT_DELETE_NAV_ITEM", {
    message: `Moved "${existing.label}" to Bin (removed from Navbar${footerNote}; auto-purges in ${BIN_RETENTION_DAYS} days).`,
    key,
    label: existing.label,
    footer_section: existing.footer_section,
    deleted_at: nowISO,
    retention_days: BIN_RETENTION_DAYS,
  });

  revalidateNavigation();
  const refreshed = await loadAllAdminNavItems();

  return {
    success: true,
    message: `"${existing.label}" moved to Bin. It will be permanently erased after ${BIN_RETENTION_DAYS} days.`,
    items: refreshed.items,
  };
}

export async function restoreNavItem(key: NavItemKey): Promise<{
  success: boolean;
  message: string;
  items?: AdminNavItem[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("navbar_items")
    .select("key, label, deleted_at, footer_section")
    .eq("key", key)
    .single();

  if (fetchError || !existing || !existing.deleted_at) {
    return { success: false, message: "Binned menu item not found." };
  }

  // Enforce 30-day expiration even if daily cron hasn't run yet today
  const deletedMs = new Date(existing.deleted_at).getTime();
  if (Date.now() - deletedMs >= RETENTION_MS) {
    await adminClient.from("navbar_items").delete().eq("key", key);
    await logNavAudit(null, "PURGE_EXPIRED_NAV_ITEMS", {
      message: `Purged expired navbar menu "${existing.label}" during restore attempt.`,
      key,
      label: existing.label,
    });
    revalidateNavigation();
    const refreshed = await loadAllAdminNavItems();
    return {
      success: false,
      message: `"${existing.label}" exceeded the ${BIN_RETENTION_DAYS}-day bin window and has been permanently removed.`,
      items: refreshed.items,
    };
  }

  const { data: activeRows } = await adminClient
    .from("navbar_items")
    .select("order_index")
    .is("deleted_at", null)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrder =
    activeRows && activeRows.length > 0 ? activeRows[0].order_index + 1 : 0;

  const { error: restoreError } = await adminClient
    .from("navbar_items")
    .update({
      deleted_at: null,
      deleted_by: null,
      is_visible: true,
      order_index: nextOrder,
    })
    .eq("key", key);

  if (restoreError) {
    return { success: false, message: restoreError.message };
  }

  const footerNote = existing.footer_section ? " and Footer" : "";
  await logNavAudit(user.id, "RESTORE_NAV_ITEM", {
    message: `Restored "${existing.label}" from Bin back to Navbar${footerNote}.`,
    key,
    label: existing.label,
    footer_section: existing.footer_section,
  });

  revalidateNavigation();
  const refreshed = await loadAllAdminNavItems();

  return {
    success: true,
    message: `Restored "${existing.label}" to the live Navbar${footerNote}.`,
    items: refreshed.items,
  };
}

export async function permanentlyDeleteNavItem(
  key: NavItemKey,
  confirmText: string
): Promise<{
  success: boolean;
  message: string;
  items?: AdminNavItem[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("navbar_items")
    .select("key, label, deleted_at")
    .eq("key", key)
    .single();

  if (fetchError || !existing || !existing.deleted_at) {
    return {
      success: false,
      message: "Only items currently in the Bin can be permanently deleted.",
    };
  }

  const expected = `DELETE ${existing.label}`;
  if (confirmText.trim() !== expected) {
    return {
      success: false,
      message: `Confirmation failed. Please type "${expected}" exactly.`,
    };
  }

  const { error: hardDeleteError } = await adminClient
    .from("navbar_items")
    .delete()
    .eq("key", key);

  if (hardDeleteError) {
    return { success: false, message: hardDeleteError.message };
  }

  await logNavAudit(user.id, "PERMANENT_DELETE_NAV_ITEM", {
    message: `Permanently deleted navbar menu "${existing.label}" from Bin.`,
    key,
    label: existing.label,
  });

  revalidateNavigation();
  const refreshed = await loadAllAdminNavItems();

  return {
    success: true,
    message: `"${existing.label}" has been permanently deleted.`,
    items: refreshed.items,
  };
}
