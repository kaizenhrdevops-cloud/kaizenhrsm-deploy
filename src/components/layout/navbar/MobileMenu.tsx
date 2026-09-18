"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { resourcesSubmenus, companySubmenus } from "@/data/submenus";
import { useHrmsSubmenus } from "./useHrmsSubmenus";
import type { SubmenuItem } from "./NavItems";

function MobileSection({
  id,
  title,
  items,
  openSubmenu,
  onToggle,
  onNavigate,
  boxed,
}: {
  id: string;
  title: string;
  items: SubmenuItem[];
  openSubmenu: string | null;
  onToggle: (id: string) => void;
  onNavigate: () => void;
  boxed?: boolean;
}) {
  const open = openSubmenu === id;
  return (
    <div className="border-b border-gray-100 pb-2">
      <button
        onClick={() => onToggle(id)}
        className={`w-full flex justify-between items-center py-3.5 text-lg font-medium transition-colors cursor-pointer ${
          open ? "text-blue-600" : "text-gray-800 hover:text-blue-600"
        }`}
        aria-expanded={open}
      >
        <span className="text-lg font-semibold tracking-tight">{title}</span>
        <div
          className={`p-1.5 rounded-full transition-all duration-300 ${
            open
              ? "bg-blue-50 text-blue-600 rotate-180"
              : "bg-gray-50 text-gray-400"
          }`}
        >
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Smooth CSS Grid accordion */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100 mb-3"
            : "grid-rows-[0fr] opacity-0 mb-0"
        }`}
      >
        <div className="overflow-hidden">
          {boxed ? (
            <div className="bg-gray-50/80 rounded-2xl p-2 space-y-1 max-h-[55vh] overflow-y-auto overscroll-contain">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  onClick={onNavigate}
                  className="flex items-center space-x-3 p-2.5 text-gray-700 hover:text-blue-700 hover:bg-white rounded-xl transition-all duration-200"
                >
                  <div className="bg-white p-2 rounded-lg shadow-xs text-blue-500 shrink-0">
                    <item.icon size={18} />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="pl-3 space-y-1 mt-1 border-l-2 border-blue-200">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  onClick={onNavigate}
                  target={item.name === "Brochure" ? "_blank" : "_self"}
                  rel={item.name === "Brochure" ? "noopener noreferrer" : ""}
                  className="flex items-center space-x-3 p-2.5 text-gray-700 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
                >
                  <div className="bg-blue-50/80 p-2 rounded-lg text-blue-600 shrink-0">
                    <item.icon size={18} />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block py-3 text-base font-semibold border-b border-gray-100 transition-colors ${
        active ? "text-blue-600" : "text-gray-900 hover:text-blue-600"
      }`}
    >
      {children}
    </Link>
  );
}

export default function MobileMenu({
  open,
  openSubmenu,
  pathname,
  onToggle,
  onNavigate,
}: {
  open: boolean;
  openSubmenu: string | null;
  pathname: string;
  onToggle: (id: string) => void;
  onNavigate: () => void;
}) {
  // Static entries + any NEW published CMS pages from /admin/hrms.
  const hrmsItems = useHrmsSubmenus();
  const menuRef = useRef<HTMLDivElement>(null);

  // When the menu closes, focus may still be on a link inside it (e.g. the
  // "Contact Us" button). An aria-hidden ancestor must never contain the
  // focused element, so move focus out before the browser warns:
  // "Blocked aria-hidden on an element because its descendant retained focus."
  useEffect(() => {
    if (!open && menuRef.current) {
      const active = document.activeElement;
      if (active && menuRef.current.contains(active)) {
        (active as HTMLElement).blur();
      }
    }
  }, [open]);

  return (
    <div
      ref={menuRef}
      className={`fixed inset-0 z-40 bg-white/98 backdrop-blur-xl h-screen w-full overflow-y-auto transition-all duration-300 ease-out pt-24 pb-12 px-6 ${
        open
          ? "opacity-100 translate-y-0 pointer-events-auto visible"
          : "opacity-0 -translate-y-4 pointer-events-none invisible"
      }`}
      aria-hidden={!open}
      // `inert` removes the closed menu from tab order + AT tree, so its
      // links can't receive/retain focus while hidden.
      inert={!open}
    >
      <div className="space-y-1 max-w-lg mx-auto">
        <MobileSection
          id="hrms"
          title="HRMS"
          items={hrmsItems}
          openSubmenu={openSubmenu}
          onToggle={onToggle}
          onNavigate={onNavigate}
          boxed
        />
        <MobileSection
          id="resources"
          title="Resources"
          items={resourcesSubmenus}
          openSubmenu={openSubmenu}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
        <MobileLink
          href="/resources/blog-articles"
          active={pathname.startsWith("/resources/blog-articles")}
          onNavigate={onNavigate}
        >
          Blog & Articles
        </MobileLink>
        <MobileLink
          href="/company/developments"
          active={pathname.startsWith("/company/developments")}
          onNavigate={onNavigate}
        >
          Developments
        </MobileLink>
        <MobileLink
          href="/company/careers"
          active={pathname.startsWith("/company/careers")}
          onNavigate={onNavigate}
        >
          Careers
        </MobileLink>
        <MobileSection
          id="company"
          title="Company"
          items={companySubmenus}
          openSubmenu={openSubmenu}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
        <div className="pt-6 pb-4">
          <Link
            href="/company/contact-us"
            onClick={onNavigate}
            className="flex items-center justify-center w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-yellow-400/20 transition-all active:scale-[0.98]"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
