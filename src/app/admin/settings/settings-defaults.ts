// src/app/admin/settings/settings-defaults.ts
// Shared settings metadata: 5 logical sections, factory defaults, search index, and key mapping.

import {
  Building2,
  Sparkles,
  PanelBottom,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type SystemSettings = {
  [key: string]: string;
};

export type CategoryId =
  | "company_contact"
  | "homepage_content"
  | "footer_social"
  | "email_newsletter"
  | "system_safety";

export type Category = {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type SettingSearchItem = {
  key: string;
  categoryId: CategoryId;
  label: string;
  whereUsed: string;
  keywords: string[];
};

export const SOCIAL_PLATFORM_PRESETS = [
  "Facebook",
  "LinkedIn",
  "Instagram",
  "YouTube",
  "Twitter / X",
  "TikTok",
  "GitHub",
  "Website",
] as const;

export const CATEGORIES: Category[] = [
  {
    id: "company_contact",
    label: "Company & Contact",
    description: "Brand identity, contact details & office map",
    icon: Building2,
  },
  {
    id: "homepage_content",
    label: "Homepage & Content",
    description: "Hero video, marketing visuals & default blog author",
    icon: Sparkles,
  },
  {
    id: "footer_social",
    label: "Footer, Social & Apps",
    description: "Social links, mobile app buttons & copyright text",
    icon: PanelBottom,
  },
  {
    id: "email_newsletter",
    label: "Email & Newsletter",
    description: "Sender identity, schedule & Resend daily quota",
    icon: Mail,
  },
  {
    id: "system_safety",
    label: "System & Safety",
    description: "Maintenance mode, public signups & log retention",
    icon: ShieldCheck,
  },
];

// Factory defaults (single source of truth for Reset Section + new installs)
export const FACTORY_DEFAULTS: SystemSettings = {
  // Company & Contact
  company_slogan: "Malaysia's Tier 1 Enterprise HR Solution",
  company_founding_year: "1997",
  contact_address:
    "Suite D-05-01, 5th Floor, Block D,\nPlaza Mont Kiara,\n50480 Kuala Lumpur, Malaysia",
  contact_email: "inquiry@kaizenhrms.com",
  contact_phone: "+603-62010242",
  integration_google_maps_embed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.72930091868!2d101.64939557528581!3d3.165847553049145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc48f1965b1f3f%3A0xd37a5feb10a562f9!2sKaiZenHR%20Sdn%20Bhd!5e0!3m2!1sen!2smy!4v1763566181982!5m2!1sen!2smy",

  // Homepage & Content
  home_hero_video_id: "https://www.youtube.com/embed/p4-USNtPYrY",
  marketing_trial_image: "/images/hrsm-modules/personnel_hub.png",
  marketing_award_image_1: "/apicta.png",
  marketing_award_image_2: "/Module_Brochure_Kaizen_Draft.png",
  blog_default_author_name: "KaizenHR Team",

  // Footer, Social & Apps
  social_links: JSON.stringify([
    { platform: "Facebook", url: "https://facebook.com" },
    { platform: "LinkedIn", url: "https://linkedin.com" },
  ]),
  link_app_store: "",
  link_google_play: "",
  footer_copyright_text: "© KaiZenHR Sdn Bhd 2025. All Rights Reserved.",

  // Email & Newsletter
  admin_notification_email: "kaizenhr.devops@gmail.com",
  email_sender_name: "KaizenHR",
  // Fail-loud placeholder, NOT a working address: "example.com" can never
  // deliver. Set a verified-domain address here or via RESEND_FROM_EMAIL.
  email_sender_address: "unconfigured-sender@example.com",
  newsletter_frequency: "weekly",
  newsletter_send_day: "1",
  newsletter_send_time: "10:00",
  newsletter_daily_limit: "100",
  newsletter_transactional_reserve: "20",

  // System & Safety
  enable_maintenance_mode: "false",
  enable_public_registration: "true",
  audit_log_retention_days: "30",
};

/**
 * Fallback values used ONLY when a key does not yet exist in the database
 * so controlled toggles, selects, and JSON arrays start cleanly without
 * overwriting intentionally blank optional URLs.
 */
export const INITIAL_STATE_FALLBACKS: SystemSettings = {
  social_links: "[]",
  newsletter_frequency: "weekly",
  newsletter_send_day: "1",
  newsletter_send_time: "10:00",
  newsletter_daily_limit: "100",
  newsletter_transactional_reserve: "20",
  enable_maintenance_mode: "false",
  enable_public_registration: "true",
  audit_log_retention_days: "30",
};

// Map keys to the 5 consolidated sections
export const CATEGORY_KEYS: Record<CategoryId, string[]> = {
  company_contact: [
    "company_slogan",
    "company_founding_year",
    "contact_email",
    "contact_phone",
    "contact_address",
    "integration_google_maps_embed",
  ],
  homepage_content: [
    "home_hero_video_id",
    "marketing_trial_image",
    "marketing_award_image_1",
    "marketing_award_image_2",
    "blog_default_author_name",
  ],
  footer_social: [
    "social_links",
    "link_app_store",
    "link_google_play",
    "footer_copyright_text",
  ],
  email_newsletter: [
    "admin_notification_email",
    "email_sender_name",
    "email_sender_address",
    "newsletter_frequency",
    "newsletter_send_day",
    "newsletter_send_time",
    "newsletter_daily_limit",
    "newsletter_transactional_reserve",
  ],
  system_safety: [
    "enable_maintenance_mode",
    "enable_public_registration",
    "audit_log_retention_days",
  ],
};

export const ALL_SETTING_KEYS: string[] = Object.values(CATEGORY_KEYS).flat();

/** Quick-search index so new super_admins can locate any setting immediately. */
export const SETTINGS_SEARCH_INDEX: SettingSearchItem[] = [
  {
    key: "company_slogan",
    categoryId: "company_contact",
    label: "Company Slogan",
    whereUsed: "Footer & Brand Intro",
    keywords: ["tagline", "brand", "footer", "slogan"],
  },
  {
    key: "company_founding_year",
    categoryId: "company_contact",
    label: "Founding Year",
    whereUsed: "About Us & Company Info",
    keywords: ["established", "years", "history", "founded"],
  },
  {
    key: "contact_email",
    categoryId: "company_contact",
    label: "Public Contact Email",
    whereUsed: "Contact Us Page",
    keywords: ["inquiry", "email", "support", "contact"],
  },
  {
    key: "contact_phone",
    categoryId: "company_contact",
    label: "Phone Number",
    whereUsed: "Contact Us Page",
    keywords: ["telephone", "call", "hotline", "phone"],
  },
  {
    key: "contact_address",
    categoryId: "company_contact",
    label: "Office Address",
    whereUsed: "Contact Us Page",
    keywords: ["location", "office", "street", "address"],
  },
  {
    key: "integration_google_maps_embed",
    categoryId: "company_contact",
    label: "Google Maps Embed URL",
    whereUsed: "Contact Us Map",
    keywords: ["map", "google", "embed", "directions", "location"],
  },
  {
    key: "home_hero_video_id",
    categoryId: "homepage_content",
    label: "Homepage Hero Video",
    whereUsed: "Homepage Hero Section",
    keywords: ["youtube", "video", "embed", "hero", "home"],
  },
  {
    key: "marketing_trial_image",
    categoryId: "homepage_content",
    label: "Free Trial Section Image",
    whereUsed: "Homepage Trial Banner",
    keywords: ["trial", "demo", "image", "marketing", "banner"],
  },
  {
    key: "marketing_award_image_1",
    categoryId: "homepage_content",
    label: "Award Image 1",
    whereUsed: "Homepage Awards Section",
    keywords: ["award", "badge", "apicta", "image"],
  },
  {
    key: "marketing_award_image_2",
    categoryId: "homepage_content",
    label: "Award Image 2",
    whereUsed: "Homepage Awards Section",
    keywords: ["award", "brochure", "badge", "image"],
  },
  {
    key: "blog_default_author_name",
    categoryId: "homepage_content",
    label: "Default Blog Author",
    whereUsed: "Blog Articles",
    keywords: ["blog", "author", "writer", "articles"],
  },
  {
    key: "social_links",
    categoryId: "footer_social",
    label: "Social Media Links",
    whereUsed: 'Footer "Follow us"',
    keywords: ["facebook", "linkedin", "instagram", "youtube", "twitter", "tiktok", "follow"],
  },
  {
    key: "link_app_store",
    categoryId: "footer_social",
    label: "App Store (iOS) Link",
    whereUsed: 'Footer "Download the Mobile App"',
    keywords: ["apple", "ios", "iphone", "mobile", "app"],
  },
  {
    key: "link_google_play",
    categoryId: "footer_social",
    label: "Google Play (Android) Link",
    whereUsed: 'Footer "Download the Mobile App"',
    keywords: ["android", "play store", "google", "mobile", "app"],
  },
  {
    key: "footer_copyright_text",
    categoryId: "footer_social",
    label: "Footer Copyright Text",
    whereUsed: "Footer Bottom Bar",
    keywords: ["copyright", "legal", "year", "footer"],
  },
  {
    key: "admin_notification_email",
    categoryId: "email_newsletter",
    label: "Admin Notification Email",
    whereUsed: "Contact Form Alerts",
    keywords: ["alert", "inbox", "notification", "contact", "admin"],
  },
  {
    key: "email_sender_name",
    categoryId: "email_newsletter",
    label: "Email Sender Name",
    whereUsed: "Outgoing Emails",
    keywords: ["from", "sender", "resend", "name"],
  },
  {
    key: "email_sender_address",
    categoryId: "email_newsletter",
    label: "Sender Email Address",
    whereUsed: "Outgoing Emails (Resend)",
    keywords: ["from", "sender", "resend", "domain", "email"],
  },
  {
    key: "newsletter_frequency",
    categoryId: "email_newsletter",
    label: "Newsletter Delivery Frequency",
    whereUsed: "Newsletter Scheduler",
    keywords: ["weekly", "daily", "newsletter", "schedule"],
  },
  {
    key: "newsletter_send_day",
    categoryId: "email_newsletter",
    label: "Weekly Send Day",
    whereUsed: "Newsletter Scheduler",
    keywords: ["monday", "day", "weekly", "newsletter"],
  },
  {
    key: "newsletter_send_time",
    categoryId: "email_newsletter",
    label: "Preferred Send Time (MYT)",
    whereUsed: "Newsletter Scheduler",
    keywords: ["time", "clock", "gmt+8", "myt", "schedule"],
  },
  {
    key: "newsletter_daily_limit",
    categoryId: "email_newsletter",
    label: "Daily Total Email Limit",
    whereUsed: "Email Quota Guard",
    keywords: ["quota", "limit", "100", "resend", "cap"],
  },
  {
    key: "newsletter_transactional_reserve",
    categoryId: "email_newsletter",
    label: "Transactional Reserve",
    whereUsed: "Priority Email Protection",
    keywords: ["reserve", "priority", "quota", "transactional"],
  },
  {
    key: "enable_maintenance_mode",
    categoryId: "system_safety",
    label: "Maintenance Mode",
    whereUsed: "Entire Public Website",
    keywords: ["offline", "down", "maintenance", "lock", "disable"],
  },
  {
    key: "enable_public_registration",
    categoryId: "system_safety",
    label: "Allow Public Newsletter Signups",
    whereUsed: "Newsletter Subscribe API",
    keywords: ["registration", "subscribe", "signup", "newsletter", "public"],
  },
  {
    key: "audit_log_retention_days",
    categoryId: "system_safety",
    label: "Audit Log Retention",
    whereUsed: "Daily Cleanup Cron",
    keywords: ["audit", "logs", "retention", "cleanup", "days", "prune"],
  },
];
