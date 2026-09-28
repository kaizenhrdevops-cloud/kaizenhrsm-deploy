// src/app/admin/audit-log/page.tsx

import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import AuditLogTable from "./audit-log-table";

export const metadata = {
  title: "Audit Log | Kaizen Admin",
};

// Define props to accept searchParams (URL query strings)
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AuditLogPage(props: Props) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // 1. Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" || profile?.status !== "active") {
    redirect("/admin/dashboard");
  }

  // 2. Parse Search Params
  const from =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const to = typeof searchParams.to === "string" ? searchParams.to : undefined;
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;

  // 3. Build Query
  let query = supabase
    .from("admin_audit_log")
    .select(
      `
      id,
      action,
      details,
      created_at,
      admin:admin_id (
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  // Apply Date Filters
  if (from) {
    query = query.gte("created_at", `${from}T00:00:00`);
  }
  if (to) {
    query = query.lte("created_at", `${to}T23:59:59`);
  }

  // Apply Search Filter
  if (search) {
    // Search in action name
    query = query.ilike("action", `%${search}%`);
  }

  // Limit results (increase limit if filtering to ensure we find matches)
  const limit = from || to || search ? 500 : 100;
  query = query.limit(limit);

  const { data: rawLogs, error } = await query;

  if (error) {
    console.error("Error fetching audit logs:", error);
  }

  // FIX: Transform the data to flatten 'admin' array to single object
  // This resolves the TypeScript error: Type '{ ... }[]' is not assignable to type 'AuditLog'
  const logs = (rawLogs || []).map((log: any) => ({
    ...log,
    admin: Array.isArray(log.admin) ? log.admin[0] : log.admin,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Audit Log
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          View system activities and administrative actions.
        </p>
      </div>

      <AuditLogTable initialLogs={logs} />
    </div>
  );
}
