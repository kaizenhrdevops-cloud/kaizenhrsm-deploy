-- Fix: allow 'bg-slate-100' as a hero background (all static heroes use it;
-- the original check only allowed the section palette by mistake).
-- Run AFTER 20260914000001. Safe to re-run. Then re-run the backfill
-- (20260914000003), which sets hero_bg = 'bg-slate-100' on seeded rows.

ALTER TABLE "public"."hrms_modules"
  DROP CONSTRAINT IF EXISTS "hrms_modules_hero_bg_check";

ALTER TABLE "public"."hrms_modules"
  ADD CONSTRAINT "hrms_modules_hero_bg_check"
  CHECK ("hero_bg" IN ('bg-white', 'bg-slate-50', 'bg-slate-100', 'bg-blue-50', 'bg-gray-50', 'gradient-blue'));
