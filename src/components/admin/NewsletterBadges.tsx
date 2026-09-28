// Shared newsletter admin UI atoms (badges, stat card, date formatting).
// Previously copy-pasted across CampaignsClient and CampaignDetailsClient
// with diverging status coverage.
"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function prettyStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const CAMPAIGN_BADGE: Record<string, { classes: string; Icon: LucideIcon }> = {
  completed: {
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Icon: CheckCircle,
  },
  scheduled: {
    classes:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    Icon: Clock,
  },
  in_progress: {
    classes:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Icon: Loader2,
  },
  sending: {
    classes:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Icon: Loader2,
  },
  failed: {
    classes: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    Icon: AlertCircle,
  },
  cancelled: {
    classes: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    Icon: XCircle,
  },
};

export function CampaignStatusBadge({ status }: { status: string | null }) {
  const meta = (status && CAMPAIGN_BADGE[status]) || null;
  const { Icon } = meta ?? { Icon: Clock };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full",
        meta?.classes ??
          "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
      )}
    >
      <Icon size={12} />
      {prettyStatus(status)}
    </span>
  );
}

const LOG_BADGE: Record<string, { classes: string; Icon: LucideIcon }> = {
  sent: {
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Icon: CheckCircle,
  },
  queued: {
    classes:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    Icon: Clock,
  },
  sending: {
    classes:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Icon: Loader2,
  },
  failed: {
    classes: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    Icon: AlertCircle,
  },
  bounced: {
    classes:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    Icon: Send,
  },
};

export function SendLogStatusBadge({ status }: { status: string | null }) {
  const meta = (status && LOG_BADGE[status]) || null;
  const { Icon } = meta ?? { Icon: Clock };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full",
        meta?.classes ??
          "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
      )}
    >
      <Icon size={12} />
      {prettyStatus(status)}
    </span>
  );
}

export function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow dark:bg-slate-800">
      <div className="flex items-center">
        <div className="p-2 mr-3 bg-blue-100 rounded-full dark:bg-blue-900">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
