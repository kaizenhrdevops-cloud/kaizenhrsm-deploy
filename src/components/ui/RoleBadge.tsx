import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  super_admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
};

/** Shared role badge (users table, audit log, profile). */
export default function RoleBadge({ role }: { role: string | null }) {
  const key = role || "unknown";
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        ROLE_STYLES[key] || "bg-gray-100 text-gray-700"
      )}
    >
      {ROLE_LABELS[key] || key}
    </span>
  );
}
