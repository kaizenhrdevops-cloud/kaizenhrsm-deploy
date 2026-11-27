// src/components/layout/Footer.tsx

"use client";

import React from "react";
import Link from "next/link";
import { resourcesSubmenus, companySubmenus } from "@/data/submenus";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { getSocialIcon } from "./social-icons";
import type { PublicSettings } from "@/lib/public-settings";
import { useSettings } from "./SettingsProvider";
import { useNavItems } from "./NavProvider";
import { useHrmsSubmenus } from "./navbar/useHrmsSubmenus";
import NewsletterForm from "./NewsletterForm";
import { typeMeta, typeSmall } from "../ui/typography";

const FALLBACK_SETTINGS: PublicSettings = {
  company_slogan: "Malaysia's Tier 1 Enterprise HR Solution",
  contact_email: "inquiry@kaizenhrms.com",
  contact_phone: "+603-62010242",
  social_links: "[]",
  link_app_store: "",
  link_google_play: "",
  footer_copyright_text: "© KaiZenHR Sdn Bhd 2025. All Rights Reserved.",
};

type ValidSocialLink = {
  platform: string;
  url: string;
};

/**
 * Treats empty strings, whitespace, "#", and unsafe schemes as unconfigured.
 * Auto-prefixes bare domains (e.g. "facebook.com/kaizen") with https://.
 */
function normalizeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "#") return null;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

function parseSocialLinks(raw: string | undefined): ValidSocialLink[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.reduce<ValidSocialLink[]>((acc, item) => {
      if (!item || typeof item !== "object") return acc;
      const url = normalizeExternalUrl((item as { url?: unknown }).url);
      if (!url) return acc;

      const rawPlatform = (item as { platform?: unknown }).platform;
      const platform =
        typeof rawPlatform === "string" && rawPlatform.trim()
          ? rawPlatform.trim()
          : "Website";

      acc.push({ platform, url });
      return acc;
    }, []);
  } catch {
    return [];
  }
}

