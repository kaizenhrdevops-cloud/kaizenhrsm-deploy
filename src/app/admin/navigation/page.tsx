// src/app/admin/navigation/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getAdminNavItems } from "./actions";
import NavigationManager from "./NavigationManager";

export const dynamic = "force-dynamic";

export default async function NavigationManagementPage() {
  // Enforce super_admin access server-side (in addition to middleware).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.status !== "active" ||
    profile.role !== "super_admin"
  ) {
    redirect("/admin/dashboard");
  }

  const { items, message, migrationMissing } = await getAdminNavItems();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Navbar Management
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Reposition, rename, hide, or delete top-level navigation menus.
          Changes automatically reflect across the public Navbar, Mobile Menu,
          and synced Footer sections.
        </p>
      </div>

      {migrationMissing ? (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 text-sm text-amber-900 dark:text-amber-200 space-y-2">
          <p className="font-semibold">Database Migration Required</p>
          <p>
            The <code className="font-mono font-semibold">navbar_items</code>{" "}
            table has not been created yet. Run{" "}
            <code className="font-mono font-semibold">
              supabase/migrations/20261126000000_navbar_management.sql
            </code>{" "}
            in your Supabase Dashboard SQL Editor, then refresh this page.
          </p>
          <p className="text-xs opacity-80">
            Public pages continue using the built-in default navbar safely until
            the migration is applied.
          </p>
        </div>
      ) : message && message !== "ok" ? (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          Error loading navigation items: {message}
        </div>
      ) : (
        <NavigationManager initialItems={items} />
      )}
    </div>
  );
}
