-- Newsletter queue status values used by the app.
--
-- The original schema only allowed campaign statuses
-- (pending | sending | completed | failed | cancelled) and send-log
-- statuses (pending | sent | failed | bounced), but the application code
-- writes `scheduled` / `in_progress` for campaigns and `queued` for
-- send-log rows, so every schedule/cron tick violated the CHECK.
-- This migration widens both constraints to the union both sides use.

ALTER TABLE "public"."newsletter_campaigns"
  DROP CONSTRAINT IF EXISTS "newsletter_campaigns_status_check",
  ADD CONSTRAINT "newsletter_campaigns_status_check" CHECK (
    "status" = ANY (ARRAY[
      'pending'::"text",
      'scheduled'::"text",
      'in_progress'::"text",
      'sending'::"text",
      'completed'::"text",
      'failed'::"text",
      'cancelled'::"text"
    ])
  );

-- `sending` marks rows claimed by a tick so overlapping runs can't
-- double-send; stale `sending` rows are retried by the next tick.
ALTER TABLE "public"."newsletter_send_log"
  DROP CONSTRAINT IF EXISTS "newsletter_send_log_status_check",
  ADD CONSTRAINT "newsletter_send_log_status_check" CHECK (
    "status" = ANY (ARRAY[
      'pending'::"text",
      'queued'::"text",
      'sending'::"text",
      'sent'::"text",
      'failed'::"text",
      'bounced'::"text"
    ])
  );
