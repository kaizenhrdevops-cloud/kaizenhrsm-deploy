// src/app/admin/settings/SettingsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { updateSystemSetting } from "./actions";
import {
  Loader2,
  Save,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import SettingsImageUploader from "@/components/admin/SettingsImageUploader";
import { Field, Toggle } from "./SettingsField";
import {
  CATEGORIES,
  CATEGORY_KEYS,
  FACTORY_DEFAULTS,
  type SocialLink,
  type SystemSettings,
} from "./settings-defaults";

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: SystemSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("contact");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [currentInitialSettings, setInitialSettings] =
    useState(initialSettings);
  const [socialLinksList, setSocialLinksList] = useState<SocialLink[]>([]);

  useEffect(() => {
    try {
      const parsed = settings.social_links
        ? JSON.parse(settings.social_links)
        : [];
      if (Array.isArray(parsed)) {
        setSocialLinksList(parsed);
      }
    } catch (e) {
      setSocialLinksList([]);
    }
  }, [settings.social_links]);

  const handleSave = async () => {
    setIsSaving(true);
    let hasError = false;
    const savedSettings = { ...settings };

    for (const key of Object.keys(settings)) {
      if (settings[key] !== currentInitialSettings[key]) {
        const result = await updateSystemSetting(key, settings[key]);
        if (!result.success) {
          hasError = true;
          toast.error(result.message || `Error saving ${key}`);
        }
      }
    }

    if (!hasError) {
      toast.success("Settings saved successfully!");
      setInitialSettings(savedSettings);
    }

    setIsSaving(false);
  };

  const handleReset = () => {
    const keysToReset = CATEGORY_KEYS[activeCategory] || [];
    const newSettings = { ...settings };

    keysToReset.forEach((key) => {
      newSettings[key] = FACTORY_DEFAULTS[key] || "";
    });

    if (activeCategory === "social") {
      try {
        const defaultSocials = JSON.parse(FACTORY_DEFAULTS.social_links);
        setSocialLinksList(defaultSocials);
      } catch (e) {
        setSocialLinksList([]);
      }
    }

    setSettings(newSettings);
    setShowResetConfirm(false);
    toast.success("Restored factory defaults.");
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addSocialLink = () => {
    const newList = [...socialLinksList, { platform: "", url: "" }];
    setSocialLinksList(newList);
    handleChange("social_links", JSON.stringify(newList));
  };

  const removeSocialLink = (index: number) => {
    const newList = [...socialLinksList];
    newList.splice(index, 1);
    setSocialLinksList(newList);
    handleChange("social_links", JSON.stringify(newList));
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    const newList = [...socialLinksList];
    newList[index][field] = value;
    setSocialLinksList(newList);
    handleChange("social_links", JSON.stringify(newList));
  };

  const isChanged =
    JSON.stringify(settings) !== JSON.stringify(currentInitialSettings);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset to defaults?"
        message="This section's settings will be restored to factory defaults. Unsaved edits will be lost."
        confirmLabel="Reset"
        variant="danger"
      />

      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0",
                activeCategory === cat.id
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50",
              )}
            >
              <div className="flex items-center gap-3">
                <cat.icon size={18} />
                <span>{cat.label}</span>
              </div>
              {activeCategory === cat.id && <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label} Settings
            </h2>
            {isChanged && (
              <span className="text-xs text-amber-600 font-medium animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            {activeCategory === "general" && (
              <>
                <Field
                  label="Daily Email Send Limit"
                  type="number"
                  value={settings.newsletter_daily_limit || "100"}
                  onChange={(v) => handleChange("newsletter_daily_limit", v)}
                  headerAction={
                    <Link
                      href="/admin/settings/email-logic"
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Info size={12} /> Logic Explained
                    </Link>
                  }
                />
                <Field
                  label="Audit Log Retention"
                  select
                  value={settings.audit_log_retention_days || "30"}
                  onChange={(v) =>
                    handleChange("audit_log_retention_days", v)
                  }
                  options={[
                    { value: "0.0416", label: "1 Hour (Testing)" },
                    { value: "30", label: "30 Days" },
                    { value: "90", label: "90 Days" },
                    { value: "365", label: "1 Year" },
                  ]}
                />
              </>
            )}

            {activeCategory === "features" && (
              <div className="space-y-4">
                <Toggle
                  label="Maintenance Mode"
                  description="Disable public access to the site."
                  checked={settings.enable_maintenance_mode === "true"}
                  onChange={(checked) =>
                    handleChange(
                      "enable_maintenance_mode",
                      String(checked),
                    )
                  }
                />
                <Toggle
                  label="Public Registration"
                  description="Allow new users to sign up for newsletter."
                  checked={settings.enable_public_registration === "true"}
                  onChange={(checked) =>
                    handleChange(
                      "enable_public_registration",
                      String(checked),
                    )
                  }
                />
              </div>
            )}

            {activeCategory === "email_config" && (
              <>
                <Field
                  label="Admin Notification Email"
                  type="email"
                  value={settings.admin_notification_email || ""}
                  onChange={(v) =>
                    handleChange("admin_notification_email", v)
                  }
                />
                <Field
                  label="Email Sender Name"
                  value={settings.email_sender_name || ""}
                  onChange={(v) => handleChange("email_sender_name", v)}
                />
                <Field
                  label="Sender Email Address"
                  value={settings.email_sender_address || ""}
                  onChange={(v) =>
                    handleChange("email_sender_address", v)
                  }
                  placeholder="onboarding@resend.dev"
                  hint="Must be 'onboarding@resend.dev' (Free) or a verified domain email (Paid). Falls back to .env if empty."
                />
              </>
            )}

            {activeCategory === "blog_config" && (
              <Field
                label="Default Blog Author"
                value={settings.blog_default_author_name || ""}
                onChange={(v) =>
                  handleChange("blog_default_author_name", v)
                }
              />
            )}

            {activeCategory === "contact" && (
              <>
                <Field
                  label="Company Slogan"
                  value={settings.company_slogan || ""}
                  onChange={(v) => handleChange("company_slogan", v)}
                />
                <Field
                  label="Founding Year"
                  type="number"
                  value={settings.company_founding_year || ""}
                  onChange={(v) =>
                    handleChange("company_founding_year", v)
                  }
                />
                <Field
                  label="Office Address"
                  textarea
                  rows={3}
                  value={settings.contact_address || ""}
                  onChange={(v) => handleChange("contact_address", v)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Public Email"
                    type="email"
                    value={settings.contact_email || ""}
                    onChange={(v) => handleChange("contact_email", v)}
                  />
                  <Field
                    label="Phone Number"
                    value={settings.contact_phone || ""}
                    onChange={(v) => handleChange("contact_phone", v)}
                  />
                </div>
              </>
            )}

            {activeCategory === "social" && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Social Media Links
                    </label>
                  </div>
                  {socialLinksList.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No social links added yet.
                    </p>
                  )}
                  <div className="space-y-3">
                    {socialLinksList.map((link, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="w-1/3">
                          <input
                            type="text"
                            value={link.platform}
                            onChange={(e) =>
                              updateSocialLink(
                                index,
                                "platform",
                                e.target.value,
                              )
                            }
                            placeholder="Platform"
                            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) =>
                              updateSocialLink(index, "url", e.target.value)
                            }
                            placeholder="URL"
                            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={() => removeSocialLink(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addSocialLink}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600"
                  >
                    <Plus size={16} /> Add Social Link
                  </button>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="App Store (iOS)"
                      value={settings.link_app_store || ""}
                      onChange={(v) => handleChange("link_app_store", v)}
                    />
                    <Field
                      label="Google Play (Android)"
                      value={settings.link_google_play || ""}
                      onChange={(v) =>
                        handleChange("link_google_play", v)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {activeCategory === "hero" && (
              <Field
                label="Homepage Video URL (Embed)"
                value={settings.home_hero_video_id || ""}
                onChange={(v) => handleChange("home_hero_video_id", v)}
              />
            )}

            {activeCategory === "marketing" && (
              <>
                <div className="space-y-2">
                  <SettingsImageUploader
                    label="Trial Image URL"
                    value={settings.marketing_trial_image || ""}
                    onChange={(url) =>
                      handleChange("marketing_trial_image", url)
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SettingsImageUploader
                      label="Award Image 1 URL"
                      value={settings.marketing_award_image_1 || ""}
                      onChange={(url) =>
                        handleChange("marketing_award_image_1", url)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <SettingsImageUploader
                      label="Award Image 2 URL"
                      value={settings.marketing_award_image_2 || ""}
                      onChange={(url) =>
                        handleChange("marketing_award_image_2", url)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {activeCategory === "integrations" && (
              <Field
                label="Google Maps Embed URL"
                textarea
                rows={4}
                mono
                value={settings.integration_google_maps_embed || ""}
                onChange={(v) =>
                  handleChange("integration_google_maps_embed", v)
                }
              />
            )}

            {activeCategory === "footer" && (
              <Field
                label="Copyright Text"
                value={settings.footer_copyright_text || ""}
                onChange={(v) =>
                  handleChange("footer_copyright_text", v)
                }
              />
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <Button onClick={() => setShowResetConfirm(true)} disabled={isSaving}>
              <RotateCcw size={16} />
              <span>Reset to Default</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isChanged || isSaving}
              loading={isSaving}
              className="px-6 font-semibold shadow-sm"
            >
              {!isSaving && <Save size={18} />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
