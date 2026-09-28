-- Self-promotion guard for profiles.
--
-- The previous UPDATE policy allowed any user to update their own row with
-- no column restriction, so a direct PostgREST call could set
-- role='super_admin' on oneself, bypassing the UI (which only edits
-- full_name). WITH CHECK cannot reference OLD, so the rule is split:
-- super_admins keep full access; everyone else may only write rows that
-- keep role='admin' AND status='active' (i.e. full_name/email edits only).
-- Service-role server code bypasses RLS and is unaffected.

DROP POLICY IF EXISTS "Users can update profiles based on role" ON "public"."profiles";

CREATE POLICY "Users can update profiles based on role"
  ON "public"."profiles" FOR UPDATE
  USING (
    ((select "auth"."uid"()) = "id")
    OR ((select "public"."get_my_role"()) = 'super_admin'::"text")
  )
  WITH CHECK (
    ((select "public"."get_my_role"()) = 'super_admin'::"text")
    OR (
      ((select "auth"."uid"()) = "id")
      AND "role" = 'admin'::"text"
      AND "status" = 'active'::"text"
    )
  );

-- 'password_reset' becomes a first-class logged email type (admin-triggered
-- recovery mails are now actually sent via Resend — see resetUserPassword).
ALTER TABLE "public"."email_send_log"
  DROP CONSTRAINT IF EXISTS "email_send_log_email_type_check",
  ADD CONSTRAINT "email_send_log_email_type_check" CHECK (
    "email_type" = ANY (ARRAY[
      'contact_reply'::"text",
      'subscriber_verification'::"text",
      'newsletter_test'::"text",
      'password_reset'::"text"
    ])
  );
