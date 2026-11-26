// src/lib/nav-items.ts
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/supabase-admin";
import { PUBLIC_NAV_TAG } from "@/lib/cache-tags";
import {
  DEFAULT_NAV_ITEMS,
  type DropdownKey,
  type FooterSectionKey,
  type NavItemKey,
  type NavItemType,
  type PublicNavItem,
} from "@/data/navbar-defaults";

/**
 * Cross-request cached public navbar read (1hr TTL).
 * Uses the service-role client (server-only, cookie-free) so cached reads
 * do not depend on the incoming request. Invalidated instantly whenever a
 * super_admin updates navigation via revalidateTag(PUBLIC_NAV_TAG).
 *
 * Throwing on DB error prevents caching a transient failure or pre-migration
 * state; getPublicNavItems() catches and safely falls back to DEFAULT_NAV_ITEMS.
 */
const fetchPublicNavItems = unstable_cache(
  async (): Promise<PublicNavItem[]> => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("navbar_items")
      .select(
        "key, label, item_type, href, dropdown_key, footer_section, order_index"
      )
      .eq("is_visible", true)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      key: row.key as NavItemKey,
      label: row.label,
      item_type: row.item_type as NavItemType,
      href: row.href,
      dropdown_key: row.dropdown_key as DropdownKey | null,
      footer_section: row.footer_section as FooterSectionKey | null,
      order_index: row.order_index,
    }));
  },
  ["public-nav-items"],
  { revalidate: 3600, tags: [PUBLIC_NAV_TAG] }
);

/**
 * Request-memoized public navbar items distributed from (public)/layout.tsx
 * via NavProvider so Navbar, DesktopDropdowns, MobileMenu, and Footer share
 * a single cached read with zero client waterfalls.
 */
export const getPublicNavItems = cache(
  async function getPublicNavItems(): Promise<PublicNavItem[]> {
    try {
      return await fetchPublicNavItems();
    } catch (err) {
      console.error(
        "Failed to load navbar_items, falling back to defaults:",
        err
      );
      return DEFAULT_NAV_ITEMS;
    }
  }
);
