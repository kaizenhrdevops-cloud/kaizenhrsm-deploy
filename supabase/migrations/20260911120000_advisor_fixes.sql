-- Advisor fixes: security (search_path, anon EXECUTE, permissive inserts)
-- + performance (RLS initplan, duplicate indexes, overlapping policies).
--
-- Safe to apply: all writes go through service-role API routes, all logins
-- are admin/super_admin, and every function body uses schema-qualified names.
-- Apply via: supabase db push  (or paste into the Dashboard SQL editor)

-- =====================================================================
-- 1. Pin search_path on all functions (lint 0011)
-- =====================================================================
ALTER FUNCTION "public"."check_user_active_status"() SET search_path = '';
ALTER FUNCTION "public"."create_post_revision"() SET search_path = '';
ALTER FUNCTION "public"."generate_short_id"() SET search_path = '';
ALTER FUNCTION "public"."get_all_users_with_profiles"() SET search_path = '';
ALTER FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") SET search_path = '';
ALTER FUNCTION "public"."get_my_role"() SET search_path = '';
ALTER FUNCTION "public"."get_remaining_daily_email_quota"() SET search_path = '';
ALTER FUNCTION "public"."get_user_last_sign_in"("user_id" "uuid") SET search_path = '';
ALTER FUNCTION "public"."get_user_status_by_email"("_email" "text") SET search_path = '';
ALTER FUNCTION "public"."handle_new_user"() SET search_path = '';
ALTER FUNCTION "public"."prevent_admin_deletion_safety"() SET search_path = '';
ALTER FUNCTION "public"."prune_admin_audit_logs"() SET search_path = '';
ALTER FUNCTION "public"."update_contact_last_reply"() SET search_path = '';
ALTER FUNCTION "public"."update_contacts_updated_at"() SET search_path = '';
ALTER FUNCTION "public"."update_updated_at_column"() SET search_path = '';

-- =====================================================================
-- 2. Revoke direct anon RPC on data-access functions (lint 0028)
-- Triggers still fire (they run as owner). Dashboard (authenticated)
-- and cron (service_role) are unaffected. generate_short_id stays open:
-- it is a posts.short_id column DEFAULT and returns no data.
-- =====================================================================
REVOKE ALL ON FUNCTION "public"."check_user_active_status"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."create_post_revision"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_all_users_with_profiles"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_my_role"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_remaining_daily_email_quota"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_user_last_sign_in"("user_id" "uuid") FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_user_status_by_email"("_email" "text") FROM "anon";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."prevent_admin_deletion_safety"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."prune_admin_audit_logs"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."update_contact_last_reply"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."update_contacts_updated_at"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM "anon";

-- Postgres also grants EXECUTE to PUBLIC by default, which covers anon.
-- Revoke that too; the explicit GRANTs to authenticated/service_role above
-- are unaffected, so dashboard (authenticated) and cron (service_role) keep
-- working while anon RPC is fully closed.
REVOKE ALL ON FUNCTION "public"."check_user_active_status"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."create_post_revision"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_all_users_with_profiles"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_my_role"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_remaining_daily_email_quota"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_user_last_sign_in"("user_id" "uuid") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_user_status_by_email"("_email" "text") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."prevent_admin_deletion_safety"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."prune_admin_audit_logs"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_contact_last_reply"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_contacts_updated_at"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;

-- =====================================================================
-- 3. Drop unrestricted anon INSERTs (lint 0024)
-- Both writes go through service-role API routes (/api/contact with
-- Turnstile, /api/newsletter/subscribe with Turnstile + cooldown),
-- so no client path needs direct anon INSERT.
-- =====================================================================
DROP POLICY IF EXISTS "Allow public insert access" ON "public"."newsletter_subscribers";
DROP POLICY IF EXISTS "Allow public insert on contacts" ON "public"."contacts";

-- =====================================================================
-- 4. Drop duplicate indexes (lint 0009)
-- idx_post_blocks_post_id == idx_post_blocks_post_id_order (keep latter:
-- it also serves ORDER BY order_index). posts_short_id_unique duplicates
-- the posts_short_id_key UNIQUE constraint (keep the constraint).
-- =====================================================================
DROP INDEX IF EXISTS "public"."idx_post_blocks_post_id";
DROP INDEX IF EXISTS "public"."posts_short_id_unique";

-- =====================================================================
-- 5. One SELECT policy per role (lint 0006)
-- Public read policies apply to anon only now; authenticated admins are
-- covered by the admin policies (all app logins are admin/super_admin).
-- "Super admins can manage settings" becomes write-only so SELECT has a
-- single policy but super_admins keep full access via the view policy.
-- =====================================================================
DROP POLICY IF EXISTS "Public can view published posts" ON "public"."posts";
CREATE POLICY "Public can view published posts" ON "public"."posts" FOR SELECT TO "anon" USING (("status" = 'published'::"text"));

DROP POLICY IF EXISTS "Public can view blocks of published posts" ON "public"."post_blocks";
CREATE POLICY "Public can view blocks of published posts" ON "public"."post_blocks" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "post_blocks"."post_id") AND ("posts"."status" = 'published'::"text")))));

DROP POLICY IF EXISTS "Super admins can manage settings" ON "public"."system_settings";
DROP POLICY IF EXISTS "Super admins can manage settings (update)" ON "public"."system_settings";
DROP POLICY IF EXISTS "Super admins can manage settings (delete)" ON "public"."system_settings";
CREATE POLICY "Super admins can manage settings" ON "public"."system_settings" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = 'super_admin'::"text") AND ("profiles"."status" = 'active'::"text")))));
CREATE POLICY "Super admins can manage settings (update)" ON "public"."system_settings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = 'super_admin'::"text") AND ("profiles"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = 'super_admin'::"text") AND ("profiles"."status" = 'active'::"text")))));
CREATE POLICY "Super admins can manage settings (delete)" ON "public"."system_settings" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = 'super_admin'::"text") AND ("profiles"."status" = 'active'::"text")))));

