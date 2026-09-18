# HRMS Module CMS

`/hrms/*` pages are editable in **Admin → HRMS Modules** (no code changes).
Content lives in Supabase tables `hrms_modules` + `hrms_features`
(see `supabase/migrations/20260912120000_hrms_cms.sql`, seeded from the old
static pages by `20260912120001_hrms_seed.sql`).

## How serving works

All `/hrms/*` routes are served by the single dynamic route
`src/app/(public)/hrms/[slug]/page.tsx`. This file reads `hrms_modules`
+ `hrms_features` from Supabase (published only, via RLS) and renders
through `ModulePageLayout`. Pages are statically generated at build time
via `generateStaticParams` and revalidate hourly (`revalidate = 3600`).

Saving in `/admin/hrms` calls `revalidatePath` so changes appear
immediately without waiting for the hourly cycle.

The old static page folders (`src/app/(public)/hrms/<slug>/page.tsx`) were
deleted on 2026-09-14. The deprecated `ModulesData.ts` and
`moduleHelpers.ts` files were moved to `src/data/_deprecated/`.

## Slug-specific custom sections

Some modules have custom sections that can't be represented in the CMS
schema. These are hardcoded in `[slug]/page.tsx` and rendered based on
the slug:

- **`leave-management`** — Blue gradient CTA banner ("Ready to Transform
  Your Leave Management?") rendered via `<LeaveManagementCTA />`.

To add more slug-specific sections, add a component and a condition
in the children slot of `ModulePageLayout` in `[slug]/page.tsx`.

## Related modules

The "Related Modules" section at the bottom of each page is populated from
`hrms_modules` (all published rows). The current page's next 4 alphabetical
neighbours are shown (deterministic, no hydration mismatch).

## Rules that keep this working

- **Background colors** in the editor are a fixed dropdown
  (sections: `bg-white slate-50 blue-50 gray-50`; hero adds `bg-slate-100`
  + `gradient-blue` via migration `20260914000004_hrms_hero_bg_slate.sql`,
  falls back to `bg-white`). Navbar entries use `nav_description` (short, else truncated
  tagline) + `icon_name` (lucide name, else grid icon), migration
  `20260914000002_hrms_nav_fields.sql`. Tailwind only generates classes
  found in source files — a custom color typed anywhere else silently
  renders unstyled.
- **Slugs**: lowercase letters, numbers, hyphens. Renaming cascades to
  sections automatically.
- **Draft** status = public 404. Preview drafts only in `/admin/hrms`.
- Deleting a module deletes its sections (cascade). The URL then 404s.
- **Images**: hero uses the `image_ratio` column (`21:9…1:1`, default
  `4:1`; needs migration `20260914000000_hrms_image_ratio.sql`, falls back
  to `4:1` without it). Section images on CMS pages are framed to the
  template (side 4:3, center 16:9, full-width 21:9) via the `constrainMedia`
  prop — bake matching ratios in the section cropper (side 4:3, center
  16:9, full 21:9) for pixel-exact results. Direct-link URLs skip the
  cropper and get center-cropped into the same frames. YouTube/Vimeo
  section URLs embed as players; MP4/WebM play natively.
