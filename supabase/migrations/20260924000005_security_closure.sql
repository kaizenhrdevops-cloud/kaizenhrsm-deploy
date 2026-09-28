-- Security closure: gate privileged functions, scope default privileges,
-- pin search_path, constrain post_blocks writes.
--
-- 1. prune_admin_audit_logs() was SECURITY DEFINER with no internal check
--    and EXECUTE to `authenticated`: any signed-in user could wipe audit
--    history. Now super_admin + active only (service role exempt). Also
--    fixes its retention parse (value::jsonb->>0 on a JSON scalar is always
--    NULL, so it previously never pruned anything).
-- 2. get_campaign_stats() was an open per-campaign oracle: same gate.
-- 3. ALTER DEFAULT PRIVILEGES had granted ALL to anon/authenticated on all
--    future tables/functions/sequences — RLS was the only defense. Future
--    objects now default to no access; service_role is unaffected.
-- 4. Trigger-only functions don't need direct EXECUTE: revoked from
--    anon/authenticated/PUBLIC (triggers fire regardless of these grants).
-- 5. search_path pins on (new + recreated) SECURITY DEFINER functions.
-- 6. post_blocks admin policy gains the WITH CHECK its siblings have.

-- 1. prune_admin_audit_logs: gate + fix retention parse.
CREATE OR REPLACE FUNCTION "public"."prune_admin_audit_logs"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    retention_days INT;
    deleted_count INT;
BEGIN
    IF "auth"."uid"() IS NOT NULL THEN
      IF (SELECT "public"."get_my_role"()) IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'Access denied: super_admin role required.';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM "public"."profiles" p
        WHERE p."id" = "auth"."uid"() AND p."status" = 'active'
      ) THEN
        RAISE EXCEPTION 'Access denied: account is not active.';
      END IF;
    END IF;

    SELECT CASE
        WHEN "value" IS NULL THEN NULL
        WHEN jsonb_typeof("value") = 'number' THEN "value"::text::INT
        WHEN jsonb_typeof("value") = 'string' AND ("value" #>> '{}') ~ '^\d+(\.\d+)?$'
          THEN ("value" #>> '{}')::FLOAT::INT
        ELSE NULL
    END INTO retention_days
    FROM "public"."system_settings"
    WHERE "key" = 'audit_log_retention_days'
    LIMIT 1;

    IF retention_days IS NULL OR retention_days <= 0 THEN
        RETURN 'Audit log retention is set to "Keep Forever". No logs were deleted.';
    END IF;

    WITH deleted AS (
        DELETE FROM "public"."admin_audit_log"
        WHERE "created_at" < (NOW() - (retention_days || ' days')::INTERVAL)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN 'Pruned ' || deleted_count || ' audit log(s) older than ' || retention_days || ' days.';
END;
$$;

-- 2. get_campaign_stats: same gate (currently unreachable dead code, but
--    callable by any authenticated user as-is).
CREATE OR REPLACE FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid")
RETURNS TABLE("total_sent" bigint, "total_failed" bigint, "total_opened" bigint, "total_clicked" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
  IF "auth"."uid"() IS NOT NULL THEN
    IF (SELECT "public"."get_my_role"()) IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'Access denied: super_admin role required.';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM "public"."profiles" p
      WHERE p."id" = "auth"."uid"() AND p."status" = 'active'
    ) THEN
      RAISE EXCEPTION 'Access denied: account is not active.';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE "status" = 'sent'),
    COUNT(*) FILTER (WHERE "status" = 'failed'),
    COUNT(*) FILTER (WHERE "opened_at" IS NOT NULL),
    COUNT(*) FILTER (WHERE "clicked_at" IS NOT NULL)
  FROM "public"."newsletter_send_log"
  WHERE "campaign_id" = "campaign_uuid";
END;
$$;

REVOKE ALL ON FUNCTION "public"."get_campaign_stats"("uuid") FROM "authenticated";

-- 3. Future objects: no implicit access for anon/authenticated.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";

-- 4. Trigger-only functions need no direct EXECUTE.
REVOKE ALL ON FUNCTION "public"."check_user_active_status"() FROM "anon", "authenticated", "public";
REVOKE ALL ON FUNCTION "public"."create_post_revision"() FROM "anon", "authenticated", "public";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon", "authenticated", "public";
REVOKE ALL ON FUNCTION "public"."prevent_admin_deletion_safety"() FROM "anon", "authenticated", "public";
REVOKE ALL ON FUNCTION "public"."update_contact_last_reply"() FROM "anon", "authenticated", "public";
REVOKE ALL ON FUNCTION "public"."update_contacts_updated_at"() FROM "anon", "authenticated", "public";
REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM "anon", "authenticated", "public";

-- 5. search_path pins (hijack lint 0011) on our SECURITY DEFINER functions.
--    All bodies use qualified public./auth. references, so '' is safe.
ALTER FUNCTION "public"."get_all_users_with_profiles"() SET search_path = '';
ALTER FUNCTION "public"."get_user_last_sign_in"("uuid") SET search_path = '';
ALTER FUNCTION "public"."get_user_status_by_email"("text") SET search_path = '';
ALTER FUNCTION "public"."guard_profile_status_transition"() SET search_path = '';
ALTER FUNCTION "public"."get_remaining_daily_email_quota"() SET search_path = '';

-- 6. post_blocks admin policy: add the WITH CHECK its siblings have.
-- (Kept structurally simple and paren-light on purpose.)
DROP POLICY IF EXISTS "Admins can manage all post blocks" ON "public"."post_blocks";
CREATE POLICY "Admins can manage all post blocks" ON "public"."post_blocks" TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE "profiles"."id" = (select "auth"."uid"())
      AND "profiles"."status" = 'active'
      AND "profiles"."role" IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE "profiles"."id" = (select "auth"."uid"())
      AND "profiles"."status" = 'active'
      AND "profiles"."role" IN ('admin', 'super_admin')
  )
);
