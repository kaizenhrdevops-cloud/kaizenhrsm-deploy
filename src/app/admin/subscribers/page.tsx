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

export default async function SubscribersPage() {
  // 1. Create a standard client to check who the user is
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Check the user's role using the standard client
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // 3. Shared ADMIN client (bypasses RLS) — see src/lib/supabase-admin.ts
  const supabaseAdmin = getServiceClient();

  // 4. Fetch the data using the ADMIN client
  const { data: subscribers, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, email, status, created_at, verified_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subscribers:", error);
    return <div>Error loading data. Please try again.</div>;
  }

  return <SubscribersClient initialSubscribers={subscribers || []} />;
}
