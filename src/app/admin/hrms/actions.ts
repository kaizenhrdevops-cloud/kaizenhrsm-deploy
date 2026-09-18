// src/app/admin/hrms/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import { getServiceClient } from "@/lib/supabase-admin";
import type { Database } from "@/types/supabase";

type HrmsModule = Database["public"]["Tables"]["hrms_modules"]["Row"];
type HrmsFeature = Database["public"]["Tables"]["hrms_features"]["Row"];

export type HrmsFeatureInput = {
  id?: string;
  title: string;
  description: string;
  layout: string;
  media_type: string;
  media_src: string;
  media_alt: string;
  bg_color: string;
};

export type HrmsModuleInput = {
  slug: string;
  name: string;
  tagline: string;
  image_src: string;
  card_image_src: string;
  image_ratio: string;
  hero_bg: string;
  nav_description: string;
  icon_name: string;
  outro_text: string;
  status: string;
};

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.status !== "active" ||
    !["admin", "super_admin"].includes(profile.role || "")
  ) {
    return { supabase, user: null as null, error: "Access denied" };
  }
  return { supabase, user, error: null };
}

export async function getHrmsModules(): Promise<{
  success: boolean;
  // Omit newer columns: the list select stays explicit so it keeps working
  // before the newer migrations are applied (the editor loads them via
  // getHrmsModule's select("*") instead).
  modules: (Omit<
    HrmsModule,
    "image_ratio" | "hero_bg" | "nav_description" | "icon_name" | "order_index"
  > & {
    feature_count: number;
    order_index: number;
  })[];
  message: string;
}> {
  const { error } = await requireStaff();
  if (error) return { success: false, modules: [], message: error };

  const adminClient = getServiceClient();

  // Select module fields ordered directly by order_index
  const { data: modules, error: modError } = await adminClient
    .from("hrms_modules")
    .select("slug, name, tagline, image_src, outro_text, status, created_at, updated_at, order_index")
    .order("order_index", { ascending: true });

  if (modError || !modules) {
    return { success: false, modules: [], message: modError?.message || "Failed to load" };
  }

  const { data: counts } = await adminClient
    .from("hrms_features")
    .select("module_slug");

  const countBySlug = new Map<string, number>();
  (counts || []).forEach((r: { module_slug: string }) =>
    countBySlug.set(r.module_slug, (countBySlug.get(r.module_slug) || 0) + 1)
  );

  return {
    success: true,
    modules: modules.map((m, i) => ({
      ...m,
      feature_count: countBySlug.get(m.slug) || 0,
      order_index: typeof m.order_index === "number" ? m.order_index : i,
    })),
    message: "ok",
  };
}

export async function reorderHrmsModules(orderedSlugs: string[]): Promise<{
  success: boolean;
  message: string;
}> {
  const { error } = await requireStaff();
  if (error) return { success: false, message: error };

  if (!Array.isArray(orderedSlugs) || orderedSlugs.length === 0) {
    return { success: false, message: "Invalid module order." };
  }

  const adminClient = getServiceClient();

  // 1. Update order_index on hrms_modules with service role client (bypasses RLS)
  const updatePromises = orderedSlugs.map((slug, idx) =>
    adminClient
      .from("hrms_modules")
      .update({ order_index: idx })
      .eq("slug", slug)
  );
  await Promise.all(updatePromises);

  // 2. Also save to system_settings for redundancy
  await adminClient
    .from("system_settings")
    .upsert(
      { key: "hrms_module_order", value: orderedSlugs },
      { onConflict: "key" }
    );

  revalidatePath("/admin/hrms");
  revalidatePath("/api/hrms-nav");
  revalidatePath("/", "layout");
  revalidatePath("/hrms", "layout");

  return { success: true, message: "Module order saved successfully." };
}

export async function getHrmsModule(slug: string): Promise<{
  success: boolean;
  module: HrmsModule | null;
  features: HrmsFeature[];
  message: string;
}> {
  const { supabase, error } = await requireStaff();
  if (error) return { success: false, module: null, features: [], message: error };

  const { data: module, error: modError } = await supabase
    .from("hrms_modules")
    .select("*")
    .eq("slug", slug)
    .single();

  if (modError || !module) {
    return { success: false, module: null, features: [], message: "Module not found" };
  }

  const { data: features } = await supabase
    .from("hrms_features")
    .select("*")
    .eq("module_slug", slug)
    .order("order_index", { ascending: true });

  return { success: true, module, features: features || [], message: "ok" };
}

