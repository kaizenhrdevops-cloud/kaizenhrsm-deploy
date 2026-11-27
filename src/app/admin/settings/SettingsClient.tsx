// src/app/admin/settings/SettingsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Info,
  PanelTop,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { updateSystemSettingsBatch } from "./actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Button from "@/components/ui/Button";
import SettingsImageUploader from "@/components/admin/SettingsImageUploader";
import { getSocialIcon } from "@/components/layout/social-icons";
import { cn } from "@/lib/utils";
import { Field, SettingsCard, Toggle } from "./SettingsField";
import {
  ALL_SETTING_KEYS,
  CATEGORIES,
  CATEGORY_KEYS,
  FACTORY_DEFAULTS,
  INITIAL_STATE_FALLBACKS,
  SETTINGS_SEARCH_INDEX,
  SOCIAL_PLATFORM_PRESETS,
  type CategoryId,
  type SocialLink,
  type SystemSettings,
} from "./settings-defaults";

function buildNormalizedSettings(raw: SystemSettings): SystemSettings {
  const normalized: SystemSettings = {};
  for (const key of ALL_SETTING_KEYS) {
    if (typeof raw[key] === "string") {
      normalized[key] = raw[key];
    } else if (key in INITIAL_STATE_FALLBACKS) {
      normalized[key] = INITIAL_STATE_FALLBACKS[key];
    } else {
      normalized[key] = "";
    }
  }
  return normalized;
}

function parseSocialList(raw: string | undefined): SocialLink[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      platform:
        entry && typeof entry.platform === "string" ? entry.platform : "",
      url: entry && typeof entry.url === "string" ? entry.url : "",
    }));
  } catch {
    return [];
  }
}

function isConfiguredUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  return Boolean(trimmed && trimmed !== "#");
}