-- =====================================================================
-- 6. Wrap auth.uid() in (select ...) so it is evaluated once per query,
-- not per row (lint 0003). Semantics unchanged.
-- =====================================================================

-- newsletter_campaigns --
DROP POLICY IF EXISTS "Admins can create campaigns" ON "public"."newsletter_campaigns";
CREATE POLICY "Admins can create campaigns" ON "public"."newsletter_campaigns" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

DROP POLICY IF EXISTS "Admins can view campaigns" ON "public"."newsletter_campaigns";
CREATE POLICY "Admins can view campaigns" ON "public"."newsletter_campaigns" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

DROP POLICY IF EXISTS "Super admins can update campaigns" ON "public"."newsletter_campaigns";
CREATE POLICY "Super admins can update campaigns" ON "public"."newsletter_campaigns" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text")))));

DROP POLICY IF EXISTS "Super admins can delete campaigns" ON "public"."newsletter_campaigns";
CREATE POLICY "Super admins can delete campaigns" ON "public"."newsletter_campaigns" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text")))));

-- admin_audit_log --
DROP POLICY IF EXISTS "Admins can insert audit logs" ON "public"."admin_audit_log";
CREATE POLICY "Admins can insert audit logs" ON "public"."admin_audit_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("profiles"."status" = 'active'::"text")))));

DROP POLICY IF EXISTS "Super admins can read audit logs" ON "public"."admin_audit_log";
CREATE POLICY "Super admins can read audit logs" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = 'super_admin'::"text") AND ("profiles"."status" = 'active'::"text")))));

-- email_send_log --
DROP POLICY IF EXISTS "Admins can insert email logs" ON "public"."email_send_log";
CREATE POLICY "Admins can insert email logs" ON "public"."email_send_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("profiles"."status" = 'active'::"text")))));

DROP POLICY IF EXISTS "Super admins can read email logs" ON "public"."email_send_log";
CREATE POLICY "Super admins can read email logs" ON "public"."email_send_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = 'super_admin'::"text") AND ("profiles"."status" = 'active'::"text")))));

-- post_blocks --
DROP POLICY IF EXISTS "Admins can manage all post blocks" ON "public"."post_blocks";
CREATE POLICY "Admins can manage all post blocks" ON "public"."post_blocks" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

-- posts --
DROP POLICY IF EXISTS "Admins can manage all posts" ON "public"."posts";
CREATE POLICY "Admins can manage all posts" ON "public"."posts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

-- post_revisions --
DROP POLICY IF EXISTS "Admins can view post revisions" ON "public"."post_revisions";
CREATE POLICY "Admins can view post revisions" ON "public"."post_revisions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

-- system_settings (view policy only; writes split above) --
DROP POLICY IF EXISTS "Admins can view settings" ON "public"."system_settings";
CREATE POLICY "Admins can view settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("profiles"."status" = 'active'::"text")))));

-- contacts --
DROP POLICY IF EXISTS "Allow authenticated admins to update contacts" ON "public"."contacts";
CREATE POLICY "Allow authenticated admins to update contacts" ON "public"."contacts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

DROP POLICY IF EXISTS "Allow authenticated admins to view contacts" ON "public"."contacts";
CREATE POLICY "Allow authenticated admins to view contacts" ON "public"."contacts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

DROP POLICY IF EXISTS "Allow only super_admin to delete contacts" ON "public"."contacts";
CREATE POLICY "Allow only super_admin to delete contacts" ON "public"."contacts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text")))));

-- contact_replies --
DROP POLICY IF EXISTS "Allow authenticated admins to view replies" ON "public"."contact_replies";
CREATE POLICY "Allow authenticated admins to view replies" ON "public"."contact_replies" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

DROP POLICY IF EXISTS "Allow only super_admin to create replies" ON "public"."contact_replies";
CREATE POLICY "Allow only super_admin to create replies" ON "public"."contact_replies" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text")))));

DROP POLICY IF EXISTS "Allow super_admin to update own replies" ON "public"."contact_replies";
CREATE POLICY "Allow super_admin to update own replies" ON "public"."contact_replies" FOR UPDATE TO "authenticated" USING ((("replied_by" = (select "auth"."uid"())) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text")))))) WITH CHECK ((("replied_by" = (select "auth"."uid"())) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text"))))));

DROP POLICY IF EXISTS "Allow only super_admin to delete replies" ON "public"."contact_replies";
CREATE POLICY "Allow only super_admin to delete replies" ON "public"."contact_replies" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = 'super_admin'::"text")))));

-- newsletter_send_log --
DROP POLICY IF EXISTS "Admins can view send logs" ON "public"."newsletter_send_log";
CREATE POLICY "Admins can view send logs" ON "public"."newsletter_send_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

-- profiles (also wraps get_my_role() in a sub-select) --
DROP POLICY IF EXISTS "Users can update profiles based on role" ON "public"."profiles";
CREATE POLICY "Users can update profiles based on role" ON "public"."profiles" FOR UPDATE USING (((select "auth"."uid"()) = "id") OR ((select "public"."get_my_role"()) = 'super_admin'::"text"));

DROP POLICY IF EXISTS "Users can view profiles based on their role" ON "public"."profiles";
CREATE POLICY "Users can view profiles based on their role" ON "public"."profiles" FOR SELECT USING (((select "auth"."uid"()) = "id") OR ((select "public"."get_my_role"()) = 'super_admin'::"text"));
