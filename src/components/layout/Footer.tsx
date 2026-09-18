// src/components/layout/Footer.tsx

"use client";

import React from "react";
import Link from "next/link";
import {
  resourcesSubmenus,
  companySubmenus,
} from "@/data/submenus";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { getSocialIcon } from "./social-icons";
import type { PublicSettings } from "@/lib/public-settings";
import { useSettings } from "./SettingsProvider";
import { useHrmsSubmenus } from "./navbar/useHrmsSubmenus";
import NewsletterForm from "./NewsletterForm";

const FALLBACK_SETTINGS: PublicSettings = {
  company_slogan: "Malaysia's Tier 1 Enterprise HR Solution",
  contact_email: "inquiry@kaizenhrms.com",
  contact_phone: "+603-62010242",
  social_links: "[]",
  link_app_store: "#",
  link_google_play: "#",
  footer_copyright_text: "© KaiZenHR Sdn Bhd 2025. All Rights Reserved.",
};

function parseSocialLinks(raw: string | undefined) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Client component reading settings from (public)/layout's provider —
// no own fetch, so no client-side waterfall (see SettingsProvider).
const Footer = () => {
  const settings: PublicSettings = {
    ...FALLBACK_SETTINGS,
    ...useSettings(),
  };

  // Parse social links safely
  const socialLinks = parseSocialLinks(settings.social_links);

  // Static HRMS links + any NEW published CMS pages from /admin/hrms.
  const hrmsSubmenus = useHrmsSubmenus();

  // Split HRMS modules into two balanced columns for robust multi-device layout
  const midpoint = Math.ceil(hrmsSubmenus.length / 2);
  const hrmsCol1 = hrmsSubmenus.slice(0, midpoint);
  const hrmsCol2 = hrmsSubmenus.slice(midpoint);

  return (
    <footer className="bg-[#008080] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
        {/* TOP SECTION: LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 mb-12">
          {/* Column 1: Company Info */}
          <div className="md:col-span-3 xl:col-span-3 space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Kaizen
            </h2>
            <p className="text-sm text-teal-100/85 leading-relaxed max-w-xs">
              {settings.company_slogan}
            </p>
          </div>

          {/* Columns 2 & 3: HRMS Modules (2 sub-columns) */}
          <div className="md:col-span-6 xl:col-span-6">
            <h3 className="text-base font-semibold uppercase tracking-wider text-white mb-4">
              HRMS
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

          {/* Columns 4 & 5: Resources & Company */}
          <div className="md:col-span-3 xl:col-span-3 grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-8">
            {/* Resources */}
            <div>
              <h3 className="text-base font-semibold uppercase tracking-wider text-white mb-4">
                Resources
              </h3>
              <ul className="space-y-2.5 text-sm text-teal-100/80">
                {resourcesSubmenus.map((item, index) => (
                  <li key={index} className="truncate">
                    <Link
                      href={item.path}
                      className="hover:text-white transition-colors duration-150"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-base font-semibold uppercase tracking-wider text-white mb-4">
                Company
              </h3>
              <ul className="space-y-2.5 text-sm text-teal-100/80">
                {companySubmenus.map((item, index) => (
                  <li key={index} className="truncate">
                    <Link
                      href={item.path}
                      className="hover:text-white transition-colors duration-150"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* BORDER */}
        <div className="border-t border-white/20"></div>

        {/* BOTTOM SECTION: ACTIONS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-12 items-start">
          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Subscribe to Kaizen&apos;s Newsletter
            </h3>
            <NewsletterForm />
          </div>

          {/* Social Media - Dynamic List */}
          <div className="flex flex-col justify-end md:justify-start text-center">
            <h3 className="text-lg font-semibold mb-4">Follow us</h3>
            <div className="flex space-x-4 justify-center flex-wrap gap-y-4">
              {socialLinks.map(
                (link: { platform: string; url: string }, index: number) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={index}
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
                }
              )}
            </div>
          </div>

          {/* Mobile App Downloads */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">
              Download the Mobile App
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <a
                href={settings.link_app_store || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-800 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 transition-colors min-w-0"
              >
                <FaApple size={24} className="shrink-0 text-white" />
                <div className="text-left min-w-0">
                  <div className="text-[10px] sm:text-xs text-gray-300 truncate leading-tight">
                    Download on the
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-white whitespace-nowrap truncate leading-tight">
                    App Store
                  </div>
                </div>
              </a>
              <a
                href={settings.link_google_play || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-800 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 transition-colors min-w-0"
              >
                <FaGooglePlay size={20} className="shrink-0 text-white" />
                <div className="text-left min-w-0">
                  <div className="text-[10px] sm:text-xs text-gray-300 truncate leading-tight">
                    GET IT ON
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-white whitespace-nowrap truncate leading-tight">
                    Google Play
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t border-white/15 text-center text-teal-100/70 text-xs sm:text-sm">
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
