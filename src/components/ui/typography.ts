// src/components/ui/typography.ts
//
// Single standardized type scale for the PUBLIC site, taken from the HRMS
// module template (ModulePageLayout + RelatedModulesSection). Everything is
// Geist Sans (set globally in globals.css) — hierarchy comes from size and
// weight only, so the public pages share one consistent voice:
//
//   display — page heroes / H1            (30px → 48px, extrabold)
//   h2      — section headings            (24px → 30px, bold)
//   h3      — card titles / small heads   (18px, semibold)
//   lead    — hero intros, first paras    (16px → 18px)
//   body    — general paragraphs          (16px)
//   small   — card descriptions, captions (14px)
//   meta    — dates, labels, legal        (12px, medium)
//   eyebrow — kickers                     (12px, semibold, uppercase)
//
// Colors, margins and max-widths stay contextual per component — only the
// size/weight/leading/tracking come from here. Do NOT import this into the
// admin site.

export const typeDisplay =
  "text-3xl md:text-5xl font-extrabold tracking-tight text-balance";

export const typeH2 =
  "text-2xl md:text-3xl font-bold tracking-tight text-balance";

export const typeH3 = "text-lg font-semibold leading-tight";

export const typeLead = "text-base md:text-lg leading-7";

export const typeBody = "text-base leading-7";

export const typeSmall = "text-sm leading-6";

export const typeMeta = "text-xs font-medium";

export const typeEyebrow = "text-xs font-semibold tracking-widest uppercase";
