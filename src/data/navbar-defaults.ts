// src/data/navbar-defaults.ts

export type NavItemKey =
  | "hrms"
  | "resources"
  | "blog-articles"
  | "developments"
  | "careers"
  | "company";

export type NavItemType = "link" | "dropdown";
export type DropdownKey = "hrms" | "resources" | "company";
export type FooterSectionKey = "hrms" | "resources" | "company";

export type PublicNavItem = {
  key: NavItemKey;
  label: string;
  item_type: NavItemType;
  href: string | null;
  dropdown_key: DropdownKey | null;
  footer_section: FooterSectionKey | null;
  order_index: number;
};

export type AdminNavItem = PublicNavItem & {
  is_visible: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_name: string | null;
  updated_at: string | null;
};

/** Deleted navbar items stay in the bin for 30 days before automatic permanent removal. */
export const BIN_RETENTION_DAYS = 30;
export const NAV_LABEL_MAX_LENGTH = 40;

/**
 * Canonical fallback used before the navbar_items migration is applied
 * or if the database is temporarily unreachable.
 */
export const DEFAULT_NAV_ITEMS: PublicNavItem[] = [
  {
    key: "hrms",
    label: "HRMS",
    item_type: "dropdown",
    href: null,
    dropdown_key: "hrms",
    footer_section: "hrms",
    order_index: 0,
  },
  {
    key: "resources",
    label: "Resources",
    item_type: "dropdown",
    href: null,
    dropdown_key: "resources",
    footer_section: "resources",
    order_index: 1,
  },
  {
    key: "blog-articles",
    label: "Blog & Articles",
    item_type: "link",
    href: "/resources/blog-articles",
    dropdown_key: null,
    footer_section: null,
    order_index: 2,
  },
  {
    key: "developments",
    label: "Developments",
    item_type: "link",
    href: "/company/developments",
    dropdown_key: null,
    footer_section: null,
    order_index: 3,
  },
  {
    key: "careers",
    label: "Careers",
    item_type: "link",
    href: "/company/careers",
    dropdown_key: null,
    footer_section: null,
    order_index: 4,
  },
  {
    key: "company",
    label: "Company",
    item_type: "dropdown",
    href: null,
    dropdown_key: "company",
    footer_section: "company",
    order_index: 5,
  },
];

export const DEFAULT_NAV_LABEL_BY_KEY: Record<NavItemKey, string> = {
  hrms: "HRMS",
  resources: "Resources",
  "blog-articles": "Blog & Articles",
  developments: "Developments",
  careers: "Careers",
  company: "Company",
};
