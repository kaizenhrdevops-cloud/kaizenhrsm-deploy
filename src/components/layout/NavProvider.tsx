// src/components/layout/NavProvider.tsx
"use client";

import { createContext, useContext } from "react";
import { DEFAULT_NAV_ITEMS, type PublicNavItem } from "@/data/navbar-defaults";

const NavContext = createContext<PublicNavItem[]>(DEFAULT_NAV_ITEMS);

/**
 * Top-level navigation items distributed from (public)/layout (one cached
 * read per request) to Navbar, DesktopDropdowns, MobileMenu, and Footer.
 */
export function NavProvider({
  value,
  children,
}: {
  value: PublicNavItem[];
  children: React.ReactNode;
}) {
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNavItems(): PublicNavItem[] {
  return useContext(NavContext);
}
