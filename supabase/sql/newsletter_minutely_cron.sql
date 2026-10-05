-- =====================================================================
-- Newsletter minutely scheduler (Supabase pg_cron + pg_net)
-- =====================================================================
-- Why: Vercel Hobby only allows a once-a-day cron (vercel.json fires at
-- 01:00 UTC = 9:00 AM MYT). Campaigns scheduled for a custom time would
-- otherwise wait until the next morning. This pings
-- /api/cron/process-newsletter every minute so custom times fire on time.
--
-- NOT a migration on purpose: it contains environment-specific values.
-- Run once in Supabase Dashboard → SQL Editor (production project), after
-- replacing the two placeholders below.
--
-- Cost: a run with nothing due = 1 cheap SELECT; no emails/quota used.
-- =====================================================================

-- 1. Extensions (also toggleable in Dashboard → Database → Extensions)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Store URL + secret in Vault (never hard-code the secret in the job)
--    Replace the placeholders IN THE SQL EDITOR ONLY — don't save real
--    values into this file (it's committed to git).
--    CRON_SECRET must match the Vercel env var.
--    Safe to re-run: updates the secret if it already exists.
do $$
declare
  v_url    text := 'https://www.kaizenhrms.com';   -- e.g. https://www.example.com (no trailing slash)
  v_secret text := 'mytestsecret123';
  v_id     uuid;
begin
  select id into v_id from vault.secrets where name = 'newsletter_cron_url';
  if v_id is null then
    perform vault.create_secret(v_url, 'newsletter_cron_url');
  else
    perform vault.update_secret(v_id, v_url);
  end if;

  v_id := null;
  select id into v_id from vault.secrets where name = 'newsletter_cron_secret';
  if v_id is null then
    perform vault.create_secret(v_secret, 'newsletter_cron_secret');
  else
    perform vault.update_secret(v_id, v_secret);
  end if;
end $$;

-- 3. Schedule every minute (re-running replaces the job of the same name)
select cron.schedule(
  'process-newsletter-every-minute',
  '* * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'newsletter_cron_url') || '/api/cron/process-newsletter',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                     where name = 'newsletter_cron_secret')
    ),
    timeout_milliseconds := 55000
  );
  $$
);

-- ---------------------------------------------------------------------
-- Useful checks
-- ---------------------------------------------------------------------
-- Job registered?
--   select jobid, jobname, schedule, active from cron.job;
-- Last runs:
--   select status, return_message, start_time from cron.job_run_details
--   order by start_time desc limit 10;
-- HTTP responses from the endpoint (200 = OK, 401 = wrong secret):
--   select status_code, content::text, created from net._http_response
--   order by created desc limit 10;
--
-- Update a secret later:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'newsletter_cron_secret'),
--     'NEW_SECRET');
-- Remove the job:
--   select cron.unschedule('process-newsletter-every-minute');
