-- HRMS navbar entry fields: short menu description + lucide icon name.
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Code falls back to the tagline (truncated) and a grid icon when the
-- columns are absent, so it is safe to deploy before applying — but apply
-- it so the choices persist.

ALTER TABLE "public"."hrms_modules"
  ADD COLUMN IF NOT EXISTS "nav_description" "text" NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "icon_name" "text" NOT NULL DEFAULT '';
