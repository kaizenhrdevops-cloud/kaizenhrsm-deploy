-- Quota + email-log fixes for the newsletter module.
--
-- 1. get_remaining_daily_email_quota() parsed the limit as a JSON ARRAY
--    element (value::jsonb->>0), but settings are stored as JSON STRINGS
--    ('"100"') or numbers — so the limit silently fell back to 100 even
--    after an admin changed it. Parse any scalar shape, digits only.
-- 2. email_send_log.email_type gains 'newsletter_test' so test mails are
--    logged (and counted) like every other send. Without this, test mail
--    consumed Resend quota invisibly.
-- 3. newsletter_campaigns.sent_at defaulted to now(): rows looked "sent"
--    at schedule time. Default NULL; completion writes completed_at.

CREATE OR REPLACE FUNCTION "public"."get_remaining_daily_email_quota"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    daily_quota INT;
    newsletter_sends INT;
    other_sends INT;
    total_sent INT;
    remaining_quota INT;
BEGIN
    -- 1. Get the daily quota from settings.
    -- value is jsonb holding a JSON string ('"100"'), a JSON number (100),
    -- or legacy plain text — accept digits in any of those shapes.
    SELECT CASE
        WHEN value IS NULL THEN NULL
        WHEN jsonb_typeof(value) = 'number' THEN value::text::INT
        WHEN jsonb_typeof(value) = 'string' AND (value #>> '{}') ~ '^\d+$'
          THEN (value #>> '{}')::INT
        ELSE NULL
    END INTO daily_quota
    FROM public.system_settings
    WHERE key = 'newsletter_daily_limit'
    LIMIT 1;

    -- Default to 100 if not set (Resend free tier)
    IF daily_quota IS NULL THEN
        daily_quota := 100;
    END IF;

    -- 2. Count 'sent' newsletter emails from today
    SELECT COUNT(*) INTO newsletter_sends
    FROM public.newsletter_send_log
    WHERE status = 'sent'
    AND sent_at >= timezone('UTC', date_trunc('day', NOW()));

    -- 3. Count 'sent' other emails from today
    SELECT COUNT(*) INTO other_sends
    FROM public.email_send_log
    WHERE status = 'sent'
    AND sent_at >= timezone('UTC', date_trunc('day', NOW()));

    -- 4. Calculate remaining quota
    total_sent := newsletter_sends + other_sends;
    remaining_quota := daily_quota - total_sent;

    IF remaining_quota < 0 THEN
        remaining_quota := 0;
    END IF;

    RETURN remaining_quota;
END;
$$;

-- Test mails become first-class logged sends.
ALTER TABLE "public"."email_send_log"
  DROP CONSTRAINT IF EXISTS "email_send_log_email_type_check",
  ADD CONSTRAINT "email_send_log_email_type_check" CHECK (
    "email_type" = ANY (ARRAY[
      'contact_reply'::"text",
      'subscriber_verification'::"text",
      'newsletter_test'::"text"
    ])
  );

-- sent_at means completion, not creation.
ALTER TABLE "public"."newsletter_campaigns"
  ALTER COLUMN "sent_at" DROP DEFAULT;

-- One live campaign per post: blocks the double-schedule race where two
-- concurrent schedule calls both pass the newsletter_sent_at guard before
-- either commits. Terminal states (completed/failed/cancelled) are
-- excluded so retry-after-failure and schedule-after-cancel keep working.
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_campaigns_one_live_per_post"
  ON "public"."newsletter_campaigns" ("post_id")
  WHERE "status" IN ('scheduled', 'in_progress');
