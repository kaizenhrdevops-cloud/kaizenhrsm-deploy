-- Strangler-fig backfill: align seeded CMS rows with their static pages so
-- each folder move is visually seamless.
--
-- RUN AFTER 20260914000000, 20260914000001, 20260914000002 (adds the columns
-- below). Safe to re-run (plain UPDATEs, no inserts). Deliberately excludes
-- staff-created slugs such as app-management — only the 20 seeded slugs.
--
-- What it sets and why:
-- - hero_bg = 'bg-slate-100' (all static heroes use it; leave-management
--   uses its blue gradient instead).
-- - image_ratio = '16:9' (every seeded hero PNG is 1920x1080, so the CMS
--   hero frame shows the full artwork uncropped).

UPDATE "public"."hrms_modules"
SET "hero_bg" = 'bg-slate-100',
    "image_ratio" = '16:9',
    "updated_at" = "now"()
WHERE "slug" IN (
  'personnel-hub', 'payroll-management', 'leave-passage',
  'claims-management', 'time-attendance', 'recruitment', 'loan-management',
  'loan-interest-subsidy', 'gis-ghs', 'esos-management', 'espp-management',
  'training-management', 'competency-management', 'training-needs-analysis',
  'performance-management', 'employee-self-service', 'mobile-app',
  'bi-dashboard-analytics', 'module-configurator'
);

UPDATE "public"."hrms_modules"
SET "hero_bg" = 'gradient-blue',
    "image_ratio" = '16:9',
    "updated_at" = "now"()
WHERE "slug" = 'leave-management';

UPDATE "public"."hrms_modules"
SET "hero_bg" = 'bg-slate-100',
    "updated_at" = "now"()
WHERE "slug" = 'ai-chatbot';
