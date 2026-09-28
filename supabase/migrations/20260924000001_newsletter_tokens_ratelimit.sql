-- Newsletter token hardening + abuse-attempt log for rate limiting.
--
-- 1. verification_token was neither UNIQUE nor indexed: duplicate tokens
--    (however unlikely) would make `.single()` lookups throw, and every
--    verify click scanned the table. Existing rows hold distinct
--    gen_random_uuid() values (verified rows hold NULL, which UNIQUE
--    permits in multiples), so the constraint applies cleanly.
-- 2. verification_expires_at bounds how long a verify link stays valid
--    (default 24h from issue; refreshed on every resend).
-- 3. abuse_attempts backs the DB sliding-window rate limiter
--    (see src/lib/rate-limit.ts). Vercel Hobby is stateless, so an
--    in-memory limiter would not work; this table is tiny by design and
--    pruned on every check plus daily by cron.

-- 1. Unique verification tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'newsletter_subscribers_verification_token_key'
  ) THEN
    ALTER TABLE "public"."newsletter_subscribers"
      ADD CONSTRAINT "newsletter_subscribers_verification_token_key"
      UNIQUE ("verification_token");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "newsletter_subscribers_verification_token_idx"
  ON "public"."newsletter_subscribers" ("verification_token");

-- 2. Verification link expiry
ALTER TABLE "public"."newsletter_subscribers"
  ADD COLUMN IF NOT EXISTS "verification_expires_at" timestamp with time zone;

-- Records first successful use. The token is intentionally kept (not nulled)
-- so re-clicks resolve to the friendly "already verified" page instead of a
-- confusing "invalid token" error. Rotation on resend invalidates old links.
ALTER TABLE "public"."newsletter_subscribers"
  ADD COLUMN IF NOT EXISTS "verification_used_at" timestamp with time zone;

-- Backfill: outstanding unverified links expire 24h from now.
UPDATE "public"."newsletter_subscribers"
SET "verification_expires_at" = "now"() + interval '24 hours'
WHERE "status" = 'unverified'
  AND "verification_token" IS NOT NULL
  AND "verification_expires_at" IS NULL;

-- 3. Abuse-attempt log
CREATE TABLE IF NOT EXISTS "public"."abuse_attempts" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
  "key" "text" NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE INDEX IF NOT EXISTS "abuse_attempts_key_created_idx"
  ON "public"."abuse_attempts" ("key", "created_at");

-- RLS locked down with NO policies (deny-by-default): anon/authenticated
-- clients can neither read nor write this table. Only the service-role
-- key used by server code bypasses RLS, which is the sole accessor.
-- (Also silences Supabase's "table created without RLS" warning.)
ALTER TABLE "public"."abuse_attempts" ENABLE ROW LEVEL SECURITY;
