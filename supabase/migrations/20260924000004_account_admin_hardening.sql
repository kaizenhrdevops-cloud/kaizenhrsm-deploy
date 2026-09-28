-- Account-admin hardening: close RPC and reactivation holes.
--
-- 1. get_all_users_with_profiles() ran as SECURITY DEFINER with no internal
--    check while EXECUTE was granted to `authenticated`, so ANY signed-in
--    user could dump every account (id/email/role/status/last sign-in).
--    Now: super_admin + active only. Service-role callers (NULL uid) keep
--    working — the users admin page now lists via a server action.
-- 2. get_user_last_sign_in() accepted any user_id from any caller: scoped
--    to self-or-super_admin (service role unaffected).
-- 3. get_user_status_by_email() was an email->status oracle nobody calls:
--    super_admin-or-service only.
-- 4. Status-reactivation guard: RLS WITH CHECK cannot see OLD, so a
--    suspended admin could flip themselves back to active through the API.
--    This trigger blocks any non-super_admin status change at the row
--    level (clear error instead of cryptic RLS denial). Service-role
--    server actions (uid IS NULL) authorize themselves and are exempt.

-- 1. Gate the user dump.
CREATE OR REPLACE FUNCTION "public"."get_all_users_with_profiles"()
RETURNS TABLE("id" "uuid", "email" "text", "last_sign_in_at" timestamp with time zone, "full_name" "text", "role" "text", "status" "text", "created_by_id" "uuid", "created_by_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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
    u.id::uuid,
    u.email::text,
    u.last_sign_in_at,
    p.full_name::text,
    p.role::text,
    p.status::text,
    p.created_by::uuid as created_by_id,
    creator.full_name::text as created_by_name
  FROM
    auth.users u
  LEFT JOIN
    public.profiles p ON u.id = p.id
  LEFT JOIN
    public.profiles creator ON p.created_by = creator.id
  ORDER BY
    u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION "public"."get_all_users_with_profiles"() FROM "authenticated";

-- 2. Scope last-sign-in lookups to self-or-super_admin.
CREATE OR REPLACE FUNCTION "public"."get_user_last_sign_in"("user_id" "uuid") RETURNS timestamp with time zone
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT last_sign_in_at
  FROM auth.users
  WHERE id = user_id
    AND (
      "auth"."uid"() IS NULL
      OR id = "auth"."uid"()
      OR (SELECT "public"."get_my_role"()) = 'super_admin'
    );
$$;

-- 3. Status-by-email becomes super_admin-or-service only.
CREATE OR REPLACE FUNCTION "public"."get_user_status_by_email"("_email" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF "auth"."uid"() IS NOT NULL
     AND (SELECT "public"."get_my_role"()) IS DISTINCT FROM 'super_admin' THEN
    RETURN NULL;
  END IF;
  RETURN (
    SELECT status
    FROM public.profiles
    WHERE email = _email
  );
END;
$$;

-- 4. Row-level status transition guard.
CREATE OR REPLACE FUNCTION "public"."guard_profile_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Service-role server actions (no JWT uid) authorize themselves.
  IF "auth"."uid"() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Nobody except super_admin may touch status through RLS paths.
  IF NEW."status" IS DISTINCT FROM OLD."status"
     AND (SELECT "public"."get_my_role"()) IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Only a super admin can change account status.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "on_profile_status_guard" ON "public"."profiles";
CREATE TRIGGER "on_profile_status_guard"
  BEFORE UPDATE OF "status" ON "public"."profiles"
  FOR EACH ROW EXECUTE FUNCTION "public"."guard_profile_status_transition"();
