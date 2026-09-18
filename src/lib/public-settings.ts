"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/supabase-admin";
import { PUBLIC_SETTINGS_TAG } from "@/lib/cache-tags";

export type PublicSettings = {
  // Contact
  contact_address?: string;
  contact_email?: string;
  contact_phone?: string;

  // Branding
  company_slogan?: string;
  company_founding_year?: string;

  // Social & Apps
  social_links?: string;
  link_app_store?: string;
  link_google_play?: string;

  // Hero
  home_hero_video_id?: string;

  // Marketing
  marketing_award_image_1?: string;
  marketing_award_image_2?: string;
  marketing_trial_image?: string;

  // Integrations
  integration_google_maps_embed?: string;

  // Footer
  footer_copyright_text?: string;

  // --- NEW: Feature Toggles ---
  enable_maintenance_mode?: string; // "true" | "false"
  enable_public_registration?: string; // "true" | "false"

  // --- NEW: Blog ---
  blog_default_author_name?: string;

  // --- Email config (used by contact + newsletter routes) ---
  admin_notification_email?: string;
  email_sender_name?: string;
  email_sender_address?: string;
};

const SETTING_KEYS = [
  "contact_address",
  "contact_email",
  "contact_phone",
  "company_slogan",
  "company_founding_year",
  "social_links",
  "link_app_store",
  "link_google_play",
  "home_hero_video_id",
  "marketing_award_image_1",
  "marketing_award_image_2",
  "marketing_trial_image",
  "integration_google_maps_embed",
  "footer_copyright_text",
  // New Keys
  "enable_maintenance_mode",
  "enable_public_registration",
  "blog_default_author_name",
  // Email config (used by contact + newsletter routes)
  "admin_notification_email",
  "email_sender_name",
  "email_sender_address",
];

/**
 * Cross-request cached settings read (1hr TTL).
 * Uses the service-role client (server-only, no cookies) because
 * RLS only allows admins to read system_settings — and cached reads
 * must not depend on the request. Invalidated instantly on admin save
 * via revalidateTag(PUBLIC_SETTINGS_TAG) in updateSystemSetting.
 */
const fetchPublicSettings = unstable_cache(
  async (): Promise<PublicSettings> => {
    const supabase = getServiceClient();

    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", SETTING_KEYS);

    const settings: PublicSettings = {};

    if (data) {
      const target = settings as Record<string, string | undefined>;
      data.forEach((row) => {
        const raw = row.value as unknown;
        const rawString =
          typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          const parsed = JSON.parse(rawString);
          target[row.key] =
            typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        } catch {
          target[row.key] = rawString;
        }
      });
    }

    return settings;
  },
  ["public-settings"],
  { revalidate: 3600, tags: [PUBLIC_SETTINGS_TAG] }
);

/**
 * Request-memoized on top of the cross-request cache, so the 5+
 * callers per homepage (Navbar, Footer, Hero, Trial, Award) share
 * a single in-memory read with zero DB queries on cache hits.
 */
export const getPublicSettings = cache(async function getPublicSettings(): Promise<PublicSettings> {
  return fetchPublicSettings();
});
