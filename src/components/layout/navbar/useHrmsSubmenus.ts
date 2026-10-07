// src/components/layout/navbar/useHrmsSubmenus.ts
"use client";

import { useEffect, useState } from "react";
import { hrmsSubmenus } from "@/data/submenus";
import { resolveHrmsIcon } from "@/lib/hrms-icons";
import type { SubmenuItem } from "./NavItems";

type NavModule = {
  slug: string;
  name: string;
  tagline: string | null;
  icon_name?: string | null;
  nav_description?: string | null;
};

/** Short menu blurb: author's text, else tagline truncated to ~2 lines. */
function menuDescription(m: NavModule): string {
  const custom = (m.nav_description || "").trim();
  if (custom) return custom;
  const tag = (m.tagline || "").trim() || "Explore this HRMS module";
  return tag.length > 90 ? tag.slice(0, 87).trimEnd() + "…" : tag;
}

/**
 * Build the HRMS submenu preserving CMS ordering.
 * The order returned by the API (dynamicModules) dictates the navbar display order!
 * Static defaults provide fallback icons only for matching slugs — they are
 * NEVER appended. The CMS is the single source of truth, so renaming a slug
 * (e.g. `recruitment` -> `recruitment-onboarding`) must not leave a ghost
 * static entry (`/hrms/recruitment`) in the navbar.
 */
export function mergeHrmsSubmenus(dynamicModules: NavModule[]): SubmenuItem[] {
  if (!dynamicModules || dynamicModules.length === 0) {
    return hrmsSubmenus;
  }

  // Index static items by slug for fallback icons only (no appending).
  const staticBySlug = new Map<string, SubmenuItem>();
  for (const staticItem of hrmsSubmenus) {
    const slug = staticItem.path.replace(/^\/hrms\//, "");
    staticBySlug.set(slug, staticItem);
  }

  const result: SubmenuItem[] = [];

  // Follow the exact order of dynamicModules from CMS / API — nothing else.
  for (const m of dynamicModules) {
    if (!m?.slug) continue;
    const staticMatch = staticBySlug.get(m.slug);

    // Empty icon_name => reuse the curated static icon so older rows keep
    // their look; a typed name (valid or not) resolves via lucide.
    const hasCustomIcon = !!(m.icon_name || "").trim();

    result.push({
      icon: hasCustomIcon
        ? resolveHrmsIcon(m.icon_name)
        : (staticMatch?.icon ?? resolveHrmsIcon(m.icon_name)),
      name: m.name,
      description: menuDescription(m) || staticMatch?.description || "Explore this HRMS module",
      path: `/hrms/${m.slug}`,
    });
  }

  return result;
}

// Shared in-memory cache so Navbar dropdown + mobile menu + footer
// mounted on the same page reuse one fetch instead of firing three.
let cachedModules: NavModule[] | null = null;
let cachedAt = 0;
let inflight: Promise<NavModule[]> | null = null;
const CACHE_TTL_MS = 10_000;

async function fetchNavModules(): Promise<NavModule[]> {
  const now = Date.now();
  if (cachedModules && now - cachedAt < CACHE_TTL_MS) return cachedModules;
  if (inflight) return inflight;

  inflight = fetch("/api/hrms-nav")
    .then((res) => (res.ok ? res.json() : { modules: [] }))
    .then((json) => {
      const modules = Array.isArray(json?.modules) ? json.modules : [];
      cachedModules = modules;
      cachedAt = Date.now();
      return modules;
    })
    .catch(() => cachedModules || [])
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Dynamic HRMS menu: static entries + any NEW published CMS pages from
 * /admin/hrms. Falls back to the static list until the fetch resolves
 * (and if the API is unreachable).
 */
export function useHrmsSubmenus(): SubmenuItem[] {
  const [items, setItems] = useState<SubmenuItem[]>(hrmsSubmenus);

  useEffect(() => {
    let cancelled = false;
    fetchNavModules().then((modules) => {
      if (!cancelled && modules.length > 0) {
        setItems(mergeHrmsSubmenus(modules));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}
