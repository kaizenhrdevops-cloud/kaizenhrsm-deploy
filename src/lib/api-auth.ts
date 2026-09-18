import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase-admin";

export type AdminAuth = {
  user: { id: string; email?: string };
  profile: {
    role: string;
    status: string;
    full_name?: string | null;
    email?: string | null;
  };
};

type RequireAdminOptions = {
  /** Allowed roles. Defaults to ["admin", "super_admin"]. */
  roles?: string[];
};

/**
 * Shared admin auth check for API routes.
 * Replaces the ~50-line getAuthUser() copy pasted in every
 * src/app/api/admin/* route. Returns null when unauthorized.
 */
export async function requireAdmin(
  _req?: unknown,
  opts: RequireAdminOptions = {}
): Promise<AdminAuth | null> {
  const allowedRoles = opts.roles ?? ["admin", "super_admin"];
  const cookieStore = await cookies();

  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(
    (cookie) =>
      cookie.name.includes("auth-token") &&
      !cookie.name.includes("code-verifier")
  );

  if (!authCookie) return null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await getServiceClient()
    .from("profiles")
    .select("role, status, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") return null;
  if (!profile.role || !allowedRoles.includes(profile.role)) return null;

  return { user, profile: profile as AdminAuth["profile"] };
}
