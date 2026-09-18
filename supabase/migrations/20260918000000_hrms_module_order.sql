-- HRMS module display ordering
-- Adds order_index to hrms_modules table and seeds initial order to match the public navbar.
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).

ALTER TABLE "public"."hrms_modules"
  ADD COLUMN IF NOT EXISTS "order_index" integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_hrms_modules_order" ON "public"."hrms_modules" USING "btree" ("order_index");

-- Seed initial order according to the canonical navbar layout:
UPDATE "public"."hrms_modules" SET "order_index" = 0 WHERE "slug" = 'personnel-hub';
UPDATE "public"."hrms_modules" SET "order_index" = 1 WHERE "slug" = 'payroll-management';
UPDATE "public"."hrms_modules" SET "order_index" = 2 WHERE "slug" = 'leave-management';
UPDATE "public"."hrms_modules" SET "order_index" = 3 WHERE "slug" = 'leave-passage';
UPDATE "public"."hrms_modules" SET "order_index" = 4 WHERE "slug" = 'claims-management';
UPDATE "public"."hrms_modules" SET "order_index" = 5 WHERE "slug" = 'time-attendance';
UPDATE "public"."hrms_modules" SET "order_index" = 6 WHERE "slug" = 'recruitment';
UPDATE "public"."hrms_modules" SET "order_index" = 7 WHERE "slug" = 'loan-management';
UPDATE "public"."hrms_modules" SET "order_index" = 8 WHERE "slug" = 'loan-interest-subsidy';
UPDATE "public"."hrms_modules" SET "order_index" = 9 WHERE "slug" = 'gis-ghs';
UPDATE "public"."hrms_modules" SET "order_index" = 10 WHERE "slug" = 'esos-management';
UPDATE "public"."hrms_modules" SET "order_index" = 11 WHERE "slug" = 'espp-management';
UPDATE "public"."hrms_modules" SET "order_index" = 12 WHERE "slug" = 'training-management';
UPDATE "public"."hrms_modules" SET "order_index" = 13 WHERE "slug" = 'competency-management';
UPDATE "public"."hrms_modules" SET "order_index" = 14 WHERE "slug" = 'training-needs-analysis';
UPDATE "public"."hrms_modules" SET "order_index" = 15 WHERE "slug" = 'performance-management';
UPDATE "public"."hrms_modules" SET "order_index" = 16 WHERE "slug" = 'employee-self-service';
UPDATE "public"."hrms_modules" SET "order_index" = 17 WHERE "slug" = 'mobile-app';
UPDATE "public"."hrms_modules" SET "order_index" = 18 WHERE "slug" = 'bi-dashboard-analytics';
UPDATE "public"."hrms_modules" SET "order_index" = 19 WHERE "slug" = 'module-configurator';
UPDATE "public"."hrms_modules" SET "order_index" = 20 WHERE "slug" = 'app-management';
UPDATE "public"."hrms_modules" SET "order_index" = 21 WHERE "slug" = 'ai-chatbot';
