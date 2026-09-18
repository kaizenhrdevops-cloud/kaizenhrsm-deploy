"use client";

import { useState, useMemo } from "react";
import DataTable, { type Column } from "@/components/shared/DataTable";
import {
  Download,
  UserX,
  AlertCircle,
  Users,
  CalendarDays,
  Clock,
  Filter,
  Mail,
  ChevronDown, // <-- Added Icon
} from "lucide-react";

// ... (Types and Helper functions remain the same)

export type Subscriber = {
  id: string;
  email: string;
  status: "subscribed" | "unverified" | "unsubscribed";
  created_at: string;
  verified_at: string | null;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({
  status,
}: {
  status: "subscribed" | "unverified" | "unsubscribed";
}) => {
  const baseClasses =
    "inline-block px-2.5 py-1 text-xs font-medium rounded-full";
  let colorClasses = "";
  const text = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case "subscribed":
      colorClasses =
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      break;
    case "unverified":
      colorClasses =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      break;
    case "unsubscribed":
      colorClasses =
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      break;
  }
  return <span className={`${baseClasses} ${colorClasses}`}>{text}</span>;
};

const StatCard = ({ title, count, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {count}
      </h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function SubscribersClient({
  initialSubscribers,
}: {
  initialSubscribers: Subscriber[];
}) {
  const [subscribers, setSubscribers] =
    useState<Subscriber[]>(initialSubscribers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "subscribed" | "unverified" | "unsubscribed"
  >("all");

  // Calculate Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalCurrent = subscribers.filter(
      (s) => s.status === "subscribed"
    ).length;
    const totalUnverified = subscribers.filter(
      (s) => s.status === "unverified"
    ).length;

    const last7Days = subscribers.filter(
      (s) => new Date(s.created_at) > sevenDaysAgo
    ).length;
    const last30Days = subscribers.filter(
      (s) => new Date(s.created_at) > thirtyDaysAgo
    ).length;

    return {
      totalCurrent,
      totalUnverified,
      last7Days,
      last30Days,
    };
  }, [subscribers]);

  // Filter Data
  const filteredData = useMemo(() => {
    if (filterStatus === "all") return subscribers;
    return subscribers.filter((s) => s.status === filterStatus);
  }, [subscribers, filterStatus]);

  const handleUnsubscribe = async (id: string) => {
    setError(null);
    try {
      const response = await fetch("/api/admin/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "unsubscribed" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update subscriber.");
      }

      const updatedSubscriber = await response.json();
      setSubscribers((prev) =>
        prev.map((sub) =>
          sub.id === updatedSubscriber.id ? updatedSubscriber : sub
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDownloadCSV = () => {
    setLoading(true);
    setError(null);

    if (subscribers.length === 0) {
      setError("No subscribers to export.");
      setLoading(false);
      return;
    }

    const allSubscriberData = subscribers.map((s) => ({
      email: s.email,
      status: s.status,
      subscribed_at: formatDate(s.created_at),
      verified_at: formatDate(s.verified_at),
    }));

    const csvHeader = "email,status,subscribed_at,verified_at\n";
    const csvRows = allSubscriberData
      .map(
        (row) =>
          `"${row.email}","${row.status}","${row.subscribed_at}","${row.verified_at}"`
      )
      .join("\n");

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `all_subscribers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  const columns: Column<Subscriber>[] = [
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          <span>{item.email}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "created_at",
      label: "Subscribed At",
      sortable: true,
      render: (item) => formatDate(item.created_at),
    },
    {
      key: "verified_at",
      label: "Verified At",
      sortable: true,
      render: (item) => formatDate(item.verified_at),
    },
  ];

  const actions = (item: Subscriber) => (
    <div className="flex justify-end items-center gap-2">
      {confirmingId === item.id ? (
        <>
          <span className="text-sm">Are you sure?</span>
          <button
            onClick={() => handleUnsubscribe(item.id)}
            className="font-bold text-red-600 hover:underline text-sm"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmingId(null)}
            className="font-bold hover:underline text-sm"
          >
            No
          </button>
        </>
      ) : (
        <>
          {item.status !== "unsubscribed" && (
            <button
              onClick={() => setConfirmingId(item.id)}
              className="p-2 text-slate-500 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-slate-700 transition-colors"
              title="Unsubscribe user"
            >
              <UserX size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );

  const headerActions = (
    <button
      onClick={handleDownloadCSV}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
    >
      <Download size={16} />
      Download CSV
    </button>
  );

  // UPDATED: Wider Filter with Chevron
  const filterControls = (
    <div className="relative">
      <Filter
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={16}
      />
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={16}
      />
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as any)}
        // Added min-w-[180px] and pr-10 for wider look and chevron space
        className="w-full pl-9 pr-10 py-2 text-sm border rounded-lg appearance-none bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-[180px]"
      >
        <option value="all">All Status</option>
        <option value="subscribed">Subscribed</option>
        <option value="unverified">Unverified</option>
        <option value="unsubscribed">Unsubscribed</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Subscribers"
          count={stats.totalCurrent}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          title="New (Last 30 Days)"
          count={stats.last30Days}
          icon={CalendarDays}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
        />
        <StatCard
          title="New (Last 7 Days)"
          count={stats.last7Days}
          icon={Clock}
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
        />
        <StatCard
          title="Unverified / Pending"
          count={stats.totalUnverified}
          icon={AlertCircle}
          colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300"
        />
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center gap-2"
          role="alert"
        >
          <AlertCircle size={20} />
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <DataTable
        data={filteredData}
        columns={columns}
        searchable={true}
        searchKeys={["email"]}
        pagination={true}
        itemsPerPage={15}
        actions={actions}
        headerActions={headerActions}
        filterControls={filterControls}
        emptyMessage="No subscribers found matching your criteria."
      />
    </div>
  );
}