// Client component reading settings & nav visibility from (public)/layout's
// providers — no own fetches, so no client-side waterfall.
const Footer = () => {
  const settings: PublicSettings = {
    ...FALLBACK_SETTINGS,
    ...useSettings(),
  };

  // Validated social & mobile app links — sections disappear completely when empty
  const socialLinks = parseSocialLinks(settings.social_links);
  const appStoreUrl = normalizeExternalUrl(settings.link_app_store);
  const googlePlayUrl = normalizeExternalUrl(settings.link_google_play);

  const showSocials = socialLinks.length > 0;
  const showMobileApps = Boolean(appStoreUrl || googlePlayUrl);
  const hasBothAppButtons = Boolean(appStoreUrl && googlePlayUrl);
  const bottomColumnCount =
    1 + (showSocials ? 1 : 0) + (showMobileApps ? 1 : 0);

  // Active top-level nav items — hides/removes Footer sections when hidden or deleted
  const navItems = useNavItems();
  const hrmsNav = navItems.find((item) => item.footer_section === "hrms");
  const secondarySections = navItems.filter(
    (item) =>
      item.footer_section === "resources" || item.footer_section === "company"
  );

  const showHrms = Boolean(hrmsNav);
  const hasSecondary = secondarySections.length > 0;

  // Static HRMS links + any NEW published CMS pages from /admin/hrms.
  const hrmsSubmenus = useHrmsSubmenus();

  // Split HRMS modules into two balanced columns for robust multi-device layout
  const midpoint = Math.ceil(hrmsSubmenus.length / 2);
  const hrmsCol1 = hrmsSubmenus.slice(0, midpoint);
  const hrmsCol2 = hrmsSubmenus.slice(midpoint);

  // Dynamically adapt 12-column spans when top link sections are hidden or deleted
  const brandColClass =
    !showHrms && !hasSecondary
      ? "md:col-span-12"
      : showHrms && hasSecondary
        ? "md:col-span-3 xl:col-span-3"
        : showHrms
          ? "md:col-span-4 xl:col-span-4"
          : secondarySections.length === 2
            ? "md:col-span-4 xl:col-span-4"
            : "md:col-span-6 xl:col-span-6";

  const hrmsColClass = hasSecondary
    ? "md:col-span-6 xl:col-span-6"
    : "md:col-span-8 xl:col-span-8";

  const secondaryContainerClass = showHrms
    ? secondarySections.length === 2
      ? "md:col-span-3 xl:col-span-3 grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-8"
      : "md:col-span-3 xl:col-span-3 grid grid-cols-1 gap-y-8"
    : secondarySections.length === 2
      ? "md:col-span-8 xl:col-span-8 grid grid-cols-2 gap-x-8 gap-y-8"
      : "md:col-span-6 xl:col-span-6 grid grid-cols-1 gap-y-8";

  const bottomGridClass =
    bottomColumnCount === 3
      ? "grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 items-start"
      : bottomColumnCount === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 items-start"
        : "pt-12 flex flex-col items-center";

  return (
    <footer className="bg-[#008080] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
        {/* TOP SECTION: LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 mb-12">
          {/* Column 1: Company Info */}
          <div className={`${brandColClass} space-y-3`}>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Kaizen
            </h2>
            <p className={`${typeSmall} text-teal-100/85 max-w-xs`}>
              {settings.company_slogan}
            </p>
          </div>

          {/* Columns 2 & 3: HRMS Modules (2 sub-columns) */}
          {showHrms && hrmsNav && (
            <div className={hrmsColClass}>
              <h3 className="text-base font-semibold uppercase tracking-wider text-white mb-4">
                {hrmsNav.label}
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-teal-100/80">
                <ul className="space-y-2.5 min-w-0">
                  {hrmsCol1.map((item, index) => (
                    <li key={index} className="truncate">
                      <Link
                        href={item.path}
                        className="hover:text-white transition-colors duration-150"
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2.5 min-w-0">
                  {hrmsCol2.map((item, index) => (
                    <li key={index} className="truncate">
                      <Link
                        href={item.path}
                        className="hover:text-white transition-colors duration-150"
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Columns 4 & 5: Resources & Company (synced with Navbar visibility, labels & order) */}
          {hasSecondary && (
            <div className={secondaryContainerClass}>
              {secondarySections.map((section) => {
                const links =
                  section.footer_section === "resources"
                    ? resourcesSubmenus
                    : companySubmenus;

                return (
                  <div key={section.key}>
                    <h3 className="text-base font-semibold uppercase tracking-wider text-white mb-4">
                      {section.label}
                    </h3>
                    <ul className="space-y-2.5 text-sm text-teal-100/80">
                      {links.map((item, index) => {
                        const isPdf = /\.pdf$/i.test(item.path);
                        return (
                          <li key={index} className="truncate">
                            <Link
                              href={item.path}
                              prefetch={!isPdf}
                              target={isPdf ? "_blank" : undefined}
                              rel={isPdf ? "noopener noreferrer" : undefined}
                              className="hover:text-white transition-colors duration-150"
                            >
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BORDER */}
        <div className="border-t border-white/20"></div>

        {/* BOTTOM SECTION: ACTIONS */}
        <div className={bottomGridClass}>
          {/* Newsletter */}
          <div
            className={
              bottomColumnCount === 1
                ? "w-full max-w-md text-center"
                : bottomColumnCount === 2
                  ? "w-full max-w-md"
                  : "w-full"
            }
          >
            <h3 className="text-base font-semibold mb-4">
              Subscribe to Kaizen&apos;s Newsletter
            </h3>
            <NewsletterForm />
          </div>

          {/* Social Media — hidden completely when no valid links are configured */}
          {showSocials && (
            <div
              className={
                bottomColumnCount === 2
                  ? "flex flex-col items-start md:items-end text-left md:text-right"
                  : "flex flex-col items-start md:items-center text-left md:text-center"
              }
            >
              <h3 className="text-base font-semibold mb-4">Follow us</h3>
              <div
                className={`flex gap-3 flex-wrap ${
                  bottomColumnCount === 2
                    ? "justify-start md:justify-end"
                    : "justify-start md:justify-center"
                }`}
              >
                {socialLinks.map((link, index) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={`${link.platform}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      className="bg-white hover:bg-yellow-400 text-[#32353a] p-3 rounded-full transition-colors"
                      title={link.platform}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile App Downloads — hidden completely when neither store URL is configured */}
          {showMobileApps && (
            <div
              className={
                bottomColumnCount === 2 ? "w-full max-w-md md:ml-auto" : "w-full"
              }
            >
              <h3 className="text-base font-semibold mb-4">
                Download the Mobile App
              </h3>
              <div
                className={
                  hasBothAppButtons
                    ? "grid grid-cols-2 gap-3 sm:gap-4"
                    : "flex flex-wrap gap-3"
                }
              >
                {appStoreUrl && (
                  <a
                    href={appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-black hover:bg-gray-800 px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2.5 transition-colors min-w-0 ${
                      hasBothAppButtons ? "" : "min-w-[180px]"
                    }`}
                  >
                    <FaApple size={24} className="shrink-0 text-white" />
                    <div className="text-left min-w-0">
                      <div
                        className={`${typeMeta} text-gray-300 truncate leading-tight`}
                      >
                        Download on the
                      </div>
                      <div className="font-semibold text-sm text-white whitespace-nowrap truncate leading-tight">
                        App Store
                      </div>
                    </div>
                  </a>
                )}

                {googlePlayUrl && (
                  <a
                    href={googlePlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-black hover:bg-gray-800 px-3.5 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2.5 transition-colors min-w-0 ${
                      hasBothAppButtons ? "" : "min-w-[180px]"
                    }`}
                  >
                    <FaGooglePlay size={20} className="shrink-0 text-white" />
                    <div className="text-left min-w-0">
                      <div
                        className={`${typeMeta} text-gray-300 truncate leading-tight`}
                      >
                        GET IT ON
                      </div>
                      <div className="font-semibold text-sm text-white whitespace-nowrap truncate leading-tight">
                        Google Play
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copyright Section */}
        <div
          className={`mt-12 pt-8 border-t border-white/15 text-center text-teal-100/70 ${typeMeta}`}
        >
          <p>
            {settings.footer_copyright_text ||
              "© KaiZenHR Sdn Bhd 2025. All Rights Reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
