-- HRMS hero background: flat section palette + gradient tokens.
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Code reads/writes fall back to 'bg-white' when the column is absent, so it
-- is safe to deploy before applying — but apply it so the choice persists.
-- Gradient tokens map to fixed classes in ModulePageLayout (HERO_BG_CLASS),
-- keeping Tailwind JIT happy (no arbitrary classes from the DB).

ALTER TABLE "public"."hrms_modules"
  ADD COLUMN IF NOT EXISTS "hero_bg" "text" NOT NULL DEFAULT 'bg-white';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint" WHERE "conname" = 'hrms_modules_hero_bg_check'
  ) THEN
    ALTER TABLE "public"."hrms_modules"
      ADD CONSTRAINT "hrms_modules_hero_bg_check"
      CHECK ("hero_bg" IN ('bg-white', 'bg-slate-50', 'bg-blue-50', 'bg-gray-50', 'gradient-blue'));
  END IF;
END
$$;
