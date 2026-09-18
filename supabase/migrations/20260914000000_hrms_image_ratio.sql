-- HRMS hero banner ratio presets (blog-common ratios + banner).
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Code reads/writes fall back to '4:1' when the column is absent, so it is
-- safe to deploy before applying — but apply it so the choice persists.

ALTER TABLE "public"."hrms_modules"
  ADD COLUMN IF NOT EXISTS "image_ratio" "text" NOT NULL DEFAULT '4:1';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint" WHERE "conname" = 'hrms_modules_image_ratio_check'
  ) THEN
    ALTER TABLE "public"."hrms_modules"
      ADD CONSTRAINT "hrms_modules_image_ratio_check"
      CHECK ("image_ratio" IN ('21:9', '4:1', '16:9', '3:2', '4:3', '1:1'));
  END IF;
END
$$;