export async function createHrmsModule(slug: string, name: string) {
  const cleanSlug = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
    return { success: false, message: "Slug: lowercase letters, numbers, hyphens only." };
  }
  if (!name.trim()) {
    return { success: false, message: "Name is required." };
  }

  const { supabase, error } = await requireStaff();
  if (error) return { success: false, message: error };

  const { error: insError } = await supabase.from("hrms_modules").insert({
    slug: cleanSlug,
    name: name.trim(),
    status: "draft",
  });

  if (insError) {
    return { success: false, message: insError.message };
  }

  // Append new slug to system_settings order
  try {
    const { data: orderSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "hrms_module_order")
      .maybeSingle();

    if (orderSetting?.value) {
      const currentList: string[] = Array.isArray(orderSetting.value)
        ? (orderSetting.value as string[])
        : JSON.parse(orderSetting.value as string);
      if (!currentList.includes(cleanSlug)) {
        currentList.push(cleanSlug);
        await supabase
          .from("system_settings")
          .update({ value: currentList, updated_at: new Date().toISOString() })
          .eq("key", "hrms_module_order");
      }
    }
  } catch {}

  revalidatePath("/admin/hrms");
  revalidatePath("/api/hrms-nav");
  return { success: true, message: "Module created.", slug: cleanSlug };
}

export async function saveHrmsModule(
  originalSlug: string,
  module: HrmsModuleInput,
  features: HrmsFeatureInput[]
) {
  const cleanSlug = module.slug.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
    return { success: false, message: "Slug: lowercase letters, numbers, hyphens only." };
  }
  if (!module.name.trim()) {
    return { success: false, message: "Name is required." };
  }

  const { supabase, error } = await requireStaff();
  if (error) return { success: false, message: error };

  // Rename safe: features.module_slug follows via ON UPDATE CASCADE.
  const baseUpdate = {
    slug: cleanSlug,
    name: module.name.trim(),
    tagline: module.tagline,
    image_src: module.image_src,
    outro_text: module.outro_text || null,
    status: module.status,
    updated_at: new Date().toISOString(),
  };
  // Newer columns (absent until their migrations are applied). Drop each
  // missing one and retry, so a partially-migrated DB still saves every
  // column it does have instead of failing the whole save.
  const payload = {
    ...baseUpdate,
    image_ratio: module.image_ratio || "4:1",
    hero_bg: module.hero_bg || "bg-white",
    nav_description: module.nav_description || "",
    icon_name: module.icon_name || "",
    card_image_src: module.card_image_src || "",
  };
  const NEW_COLS = [
    "image_ratio",
    "hero_bg",
    "nav_description",
    "icon_name",
    "card_image_src",
  ] as const;
  let modMessage: string | null = "not attempted";
  for (let attempt = 0; attempt <= NEW_COLS.length; attempt++) {
    const { error } = await supabase
      .from("hrms_modules")
      .update(payload)
      .eq("slug", originalSlug);
    if (!error) {
      modMessage = null;
      break;
    }
    modMessage = error.message;
    const missing = NEW_COLS.find(
      (c) => c in payload && new RegExp(c, "i").test(error.message)
    );
    if (!missing) break;
    delete (payload as Record<string, unknown>)[missing];
  }

  if (modMessage) {
    return { success: false, message: modMessage };
  }

  // Replace features wholesale (simplest correct sync for ordered lists).
  const { error: delError } = await supabase
    .from("hrms_features")
    .delete()
    .eq("module_slug", cleanSlug);

  if (delError) {
    return { success: false, message: delError.message };
  }

  if (features.length > 0) {
    const rows = features.map((f, i) => ({
      module_slug: cleanSlug,
      title: f.title,
      description: f.description,
      layout: f.layout,
      media_type: f.media_type,
      media_src: f.media_src,
      media_alt: f.media_alt,
      bg_color: f.bg_color,
      order_index: i,
    }));
    const { error: insError } = await supabase
      .from("hrms_features")
      .insert(rows);
    if (insError) {
      return { success: false, message: insError.message };
    }
  }

  revalidatePath("/admin/hrms");
  revalidatePath(`/hrms/${cleanSlug}`);
  revalidatePath("/api/hrms-nav");
  return { success: true, message: "Module saved.", slug: cleanSlug };
}

export async function deleteHrmsModule(slug: string) {
  const { supabase, error } = await requireStaff();
  if (error) return { success: false, message: error };

  const { error: delError } = await supabase
    .from("hrms_modules")
    .delete()
    .eq("slug", slug);

  if (delError) {
    return { success: false, message: delError.message };
  }

  // Remove slug from system_settings order
  try {
    const { data: orderSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "hrms_module_order")
      .maybeSingle();

    if (orderSetting?.value) {
      const currentList: string[] = Array.isArray(orderSetting.value)
        ? (orderSetting.value as string[])
        : JSON.parse(orderSetting.value as string);
      const filtered = currentList.filter((s) => s !== slug);
      await supabase
        .from("system_settings")
        .update({ value: filtered, updated_at: new Date().toISOString() })
        .eq("key", "hrms_module_order");
    }
  } catch {}

  revalidatePath("/admin/hrms");
  revalidatePath(`/hrms/${slug}`);
  revalidatePath("/api/hrms-nav");
  return { success: true, message: "Module deleted." };
}
