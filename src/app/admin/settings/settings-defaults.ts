// Shared settings metadata: categories, factory defaults, key mapping.
// Extracted from SettingsClient so defaults are importable/testable.

import {
  Layout,
  ToggleLeft,
  Mail,
  FileText,
  Globe,
  Share2,
  Award,
  Plug,
  Copyright,
} from "lucide-react";

export type SystemSettings = {
  [key: string]: string;
};

export type Category = {
  id: string;
  label: string;
  icon: typeof Layout;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export const CATEGORIES: Category[] = [
  { id: "general", label: "General System", icon: Layout },
  { id: "features", label: "Feature Toggles", icon: ToggleLeft },
  { id: "email_config", label: "Email Configuration", icon: Mail },
  { id: "blog_config", label: "Blog Settings", icon: FileText },
  { id: "contact", label: "Contact & Company", icon: Globe },
  { id: "social", label: "Social & Apps", icon: Share2 },
  { id: "hero", label: "Homepage Hero", icon: Layout },
  { id: "marketing", label: "Marketing (Trial/Awards)", icon: Award },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "footer", label: "Footer", icon: Copyright },
];

// Factory defaults (single source of truth for Reset + new installs)
export const FACTORY_DEFAULTS: SystemSettings = {
  newsletter_daily_limit: "100",
  audit_log_retention_days: "30",
  contact_address:
    "Suite D-05-01, 5th Floor, Block D,\nPlaza Mont Kiara,\n50480 Kuala Lumpur, Malaysia",
  contact_email: "inquiry@kaizenhrms.com",
  contact_phone: "+603-62010242",
  company_slogan: "Malaysia's Tier 1 Enterprise HR Solution",
  company_founding_year: "1997",
  social_links: JSON.stringify([
    { platform: "Facebook", url: "https://facebook.com" },
    { platform: "LinkedIn", url: "https://linkedin.com" },
  ]),
  link_app_store: "",
  link_google_play: "",
  home_hero_video_id: "https://www.youtube.com/embed/p4-USNtPYrY",
  marketing_award_image_1: "/apicta.png",
  marketing_award_image_2: "/Module_Brochure_Kaizen_Draft.png",
  marketing_trial_image: "/images/hrsm-modules/personnel_hub.png",
  integration_google_maps_embed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.72930091868!2d101.64939557528581!3d3.165847553049145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc48f1965b1f3f%3A0xd37a5feb10a562f9!2sKaiZenHR%20Sdn%20Bhd!5e0!3m2!1sen!2smy!4v1763566181982!5m2!1sen!2smy",
  footer_copyright_text: "© KaiZenHR Sdn Bhd 2025. All Rights Reserved.",
  enable_maintenance_mode: "false",
  enable_public_registration: "true",
  admin_notification_email: "kaizenhr.devops@gmail.com",
  email_sender_name: "KaizenHR",
  email_sender_address: "onboarding@resend.dev",
  blog_default_author_name: "KaizenHR Team",
};

// Map keys to categories
export const CATEGORY_KEYS: Record<string, string[]> = {
  general: ["newsletter_daily_limit", "audit_log_retention_days"],
  features: ["enable_maintenance_mode", "enable_public_registration"],
  email_config: [
    "admin_notification_email",
    "email_sender_name",
    "email_sender_address",
  ],
  blog_config: ["blog_default_author_name"],
  contact: [
    "company_slogan",
    "company_founding_year",
    "contact_address",
    "contact_email",
    "contact_phone",
  ],
  social: ["social_links", "link_app_store", "link_google_play"],
  hero: ["home_hero_video_id"],
  marketing: [
    "marketing_trial_image",
    "marketing_award_image_1",
    "marketing_award_image_2",
  ],
  integrations: ["integration_google_maps_embed"],
  footer: ["footer_copyright_text"],
};
