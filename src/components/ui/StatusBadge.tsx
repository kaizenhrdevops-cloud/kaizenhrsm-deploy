import { cn } from "@/lib/utils";

/**
 * Central status -> color map (light + dark mode).
 * Replaces the 12 per-page StatusBadge copies. Add new statuses here
 * once instead of in every admin table.
 */
const STATUS_STYLES: Record<string, string> = {
  // contacts
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  contacted:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  replied:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  // posts / campaigns
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  scheduled:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  // email sends
  sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  queued: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  // subscribers / users
  subscribed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  unverified:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  unsubscribed:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase() || "unknown";
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[key] || "bg-gray-100 text-gray-700"
      )}
    >
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}