function isPresetPlatform(name: string): boolean {
  return (SOCIAL_PLATFORM_PRESETS as readonly string[]).includes(name);
}

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: SystemSettings;
}) {
  const normalizedInitial = useMemo(
    () => buildNormalizedSettings(initialSettings),
    [initialSettings]
  );

  const [settings, setSettings] = useState<SystemSettings>(normalizedInitial);
  const [baseline, setBaseline] = useState<SystemSettings>(normalizedInitial);
  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("company_contact");
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);

  // Quick search & highlight
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  // Track unsaved keys globally and per section
  const dirtyKeys = useMemo(
    () => ALL_SETTING_KEYS.filter((key) => settings[key] !== baseline[key]),
    [settings, baseline]
  );
  const isChanged = dirtyKeys.length > 0;

  const dirtyCountByCategory = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      company_contact: 0,
      homepage_content: 0,
      footer_social: 0,
      email_newsletter: 0,
      system_safety: 0,
    };
    const dirtySet = new Set(dirtyKeys);
    for (const cat of CATEGORIES) {
      counts[cat.id] = CATEGORY_KEYS[cat.id].filter((k) =>
        dirtySet.has(k)
      ).length;
    }
    return counts;
  }, [dirtyKeys]);

  // Warn before accidentally closing tab with unsaved changes
  useEffect(() => {
    if (!isChanged) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isChanged]);

  // Auto-clear field highlight after jumping from search
  useEffect(() => {
    if (!highlightedKey) return;
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`setting-${highlightedKey}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    const clearTimer = setTimeout(() => setHighlightedKey(null), 2600);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedKey, activeCategory]);

  // Quick search matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SETTINGS_SEARCH_INDEX.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.whereUsed.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery]);

  // Derived social & footer status
  const socialLinksList = useMemo(
    () => parseSocialList(settings.social_links),
    [settings.social_links]
  );

  const validSocialCount = useMemo(
    () => socialLinksList.filter((l) => isConfiguredUrl(l.url)).length,
    [socialLinksList]
  );

  const hasAppStore = isConfiguredUrl(settings.link_app_store);
  const hasGooglePlay = isConfiguredUrl(settings.link_google_play);

  // Derived email quota breakdown
  const dailyLimitNum = Math.max(
    0,
    Number.parseInt(settings.newsletter_daily_limit || "100", 10) || 0
  );
  const reserveNum = Math.max(
    0,
    Number.parseInt(settings.newsletter_transactional_reserve || "20", 10) || 0
  );
  const newsletterBudgetNum = Math.max(0, dailyLimitNum - reserveNum);
  const isSenderPlaceholder =
    !settings.email_sender_address?.trim() ||
    settings.email_sender_address.trim() === "unconfigured-sender@example.com";

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocialLinks = (nextList: SocialLink[]) => {
    handleChange("social_links", JSON.stringify(nextList));
  };

  const addSocialLink = () => {
    updateSocialLinks([...socialLinksList, { platform: "Facebook", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    updateSocialLinks(socialLinksList.filter((_, i) => i !== index));
  };

  const editSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    updateSocialLinks(
      socialLinksList.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const executeSave = async () => {
    setShowMaintenanceConfirm(false);
    setIsSaving(true);

    try {
      // Clean empty blank social rows before persisting
      const cleanedSocials = socialLinksList
        .map((s) => ({ platform: s.platform.trim(), url: s.url.trim() }))
        .filter((s) => s.platform || s.url);

      const preparedSettings: SystemSettings = {
        ...settings,
        social_links: JSON.stringify(cleanedSocials),
        link_app_store: (settings.link_app_store || "").trim(),
        link_google_play: (settings.link_google_play || "").trim(),
      };

      const changedPayload: Record<string, string> = {};
      for (const key of ALL_SETTING_KEYS) {
        if (preparedSettings[key] !== baseline[key]) {
          changedPayload[key] = preparedSettings[key];
        }
      }

      if (Object.keys(changedPayload).length === 0) {
        setSettings(preparedSettings);
        toast("No changes to save.");
        return;
      }

      const result = await updateSystemSettingsBatch(changedPayload);
      if (!result.success) {
        toast.error(result.message || "Failed to save settings.");
        return;
      }

      setSettings(preparedSettings);
      setBaseline(preparedSettings);
      toast.success(result.message || "Settings saved successfully!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    const turningOnMaintenance =
      baseline.enable_maintenance_mode !== "true" &&
      settings.enable_maintenance_mode === "true";

    if (turningOnMaintenance) {
      setShowMaintenanceConfirm(true);
      return;
    }

    void executeSave();
  };

  const handleDiscardAll = () => {
    setSettings(baseline);
    toast("Unsaved changes discarded.");
  };

  const handleResetSection = () => {
    const keysToReset = CATEGORY_KEYS[activeCategory] || [];
    const nextSettings = { ...settings };
    keysToReset.forEach((key) => {
      nextSettings[key] = FACTORY_DEFAULTS[key] ?? "";
    });
    setSettings(nextSettings);
    setShowResetConfirm(false);
    toast.success(
      `Restored "${activeCategoryMeta?.label}" defaults. Click Save Changes to apply.`
    );
  };

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Confirm Reset Active Section */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetSection}
        title={`Reset "${activeCategoryMeta?.label}" to defaults?`}
        message="Only fields in this section will be reset to factory defaults. You can still review them before clicking Save Changes."
        confirmLabel="Reset Section"
        variant="danger"
      />

      {/* Safety Confirm when enabling Maintenance Mode */}
      <ConfirmModal
        isOpen={showMaintenanceConfirm}
        onClose={() => setShowMaintenanceConfirm(false)}
        onConfirm={executeSave}
        title="Enable Maintenance Mode?"
        message="This will immediately take the public website offline and show visitors a maintenance page. You will still have full access to /admin so you can turn it off anytime."
        confirmLabel="Yes, Enable Maintenance Mode"
        variant="danger"
        isBusy={isSaving}
      />

      {/* Quick Search Bar across all settings */}
      <div className="relative max-w-xl">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find any setting (e.g. phone, youtube, footer, app store, maintenance, quota)..."
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {searchQuery.trim() && (
          <div className="absolute z-30 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                No matching settings found for &quot;{searchQuery}&quot;.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {searchResults.map((item) => {
                  const cat = CATEGORIES.find((c) => c.id === item.categoryId);
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory(item.categoryId);
                          setHighlightedKey(item.key);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50/70 dark:hover:bg-slate-700/60 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Shown on: {item.whereUsed}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                          {cat?.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Navigation — 5 Clear Sections */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/80">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const dirtyCount = dirtyCountByCategory[cat.id];
              const Icon = cat.icon;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer",
                    active
                      ? "bg-blue-50/90 dark:bg-blue-900/25 border-l-4 border-l-blue-600"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/40 border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0 mt-0.5",
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold truncate",
                            active
                              ? "text-blue-800 dark:text-blue-200"
                              : "text-slate-800 dark:text-slate-200"
                          )}
                        >
                          {cat.label}
                        </span>
                        {dirtyCount > 0 && (
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            title={`${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`}
                          >
                            {dirtyCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  {active && (
                    <ChevronRight
                      size={16}
                      className="text-blue-600 dark:text-blue-400 shrink-0 mt-2"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Panel */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Active Section Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeCategoryMeta?.label}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeCategoryMeta?.description}
              </p>
            </div>
            {isChanged ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                {dirtyKeys.length} unsaved change
                {dirtyKeys.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                All changes saved
              </span>
            )}
          </div>

          {/* SECTION 1: COMPANY & CONTACT */}
          {activeCategory === "company_contact" && (
            <div className="space-y-5">
              <SettingsCard
                title="Brand Identity"
                description="Core company text displayed across the public site."
                whereUsed="Footer & About Us"
              >
                <Field
                  id="setting-company_slogan"
                  label="Company Slogan"
                  value={settings.company_slogan || ""}
                  onChange={(v) => handleChange("company_slogan", v)}
                  placeholder="Malaysia's Tier 1 Enterprise HR Solution"
                  hint="Short tagline shown under the Kaizen logo in the public Footer."
                  highlighted={highlightedKey === "company_slogan"}
                />
                <Field
                  id="setting-company_founding_year"
                  label="Founding Year"
                  type="number"
                  value={settings.company_founding_year || ""}
                  onChange={(v) => handleChange("company_founding_year", v)}
                  placeholder="1997"
                  hint="Used to calculate company years of experience on public pages."
                  highlighted={highlightedKey === "company_founding_year"}
                />
              </SettingsCard>

              <SettingsCard
                title="Public Contact Details"
                description="Official contact channels visible to prospective customers."
                whereUsed="Contact Us Page"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    id="setting-contact_email"
                    label="Public Email"
                    type="email"
                    value={settings.contact_email || ""}
                    onChange={(v) => handleChange("contact_email", v)}
                    placeholder="inquiry@kaizenhrms.com"
                    highlighted={highlightedKey === "contact_email"}
                  />
                  <Field
                    id="setting-contact_phone"
                    label="Phone Number"
                    value={settings.contact_phone || ""}
                    onChange={(v) => handleChange("contact_phone", v)}
                    placeholder="+603-62010242"
                    highlighted={highlightedKey === "contact_phone"}
                  />
                </div>
                <Field
                  id="setting-contact_address"
                  label="Office Address"
                  textarea
                  rows={3}
                  value={settings.contact_address || ""}
                  onChange={(v) => handleChange("contact_address", v)}
                  hint="Line breaks are preserved when displayed on the Contact Us page."
                  highlighted={highlightedKey === "contact_address"}
                />
              </SettingsCard>

              <SettingsCard
                title="Office Location Map"
                description="Embedded interactive Google Map shown next to your office address."
                whereUsed="Contact Us Page"
              >
                <Field
                  id="setting-integration_google_maps_embed"
                  label="Google Maps Embed URL"
                  textarea
                  rows={3}
                  mono
                  value={settings.integration_google_maps_embed || ""}
                  onChange={(v) =>
                    handleChange("integration_google_maps_embed", v)
                  }
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  hint="In Google Maps, open your office → Share → Embed a map → copy only the URL inside src=&quot;...&quot;."
                  highlighted={
                    highlightedKey === "integration_google_maps_embed"
                  }
                />
              </SettingsCard>
            </div>
          )}

          {/* SECTION 2: HOMEPAGE & CONTENT */}
          {activeCategory === "homepage_content" && (
            <div className="space-y-5">
              <SettingsCard
                title="Homepage Hero Video"
                description="Featured product walkthrough video displayed at the top of the homepage."
                whereUsed="Homepage Hero"
              >
                <Field
                  id="setting-home_hero_video_id"
                  label="YouTube Embed URL"
                  type="url"
                  value={settings.home_hero_video_id || ""}
                  onChange={(v) => handleChange("home_hero_video_id", v)}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  hint="Use the YouTube embed format (https://www.youtube.com/embed/...), not the standard watch?v= link."
                  clearable
                  highlighted={highlightedKey === "home_hero_video_id"}
                />
              </SettingsCard>

              <SettingsCard
                title="Homepage Marketing Visuals"
                description="Images shown in the Free Trial and Awards sections on the homepage."
                whereUsed="Homepage"
              >
                <div
                  id="setting-marketing_trial_image"
                  className={cn(
                    "rounded-lg transition-all",
                    highlightedKey === "marketing_trial_image" &&
                      "ring-2 ring-blue-500 p-3 -m-3 bg-blue-50/50 dark:bg-blue-950/30"
                  )}
                >
                  <SettingsImageUploader
                    label="Free Trial Section Image"
                    value={settings.marketing_trial_image || ""}
                    onChange={(url) =>
                      handleChange("marketing_trial_image", url)
                    }
                    hint="Displayed inside the Free Trial call-to-action banner."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-700/70">
                  <div
                    id="setting-marketing_award_image_1"
                    className={cn(
                      "rounded-lg transition-all",
                      highlightedKey === "marketing_award_image_1" &&
                        "ring-2 ring-blue-500 p-3 -m-3 bg-blue-50/50 dark:bg-blue-950/30"
                    )}
                  >
                    <SettingsImageUploader
                      label="Award Image 1"
                      value={settings.marketing_award_image_1 || ""}
                      onChange={(url) =>
                        handleChange("marketing_award_image_1", url)
                      }
                      hint="Left showcase graphic in the Awards section."
                    />
                  </div>
                  <div
                    id="setting-marketing_award_image_2"
                    className={cn(
                      "rounded-lg transition-all",
                      highlightedKey === "marketing_award_image_2" &&
                        "ring-2 ring-blue-500 p-3 -m-3 bg-blue-50/50 dark:bg-blue-950/30"
                    )}
                  >
                    <SettingsImageUploader
                      label="Award Image 2"
                      value={settings.marketing_award_image_2 || ""}
                      onChange={(url) =>
                        handleChange("marketing_award_image_2", url)
                      }
                      hint="Right showcase graphic in the Awards section."
                    />
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                title="Blog Defaults"
                description="Fallback author attribution for published blog posts."
                whereUsed="Blog & Articles"
              >
                <Field
                  id="setting-blog_default_author_name"
                  label="Default Blog Author Name"
                  value={settings.blog_default_author_name || ""}
                  onChange={(v) => handleChange("blog_default_author_name", v)}
                  placeholder="KaizenHR Team"
                  hint="Shown as the author whenever a post does not have a specific author profile name."
                  highlighted={highlightedKey === "blog_default_author_name"}
                />
              </SettingsCard>
            </div>
          )}

          {/* SECTION 3: FOOTER, SOCIAL & APPS */}
          {activeCategory === "footer_social" && (
            <div className="space-y-5">
              {/* Live Footer Visibility Preview Strip */}
              <div className="rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/60 dark:bg-teal-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-900 dark:text-teal-200">
                    Footer Bottom Section Visibility
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border",
                        validSocialCount > 0
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      )}
                    >
                      Follow us:{" "}
                      {validSocialCount > 0
                        ? `Shown (${validSocialCount} link${validSocialCount === 1 ? "" : "s"})`
                        : "Hidden"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border",
                        hasAppStore || hasGooglePlay
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      )}
                    >
                      Mobile App:{" "}
                      {hasAppStore && hasGooglePlay
                        ? "Shown (App Store + Google Play)"
                        : hasAppStore
                          ? "Shown (App Store only)"
                          : hasGooglePlay
                            ? "Shown (Google Play only)"
                            : "Hidden"}
                    </span>
                  </div>
                </div>

                <Link
                  href="/admin/navigation"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:underline shrink-0"
                >
                  <PanelTop size={14} />
                  <span>Manage Footer Menu Columns</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              <SettingsCard
                title="Social Media Links"
                description="Add your official profiles. Remove all links to hide the entire 'Follow us' section from the Footer."
                whereUsed='Footer "Follow us"'
              >
                <div
                  id="setting-social_links"
                  className={cn(
                    "space-y-3 rounded-lg transition-all",
                    highlightedKey === "social_links" &&
                      "ring-2 ring-blue-500 p-3 -m-3 bg-blue-50/50 dark:bg-blue-950/30"
                  )}
                >
                  {socialLinksList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center space-y-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        No social media links configured
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        The &quot;Follow us&quot; heading and icons will be
                        hidden from the public Footer.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialLinksList.map((link, index) => {
                        const Icon = getSocialIcon(link.platform || "Website");
                        const usesPreset = isPresetPlatform(link.platform);
                        const missingUrl = !isConfiguredUrl(link.url);

                        return (
                          <div
                            key={index}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                              {/* Live Icon Preview + Platform Selector */}
                              <div className="flex items-center gap-2 sm:w-52 shrink-0">
                                <div
                                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
                                  title={`Icon preview: ${link.platform || "Website"}`}
                                >
                                  <Icon size={17} />
                                </div>

                                <select
                                  value={usesPreset ? link.platform : "__custom__"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    editSocialLink(
                                      index,
                                      "platform",
                                      val === "__custom__" ? "" : val
                                    );
                                  }}
                                  className="w-full px-2.5 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                                  aria-label="Social platform"
                                >
                                  {SOCIAL_PLATFORM_PRESETS.map((preset) => (
                                    <option key={preset} value={preset}>
                                      {preset}
                                    </option>
                                  ))}
                                  <option value="__custom__">
                                    Other (Custom)...
                                  </option>
                                </select>
                              </div>

                              {/* Custom Platform Input when "Other" selected */}
                              {!usesPreset && (
                                <input
                                  type="text"
                                  value={link.platform}
                                  onChange={(e) =>
                                    editSocialLink(
                                      index,
                                      "platform",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Platform name"
                                  className="sm:w-36 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                                />
                              )}

                              {/* URL Input */}
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) =>
                                  editSocialLink(index, "url", e.target.value)
                                }
                                placeholder="https://facebook.com/yourpage"
                                className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                              />

                              <button
                                type="button"
                                onClick={() => removeSocialLink(index)}
                                title="Remove social link"
                                aria-label="Remove social link"
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-end sm:self-center cursor-pointer"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>

                            {missingUrl && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 pl-1">
                                Enter a valid URL for this icon to appear in the
                                Footer.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add Social Link</span>
                  </button>
                </div>
              </SettingsCard>

              <SettingsCard
                title="Mobile App Download Links"
                description="Leave either link blank to hide that store button. Leave both blank to completely hide 'Download the Mobile App' from the Footer."
                whereUsed='Footer "Download the Mobile App"'
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    id="setting-link_app_store"
                    label="App Store (iOS) URL"
                    type="url"
                    value={settings.link_app_store || ""}
                    onChange={(v) => handleChange("link_app_store", v)}
                    placeholder="https://apps.apple.com/..."
                    hint="Leave empty to hide the Apple App Store button."
                    clearable
                    highlighted={highlightedKey === "link_app_store"}
                  />
                  <Field
                    id="setting-link_google_play"
                    label="Google Play (Android) URL"
                    type="url"
                    value={settings.link_google_play || ""}
                    onChange={(v) => handleChange("link_google_play", v)}
                    placeholder="https://play.google.com/store/apps/..."
                    hint="Leave empty to hide the Google Play button."
                    clearable
                    highlighted={highlightedKey === "link_google_play"}
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                title="Footer Copyright Notice"
                description="Legal copyright line displayed at the very bottom of every public page."
                whereUsed="Footer Bottom Bar"
              >
                <Field
                  id="setting-footer_copyright_text"
                  label="Copyright Text"
                  value={settings.footer_copyright_text || ""}
                  onChange={(v) => handleChange("footer_copyright_text", v)}
                  placeholder="© KaiZenHR Sdn Bhd 2026. All Rights Reserved."
                  highlighted={highlightedKey === "footer_copyright_text"}
                />
              </SettingsCard>
            </div>
          )}

          {/* SECTION 4: EMAIL & NEWSLETTER */}
          {activeCategory === "email_newsletter" && (
            <div className="space-y-5">
              <SettingsCard
                title="Email Sender & Admin Alerts"
                description="Configures outgoing Resend sender identity and where Contact Us alerts are delivered."
                whereUsed="Contact Form & All Outgoing Emails"
              >
                {isSenderPlaceholder && (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle
                      size={16}
                      className="shrink-0 mt-0.5 text-amber-600"
                    />
                    <p>
                      <strong>Sender address not configured:</strong> Set a
                      verified Resend domain email below (or configure the{" "}
                      <code className="font-mono">RESEND_FROM_EMAIL</code>{" "}
                      environment variable in Vercel), otherwise outgoing emails
                      will fail.
                    </p>
                  </div>
                )}

                <Field
                  id="setting-admin_notification_email"
                  label="Admin Notification Email"
                  type="email"
                  value={settings.admin_notification_email || ""}
                  onChange={(v) => handleChange("admin_notification_email", v)}
                  placeholder="admin@kaizenhrms.com"
                  hint="Receives immediate email notifications whenever a visitor submits the Contact Us form."
                  highlighted={highlightedKey === "admin_notification_email"}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    id="setting-email_sender_name"
                    label="Email Sender Name"
                    value={settings.email_sender_name || ""}
                    onChange={(v) => handleChange("email_sender_name", v)}
                    placeholder="KaizenHR"
                    hint='Display name shown in recipient inboxes (e.g. "KaizenHR").'
                    highlighted={highlightedKey === "email_sender_name"}
                  />
                  <Field
                    id="setting-email_sender_address"
                    label="Sender Email Address"
                    type="email"
                    value={settings.email_sender_address || ""}
                    onChange={(v) => handleChange("email_sender_address", v)}
                    placeholder="inquiry@kaizenhrms.com"
                    hint="Must be on your verified Resend domain. Env RESEND_FROM_EMAIL overrides this when set."
                    highlighted={highlightedKey === "email_sender_address"}
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                title="Newsletter Delivery Schedule"
                description="Controls when scheduled blog post newsletters are dispatched to subscribers."
                whereUsed="Automated Newsletter Cron"
                headerAction={
                  <Link
                    href="/admin/settings/email-logic"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Info size={13} />
                    <span>Email Logic Explained</span>
                  </Link>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field
                    id="setting-newsletter_frequency"
                    label="Delivery Frequency"
                    select
                    value={settings.newsletter_frequency || "weekly"}
                    onChange={(v) => handleChange("newsletter_frequency", v)}
                    options={[
                      { value: "weekly", label: "Once a week (Recommended)" },
                      { value: "daily", label: "Once a day" },
                    ]}
                    highlighted={highlightedKey === "newsletter_frequency"}
                  />

                  {(settings.newsletter_frequency || "weekly") === "weekly" && (
                    <Field
                      id="setting-newsletter_send_day"
                      label="Weekly Send Day"
                      select
                      value={settings.newsletter_send_day || "1"}
                      onChange={(v) => handleChange("newsletter_send_day", v)}
                      options={[
                        { value: "1", label: "Monday" },
                        { value: "2", label: "Tuesday" },
                        { value: "3", label: "Wednesday" },
                        { value: "4", label: "Thursday" },
                        { value: "5", label: "Friday" },
                        { value: "6", label: "Saturday" },
                        { value: "0", label: "Sunday" },
                      ]}
                      highlighted={highlightedKey === "newsletter_send_day"}
                    />
                  )}

                  <Field
                    id="setting-newsletter_send_time"
                    label="Send Time (MYT, GMT+8)"
                    value={settings.newsletter_send_time || "10:00"}
                    onChange={(v) => handleChange("newsletter_send_time", v)}
                    placeholder="10:00"
                    hint="24-hour format (e.g. 10:00 or 22:00)."
                    highlighted={highlightedKey === "newsletter_send_time"}
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                title="Daily Quota & Priority Protection"
                description="Prevents bulk newsletters from consuming your Resend daily limit so Contact Us and verification emails never fail."
                whereUsed="Resend Quota Guard"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    id="setting-newsletter_daily_limit"
                    label="Daily Total Email Limit"
                    type="number"
                    value={settings.newsletter_daily_limit || "100"}
                    onChange={(v) => handleChange("newsletter_daily_limit", v)}
                    hint="Match your actual Resend plan cap (Free Tier = 100/day)."
                    highlighted={highlightedKey === "newsletter_daily_limit"}
                  />
                  <Field
                    id="setting-newsletter_transactional_reserve"
                    label="Transactional Reserve"
                    type="number"
                    value={settings.newsletter_transactional_reserve || "20"}
                    onChange={(v) =>
                      handleChange("newsletter_transactional_reserve", v)
                    }
                    hint="Emails held back exclusively for Contact Us, quick replies, and verifications."
                    highlighted={
                      highlightedKey === "newsletter_transactional_reserve"
                    }
                  />
                </div>

                {/* Live Quota Breakdown */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Daily Budget Split ({dailyLimitNum} total emails/day)
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      <strong className="text-blue-600 dark:text-blue-400">
                        {newsletterBudgetNum}
                      </strong>{" "}
                      newsletter ·{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {Math.min(reserveNum, dailyLimitNum)}
                      </strong>{" "}
                      priority reserve
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    {dailyLimitNum > 0 && (
                      <>
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{
                            width: `${(newsletterBudgetNum / dailyLimitNum) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{
                            width: `${(Math.min(reserveNum, dailyLimitNum) / dailyLimitNum) * 100}%`,
                          }}
                        />
                      </>
                    )}
                  </div>

                  {reserveNum >= dailyLimitNum && dailyLimitNum > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Warning: Transactional reserve is greater than or equal to
                      your daily limit — queued newsletters will stay paused
                      until you lower the reserve or raise the limit.
                    </p>
                  )}
                </div>
              </SettingsCard>
            </div>
          )}

          {/* SECTION 5: SYSTEM & SAFETY */}
          {activeCategory === "system_safety" && (
            <div className="space-y-5">
              <SettingsCard
                title="Site Availability (High Impact)"
                description="Controls whether public visitors can access the website."
                whereUsed="Entire Public Site"
                danger={settings.enable_maintenance_mode === "true"}
              >
                <Toggle
                  id="setting-enable_maintenance_mode"
                  label="Maintenance Mode"
                  description="Shows a 'We'll be right back' maintenance screen to all public visitors. The /admin dashboard stays accessible so you can disable it anytime."
                  checked={settings.enable_maintenance_mode === "true"}
                  onChange={(checked) =>
                    handleChange("enable_maintenance_mode", String(checked))
                  }
                  danger
                  highlighted={highlightedKey === "enable_maintenance_mode"}
                />
              </SettingsCard>

              <SettingsCard
                title="Public Subscriptions"
                description="Controls whether new visitors can subscribe to your mailing list."
                whereUsed="Newsletter Signup"
              >
                <Toggle
                  id="setting-enable_public_registration"
                  label="Allow Public Newsletter Signups"
                  description="When enabled, visitors can submit their email to subscribe to Kaizen's newsletter."
                  checked={settings.enable_public_registration === "true"}
                  onChange={(checked) =>
                    handleChange("enable_public_registration", String(checked))
                  }
                  highlighted={highlightedKey === "enable_public_registration"}
                />
              </SettingsCard>

              <SettingsCard
                title="Audit Log Maintenance"
                description="Automatically prunes old admin activity logs to keep your database lightweight."
                whereUsed="Daily Cleanup Cron"
              >
                <Field
                  id="setting-audit_log_retention_days"
                  label="Audit Log Retention Period"
                  select
                  value={settings.audit_log_retention_days || "30"}
                  onChange={(v) => handleChange("audit_log_retention_days", v)}
                  options={[
                    { value: "30", label: "30 Days (Recommended)" },
                    { value: "90", label: "90 Days" },
                    { value: "365", label: "1 Year" },
                    { value: "0.0416", label: "1 Hour (Testing Only)" },
                  ]}
                  hint="The daily maintenance cron automatically deletes audit log entries older than this window."
                  highlighted={highlightedKey === "audit_log_retention_days"}
                />
              </SettingsCard>
            </div>
          )}

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowResetConfirm(true)}
              disabled={isSaving}
              className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Reset This Section</span>
            </Button>

            <div className="flex items-center gap-2.5">
              {isChanged && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDiscardAll}
                  disabled={isSaving}
                  className="dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Undo2 size={15} />
                  <span>Discard</span>
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                onClick={handleSaveClick}
                disabled={!isChanged || isSaving}
                loading={isSaving}
                className="px-5 font-semibold shadow-xs cursor-pointer"
              >
                {!isSaving && <Save size={16} />}
                <span>
                  {isSaving
                    ? "Saving..."
                    : isChanged
                      ? `Save Changes (${dirtyKeys.length})`
                      : "Save Changes"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
