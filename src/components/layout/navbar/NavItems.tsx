"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SubmenuItem = {
  icon: LucideIcon;
  name: string;
  description?: string;
  path: string;
};

export function NavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center px-1 py-5 text-xs xl:text-sm font-semibold transition-colors duration-200 ${
        isActive ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
      }`}
    >
      <span className="relative z-10 whitespace-nowrap">{children}</span>
      <span
        className={`absolute bottom-0 left-0 h-0.5 w-full bg-blue-600 transition-transform duration-300 ease-out origin-left ${
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

/** Repeated HRMS/Resources/Company dropdown trigger button. */
export function DropdownTrigger({
  label,
  open,
  onEnter,
  onLeave,
}: {
  label: string;
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        className={`group relative flex items-center space-x-1 py-2 text-xs xl:text-sm font-semibold transition-colors duration-200 outline-none cursor-pointer ${
          open ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
        }`}
        aria-expanded={open}
      >
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown
          size={15}
          className={`transition-transform duration-300 ease-out ${
            open
              ? "rotate-180 text-blue-600"
              : "text-gray-400 group-hover:text-blue-600"
          }`}
        />
        <span
          className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-transform duration-300 ease-out origin-left ${
            open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </button>
    </div>
  );
}

/** Repeated dropdown item card (icon + name + description). */
export function DropdownItem({
  item,
  wide,
  onNavigate,
}: {
  item: SubmenuItem;
  wide?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      target={item.name === "Brochure" ? "_blank" : "_self"}
      rel={item.name === "Brochure" ? "noopener noreferrer" : ""}
      className={`group block p-4 rounded-xl hover:bg-blue-50/70 transition-all duration-200 border border-transparent hover:border-blue-100/80 hover:shadow-xs ${
        wide ? "w-full lg:w-80" : ""
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-xs shrink-0">
          <item.icon size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed group-hover:text-gray-600 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
