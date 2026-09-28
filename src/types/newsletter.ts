// Shared newsletter types (single source — previously duplicated across the
// list page, detail page, and both client components with diverging shapes).
import type { Database } from "./supabase";

export type CampaignWithDetails =
  Database["public"]["Tables"]["newsletter_campaigns"]["Row"] & {
    posts: {
      title: string | null;
      slug: string | null;
      category: string | null;
    } | null;
    profiles: {
      full_name: string | null;
    } | null;
  };

export type SendLog = Pick<
  Database["public"]["Tables"]["newsletter_send_log"]["Row"],
  "id" | "email" | "status" | "sent_at" | "error_message" | "created_at"
>;

export type LogStatusCounts = {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  bounced: number;
  total: number;
};

export const EMPTY_LOG_COUNTS: LogStatusCounts = {
  queued: 0,
  sending: 0,
  sent: 0,
  failed: 0,
  bounced: 0,
  total: 0,
};

export const CAMPAIGN_STATUSES = [
  "pending",
  "scheduled",
  "in_progress",
  "sending",
  "completed",
  "failed",
  "cancelled",
] as const;

export const SEND_LOG_STATUSES = [
  "pending",
  "queued",
  "sending",
  "sent",
  "failed",
  "bounced",
] as const;
