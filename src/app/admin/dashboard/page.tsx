// src/app/admin/dashboard/page.tsx

import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { DashboardStat, ActivityItem } from "@/types/dashboard";
import Container from "@/components/layout/Container";
import DashboardStatsGrid from "./components/DashboardStatsGrid";
import ActivityTimeline from "./components/ActivityTimeline";
import ContactsTable from "./components/ContactsTable";
import QuickActions from "./components/QuickActions";

// Lazy-load recharts so the dashboard streams without waiting for it.
// (No ssr:false — this is a Server Component; dynamic() still code-splits.)
const SubscriberChart = dynamic(() => import("./components/SubscriberChart"), {
  loading: () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="h-[300px] w-full animate-pulse bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
    </div>
  ),
});

export const metadata = {
  title: "Admin Dashboard | Kaizen",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role || "")) {
    redirect("/");
  }

  const isSuperAdmin = profile.role === "super_admin";

  const now = new Date();
  const startOfThisMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
  const earliestTrendDate =
    startOfLastMonth < thirtyDaysAgoISO ? startOfLastMonth : thirtyDaysAgoISO;

  // 1. Fetch Data (Optimized targeted queries)
  const [
    postsResult,
    contactsResult,
    totalSubsResult,
    recentSubsResult,
    baselineSubsResult,
    campaignsResult,
    quotaResult,
    auditLogsResult,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("contacts")
      .select("id, full_name, company, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    // Total count without pulling rows across network
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true }),
    // Only subscribers in trend/chart window
    supabase
      .from("newsletter_subscribers")
      .select("id, status, created_at")
      .gte("created_at", earliestTrendDate)
      .order("created_at", { ascending: true }),
    // Baseline count for 30-day cumulative chart
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .lt("created_at", thirtyDaysAgoISO),
    supabase
      .from("newsletter_campaigns")
      .select("id, subject, status, sent_at, total_sent, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.rpc("get_remaining_daily_email_quota"),
    isSuperAdmin
      ? supabase
          .from("admin_audit_log")
          .select("id, action, created_at")
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
  ]);

  // 2. Process Raw Data
  const posts = postsResult.data || [];
  const contacts = contactsResult.data || [];
  const totalSubscribersCount = totalSubsResult.count || 0;
  const recentSubscribers = recentSubsResult.data || [];
  const baselineSubsCount = baselineSubsResult.count || 0;
  const campaigns = campaignsResult.data || [];
  const remainingQuota =
    typeof quotaResult.data === "number" ? quotaResult.data : 0;

  // --- Helper: Trends ---
  function getTrend(data: any[]) {
    const thisMonth = data.filter(
      (i) => i.created_at >= startOfThisMonth
    ).length;
    const lastMonth = data.filter(
      (i) => i.created_at >= startOfLastMonth && i.created_at < startOfThisMonth
    ).length;

    if (lastMonth === 0)
      return {
        trend: "neutral" as const,
        value: thisMonth > 0 ? "+100%" : "0%",
      };

    const diff = thisMonth - lastMonth;
    const percent = Math.round((diff / lastMonth) * 100);
    return {
      trend: percent > 0 ? "up" : percent < 0 ? "down" : "neutral",
      value: `${percent > 0 ? "+" : ""}${percent}%`,
    } as const;
  }

  const postTrend = getTrend(posts);
  const contactTrend = getTrend(contacts);
  const subTrend = getTrend(recentSubscribers);

  // --- 3. Build Stats Cards ---
  const stats: DashboardStat[] = [
    {
      label: "Total Posts",
      value: posts.length, // Note: For total count in huge DB, use proper count query. For now this works for recent.
      href: "/admin/blog",
      iconName: "FileText",
      color: "blue",
      trend: postTrend.trend,
      trendValue: postTrend.value,
      trendLabel: "vs last month",
    },
    {
      label: "Pending Inquiries",
      value: contacts.filter((c) => c.status === "new").length,
      href: "/admin/contacts?filter=new",
      iconName: "Users",
      color: "yellow",
      trend: contactTrend.trend,
      trendValue: contactTrend.value,
      trendLabel: "vs last month",
    },
    {
      label: "Total Subscribers",
      value: totalSubscribersCount,
      href: "/admin/subscribers",
      iconName: "Mail",
      color: "purple",
      trend: subTrend.trend,
      trendValue: subTrend.value,
      trendLabel: "vs last month",
    },
    {
      label: "Last Campaign",
      value: campaigns[0]?.total_sent || 0,
      href: "/admin/newsletter",
      iconName: "Activity",
      color: "green",
      trend: "neutral",
      trendValue: campaigns[0]?.status || "Draft",
      trendLabel: "Status",
    },
  ];

  if (isSuperAdmin) {
    stats.push({
      label: "Email Quota",
      value: remainingQuota,
      href: "/admin/settings",
      iconName: "Server",
      color: remainingQuota < 20 ? "red" : "gray",
      trend: "down",
      trendValue: `${100 - remainingQuota} used`,
      trendLabel: "Daily limit: 100",
    });
  }

  // --- 4. Process Chart Data (Daily) ---
  const sortedSubs = [...recentSubscribers].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const finalChartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Set end of day to include all subs from that day
    d.setHours(23, 59, 59, 999);

    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const recentCount = sortedSubs.filter(
      (s) => new Date(s.created_at) <= d
    ).length;
    finalChartData.push({ date: label, count: baselineSubsCount + recentCount });
  }

  // --- 5. Activities Feed (Combined) ---
  let activities: ActivityItem[] = [];
  posts.forEach((p) =>
    activities.push({
      id: p.id,
      type: "post",
      title: p.title,
      status: p.status || "draft",
      timestamp: p.created_at || new Date().toISOString(),
      href: `/admin/editor/${p.id}`,
    })
  );
  contacts
    .slice(0, 15)
    .forEach((c) =>
      activities.push({
        id: c.id,
        type: "contact",
        title: `New inquiry: ${c.full_name}`,
        status: c.status || "new",
        timestamp: c.created_at || new Date().toISOString(),
        href: `/admin/contacts`,
      })
    );
  campaigns.forEach((c) =>
    activities.push({
      id: c.id,
      type: "campaign",
      title: c.subject,
      status: c.status || "pending",
      timestamp: c.created_at || new Date().toISOString(),
      href: `/admin/newsletter/${c.id}`,
    })
  );

  if (auditLogsResult.data) {
    auditLogsResult.data.forEach((log) =>
      activities.push({
        id: log.id,
        type: "audit_log",
        title: log.action,
        status: "info",
        timestamp: log.created_at || new Date().toISOString(),
        href: "/admin/audit-log",
      })
    );
  }

  // Sort all activities by newest first
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Note: We don't slice strictly to 10 here anymore so the Timeline pagination has data to show.
  // We'll limit to reasonable "feed" size (e.g. 50 items max) to keep page light.
  activities = activities.slice(0, 50);

  return (
    <Container className="py-4 sm:py-8 space-y-4 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Overview for {profile.full_name?.split(" ")[0]}
          </p>
        </div>
        <QuickActions isSuperAdmin={isSuperAdmin} />
      </div>

      <DashboardStatsGrid stats={stats} />

      <div className="w-full">
        <SubscriberChart data={finalChartData} />
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
        {/* Left Column: Activity Timeline */}
        <div className="lg:col-span-1">
          <ActivityTimeline items={activities} />
        </div>

        {/* Right Column: Contacts Table */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          {/* We pass the larger list of contacts now so table pagination works */}
          <ContactsTable contacts={contacts} />
        </div>
      </div>
    </Container>
  );
}
