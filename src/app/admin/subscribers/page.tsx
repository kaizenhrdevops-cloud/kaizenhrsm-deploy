import { createClient as createSupabaseServerClient } from "@/lib/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import SubscribersClient from "@/components/admin/SubscribersClient";

export type Subscriber = {
  id: string;
  email: string;
  status: "subscribed" | "unverified" | "unsubscribed";
  created_at: string;
  verified_at: string | null;
};

export type SubscriberCounts = {
  total: number;
  subscribed: number;
  unverified: number;
  unsubscribed: number;
};

const PAGE_SIZE = 50;
const STATUSES = ["subscribed", "unverified", "unsubscribed"] as const;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  // 1. Create a standard client to check who the user is
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Check the user's role AND active status using the standard client
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "admin" &&
    profile?.role !== "super_admin"
  ) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (profile?.status !== "active") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p>Your account is not active. Please contact an administrator.</p>
      </div>
    );
  }

  // 3. Parse list params (mirrors /api/admin/subscribers so SSR + client agree)
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const status = (STATUSES as readonly string[]).includes(params.status || "")
    ? (params.status as (typeof STATUSES)[number])
    : "all";
  const q = (params.q || "").trim().slice(0, 100);

  // 4. Shared ADMIN client (bypasses RLS) — see src/lib/supabase-admin.ts
  const supabaseAdmin = getServiceClient();

  const buildFiltered = () => {
    let query = supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, status, created_at, verified_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    if (q) {
      const safe = q.replace(/[%_\\]/g, (m) => `\\${m}`);
      query = query.ilike("email", `%${safe}%`);
    }
    return query;
  };

  const from = (page - 1) * PAGE_SIZE;
  const [{ data: subscribers, error, count }, countsRes] = await Promise.all([
    buildFiltered().range(from, from + PAGE_SIZE - 1),
    supabaseAdmin.from("newsletter_subscribers").select("status"),
  ]);

  if (error) {
    console.error("Error fetching subscribers:", error);
    return <div>Error loading data. Please try again.</div>;
  }

  const counts: SubscriberCounts = {
    total: 0,
    subscribed: 0,
    unverified: 0,
    unsubscribed: 0,
  };
  for (const row of countsRes.data || []) {
    counts.total += 1;
    if (row.status === "subscribed") counts.subscribed += 1;
    else if (row.status === "unverified") counts.unverified += 1;
    else if (row.status === "unsubscribed") counts.unsubscribed += 1;
  }

  return (
    <SubscribersClient
      initialRows={(subscribers || []) as Subscriber[]}
      initialTotal={count ?? 0}
      initialCounts={counts}
      initialPage={page}
      initialStatus={status}
      initialQuery={q}
      pageSize={PAGE_SIZE}
    />
  );
}
