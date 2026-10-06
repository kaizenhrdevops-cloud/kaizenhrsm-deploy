/**
 * Newsletter queue engine (server-only — NOT a "use server" module, so none
 * of these functions are exposed as callable server actions).
 *
 * Email priority model (Resend free tier = 100 mails/day, shared):
 *
 *   HIGH  (sent immediately, never queued)
 *     - Contact-us form auto-reply + admin notification  (/api/contact)
 *     - Newsletter subscribe verification               (/api/newsletter/subscribe)
 *     - Admin quick reply                                (/api/admin/contacts/reply)
 *     - Password reset                                   (admin/users)
 *
 *   LOW   (queued, drained by this module)
 *     - Blog-post newsletter campaigns
 *
 * Low-priority sends may only use `remaining_today - reserve`, so there is
 * always headroom left for high-priority mail even on a busy newsletter day.
 * Campaigns that don't fit today simply continue on the next tick/day.
 */
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Database } from "@/types/supabase";
import { getServiceClient } from "@/lib/supabase-admin";
import { postNewsletterTemplate } from "@/lib/email-templates/post-newsletter-template";

type Admin = SupabaseClient<Database>;

const resend = new Resend(process.env.RESEND_API_KEY);

/** Malaysia has no DST — a fixed +08:00 offset is exact. */
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Resend batch endpoint accepts up to 100; 50 keeps payloads small. */
const RESEND_BATCH_SIZE = 50;

export type NewsletterFrequency = "daily" | "weekly";

export type NewsletterScheduleConfig = {
  frequency: NewsletterFrequency;
  /** 0 = Sunday … 6 = Saturday (Malaysia time). Used for weekly only. */
  sendDay: number;
  /** "HH:MM" 24h, Malaysia time. */
  sendTime: string;
  /** Mails per day kept free for high-priority (transactional) email. */
  reserve: number;
  dailyLimit: number;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * system_settings.value is jsonb holding a JSON string ('"100"'), a JSON
 * number, or legacy plain text — PostgREST may already decode it, so accept
 * every shape.
 */
export async function readSystemSetting(
  supabase: Admin,
  key: string,
  fallback: string
): Promise<string> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  const raw = data?.value as unknown;
  if (raw == null) return fallback;
  if (typeof raw === "number") return String(raw);
  if (typeof raw !== "string") return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed || fallback;
    if (typeof parsed === "number") return String(parsed);
    return fallback;
  } catch {
    return raw || fallback;
  }
}

function toInt(raw: string, fallback: number, min: number, max: number) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function getNewsletterScheduleConfig(
  supabase: Admin = getServiceClient()
): Promise<NewsletterScheduleConfig> {
  const [frequency, sendDay, sendTime, reserve, dailyLimit] = await Promise.all([
    readSystemSetting(supabase, "newsletter_frequency", "weekly"),
    readSystemSetting(supabase, "newsletter_send_day", "1"),
    readSystemSetting(supabase, "newsletter_send_time", "10:00"),
    readSystemSetting(supabase, "newsletter_transactional_reserve", "20"),
    readSystemSetting(supabase, "newsletter_daily_limit", "100"),
  ]);

  const limit = toInt(dailyLimit, 100, 1, 100000);
  return {
    frequency: frequency === "daily" ? "daily" : "weekly",
    sendDay: toInt(sendDay, 1, 0, 6),
    sendTime: /^\d{1,2}:\d{2}$/.test(sendTime) ? sendTime : "10:00",
    // Never reserve the whole budget, or newsletters could never send.
    reserve: toInt(reserve, 20, 0, Math.max(0, limit - 1)),
    dailyLimit: limit,
  };
}

// ---------------------------------------------------------------------------
// Slot calculation ("next available newsletter slot")
// ---------------------------------------------------------------------------

function periodMs(cfg: NewsletterScheduleConfig) {
  return cfg.frequency === "daily" ? DAY_MS : 7 * DAY_MS;
}

/** First configured slot at or after `fromMs` (epoch ms). */
function firstSlotOnOrAfter(cfg: NewsletterScheduleConfig, fromMs: number) {
  const [hh, mm] = cfg.sendTime.split(":").map((v) => Number.parseInt(v, 10));
  // Shift into "Malaysia wall clock" and use the UTC getters on it.
  const local = new Date(fromMs + MYT_OFFSET_MS);
  let candidate =
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      hh,
      mm
    ) - MYT_OFFSET_MS;

  if (cfg.frequency === "weekly") {
    const dow = new Date(candidate + MYT_OFFSET_MS).getUTCDay();
    candidate += ((cfg.sendDay - dow + 7) % 7) * DAY_MS;
  }
  if (candidate < fromMs) candidate += periodMs(cfg);
  return candidate;
}

/**
 * Next slot that no other campaign already occupies. A slot "owns" the
 * window [slot, slot + period): one auto-scheduled newsletter per day
 * (daily) or per week (weekly). Queued posts line up behind each other.
 */
export async function computeNextAutoSlot(
  supabase: Admin = getServiceClient(),
  cfg?: NewsletterScheduleConfig,
  nowMs: number = Date.now()
): Promise<string> {
  const config = cfg ?? (await getNewsletterScheduleConfig(supabase));
  const period = periodMs(config);

  const { data: existing } = await supabase
    .from("newsletter_campaigns")
    .select("scheduled_at")
    .in("status", ["scheduled", "in_progress", "completed"])
    .gte("scheduled_at", new Date(nowMs - period).toISOString());

  const taken = (existing ?? [])
    .map((c) => (c.scheduled_at ? Date.parse(c.scheduled_at) : NaN))
    .filter((t) => Number.isFinite(t));

  let slot = firstSlotOnOrAfter(config, nowMs);
  for (let i = 0; i < 520; i++) {
    const s = slot;
    if (!taken.some((t) => t >= s && t < s + period)) break;
    slot += period;
  }
  return new Date(slot).toISOString();
}

// ---------------------------------------------------------------------------
// Quota
// ---------------------------------------------------------------------------

/** Mails sent today (all types) vs limit, and what newsletters may use. */
export async function getEmailQuota(
  supabase: Admin = getServiceClient(),
  cfg?: NewsletterScheduleConfig
) {
  const config = cfg ?? (await getNewsletterScheduleConfig(supabase));
  const { data, error } = await supabase.rpc("get_remaining_daily_email_quota");
  if (error) throw new Error(`Failed to get quota: ${error.message}`);
  const remaining = Math.max(0, Number(data) || 0);
  return {
    remaining,
    reserve: config.reserve,
    newsletterAllowance: Math.max(0, remaining - config.reserve),
  };
}

// ---------------------------------------------------------------------------
// Queue processing
// ---------------------------------------------------------------------------

type CampaignRow = {
  id: string;
  post_id: string;
  subject: string;
  preview_text: string | null;
  status: string | null;
};

type BatchResult = {
  sent: number;
  failed: number;
  skipped: number;
  retryable: number;
  done: boolean;
};

export type QueueRunResult = {
  success: boolean;
  message: string;
  sent: number;
  failed: number;
  skipped: number;
  retryable: number;
  quotaExhausted: boolean;
};

function isRetryableSendError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number } | null)?.statusCode;
  if (statusCode === 429 || (statusCode != null && statusCode >= 500)) return true;
  const message = ((error as { message?: unknown } | null)?.message ?? "").toString();
  return /rate limit|too many requests|429|temporar|timeout|network|fetch failed/i.test(
    message
  );
}

/** Recompute campaign counters from the send log (no drift under overlap). */
async function refreshCampaignCounters(supabase: Admin, campaignId: string) {
  const countWhere = async (statuses: string[]) => {
    const { count } = await supabase
      .from("newsletter_send_log")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", statuses);
    return count ?? 0;
  };
  const [pending, sent, failed] = await Promise.all([
    countWhere(["queued", "sending"]),
    countWhere(["sent"]),
    countWhere(["failed", "bounced"]),
  ]);

  const done = pending === 0;
  await supabase
    .from("newsletter_campaigns")
    .update({
      queued_count: pending,
      sent_count: sent,
      total_failed: failed,
      status: done ? "completed" : "in_progress",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", campaignId);
  return done;
}

async function processCampaignBatch(
  supabase: Admin,
  campaign: CampaignRow,
  limit: number
): Promise<BatchResult> {
  const result: BatchResult = { sent: 0, failed: 0, skipped: 0, retryable: 0, done: false };

  // Candidate rows: FIFO.
  // We only claim rows with status = 'queued'. Rows with status = 'sending'
  // are actively being processed by a worker and MUST NOT be double-claimed.
  const { data: candidates, error: candError } = await supabase
    .from("newsletter_send_log")
    .select("id, email, subscriber_id, status")
    .eq("campaign_id", campaign.id)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (candError) throw new Error("Failed to fetch recipient batch.");

  if (!candidates || candidates.length === 0) {
    result.done = await refreshCampaignCounters(supabase, campaign.id);
    return result;
  }

  // Atomically claim the queued rows: only rows still `queued` flip, so an
  // overlapping run (cron + "Send now") can't grab the same recipients.
  const queuedIds = candidates.map((r) => r.id);
  const { data: claimed, error: claimError } = await supabase
    .from("newsletter_send_log")
    .update({ status: "sending" })
    .in("id", queuedIds)
    .eq("status", "queued")
    .select("id");

  if (claimError || !claimed || claimed.length === 0) {
    // Another worker claimed them concurrently, nothing for this worker to do.
    return result;
  }

  const claimedIdSet = new Set(claimed.map((r) => r.id));
  const batch = candidates.filter((r) => claimedIdSet.has(r.id));
  if (batch.length === 0) return result;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("title, featured_image, slug, category")
    .eq("id", campaign.post_id)
    .single();
  if (postError || !post) {
    throw new Error(`Post ${campaign.post_id} not found for campaign.`);
  }

  // In newsletter emails, never send localhost links to real email recipients!
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const siteUrl =
    rawSiteUrl && !rawSiteUrl.includes("localhost")
      ? rawSiteUrl.replace(/\/$/, "")
      : "https://www.kaizenhrms.com";

  const postPath =
    post.category === "blog" ? "resources/blog-articles" : "company/developments";
  const readMoreUrl = `${siteUrl}/${postPath}/${post.slug}`;

  // Re-check subscription status so anyone who unsubscribed after
  // scheduling is skipped instead of emailed.
  const subscriberIds = [...new Set(batch.map((r) => r.subscriber_id))];
  const { data: subs, error: subsError } = await supabase
    .from("newsletter_subscribers")
    .select("id, status, unsubscribe_token")
    .in("id", subscriberIds);
  if (subsError) throw new Error("Failed to fetch subscribers.");
  const subById = new Map((subs ?? []).map((s) => [s.id, s]));

  const nowIso = () => new Date().toISOString();
  const sendable: { logId: string; email: string; token: string }[] = [];

  for (const row of batch) {
    const sub = subById.get(row.subscriber_id);
    if (!sub || sub.status !== "subscribed") {
      await supabase.from("newsletter_send_log").delete().eq("id", row.id);
      result.skipped++;
      continue;
    }
    if (!sub.unsubscribe_token) {
      await supabase
        .from("newsletter_send_log")
        .update({ status: "failed", error_message: "Unsubscribe token not found" })
        .eq("id", row.id);
      result.failed++;
      continue;
    }
    sendable.push({ logId: row.id, email: row.email, token: sub.unsubscribe_token });
  }

  for (let i = 0; i < sendable.length; i += RESEND_BATCH_SIZE) {
    const chunk = sendable.slice(i, i + RESEND_BATCH_SIZE);
    const resolveImageUrl = (img?: string | null) => {
      if (!img) return null;
      const trimmed = img.trim();
      if (!trimmed) return null;
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (trimmed.startsWith("/")) return `${siteUrl}${trimmed}`;
      return `${siteUrl}/${trimmed}`;
    };

    const payload = chunk.map((r) => ({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [r.email],
      subject: campaign.subject,
      html: postNewsletterTemplate({
        postTitle: campaign.subject,
        postPreviewText: campaign.preview_text || "Read the full article...",
        postImageUrl: resolveImageUrl(post.featured_image),
        readMoreUrl,
        unsubscribeUrl: `${siteUrl}/api/newsletter/unsubscribe?id=${r.token}`,
        category: post.category,
        siteUrl,
      }),
    }));

    // Same recipients ⇒ same key: if a previous run sent this exact chunk
    // but died before updating the DB, Resend dedupes instead of re-sending.
    const idempotencyKey =
      "nl-" +
      createHash("sha256")
        .update(campaign.id + ":" + chunk.map((r) => r.logId).join(","))
        .digest("hex")
        .slice(0, 48);

    let failedIdx = new Map<number, string>();
    try {
      const { data, error } = await resend.batch.send(payload, {
        batchValidation: "permissive",
        idempotencyKey,
      });

      if (error) {
        if (isRetryableSendError(error)) {
          // Leave rows as `sending`; the next run retries them.
          result.retryable += chunk.length;
          continue;
        }
        failedIdx = new Map(chunk.map((_, idx) => [idx, error.message || "Send failed"]));
      } else {
        const errors =
          (data as { errors?: { index: number; message: string }[] } | null)?.errors ?? [];
        failedIdx = new Map(errors.map((e) => [e.index, e.message]));
      }
    } catch (err: unknown) {
      if (isRetryableSendError(err)) {
        result.retryable += chunk.length;
        continue;
      }
      const msg = (err as { message?: string })?.message || "Send failed";
      failedIdx = new Map(chunk.map((_, idx) => [idx, msg]));
    }

    const sentIds = chunk.filter((_, idx) => !failedIdx.has(idx)).map((r) => r.logId);
    if (sentIds.length > 0) {
      const { data: updatedSent } = await supabase
        .from("newsletter_send_log")
        .update({ status: "sent", sent_at: nowIso(), error_message: null })
        .in("id", sentIds)
        .eq("status", "sending")
        .select("id");
      result.sent += updatedSent?.length ?? sentIds.length;
    }
    for (const [idx, message] of failedIdx) {
      // Guard: NEVER overwrite a row that has already been marked as 'sent'
      const { data: updatedFailed } = await supabase
        .from("newsletter_send_log")
        .update({ status: "failed", error_message: message })
        .eq("id", chunk[idx].logId)
        .eq("status", "sending")
        .select("id");
      if (updatedFailed && updatedFailed.length > 0) {
        result.failed++;
      }
    }
  }

  result.done = await refreshCampaignCounters(supabase, campaign.id);
  return result;
}

/**
 * Drain due campaigns (scheduled_at <= now) oldest-first, within the
 * newsletter share of today's quota and a wall-clock budget.
 *
 * @param campaignId  restrict to one campaign (used by "Send now")
 * @param timeBudgetMs stop starting new batches after this long
 */
export async function processNewsletterQueue(
  opts: { campaignId?: string; timeBudgetMs?: number } = {}
): Promise<QueueRunResult> {
  const { campaignId, timeBudgetMs = 8000 } = opts;
  const supabase = getServiceClient();
  const started = Date.now();
  const totals: QueueRunResult = {
    success: true,
    message: "",
    sent: 0,
    failed: 0,
    skipped: 0,
    retryable: 0,
    quotaExhausted: false,
  };

  // Due campaigns first: with a per-minute scheduler most runs have nothing
  // to do, so bail out before the quota RPC.
  let query = supabase
    .from("newsletter_campaigns")
    .select("id, post_id, subject, preview_text, status")
    .in("status", ["scheduled", "in_progress"])
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(10);
  if (campaignId) query = query.eq("id", campaignId);

  const { data: campaigns, error } = await query;
  if (error) return { ...totals, success: false, message: error.message };
  if (!campaigns || campaigns.length === 0) {
    return { ...totals, message: "No campaigns due." };
  }

  let allowance: number;
  try {
    ({ newsletterAllowance: allowance } = await getEmailQuota(supabase));
  } catch (err: unknown) {
    return { ...totals, success: false, message: (err as Error).message };
  }

  if (allowance <= 0) {
    return {
      ...totals,
      quotaExhausted: true,
      message: "Newsletter share of today's email quota is used up; continuing tomorrow.",
    };
  }

  for (const campaign of campaigns as CampaignRow[]) {
    if (allowance <= 0 || Date.now() - started > timeBudgetMs) break;

    try {
      if (campaign.status === "scheduled") {
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "in_progress" })
          .eq("id", campaign.id);
      }

      while (allowance > 0 && Date.now() - started <= timeBudgetMs) {
        const r = await processCampaignBatch(
          supabase,
          campaign,
          Math.min(allowance, RESEND_BATCH_SIZE * 2)
        );
        totals.sent += r.sent;
        totals.failed += r.failed;
        totals.skipped += r.skipped;
        totals.retryable += r.retryable;
        allowance -= r.sent;

        if (r.done) break;
        // Nothing moved (rate-limited / all retryable) — try next run.
        if (r.sent + r.failed + r.skipped === 0) break;
      }
    } catch (err: unknown) {
      const message = (err as Error)?.message || "Unknown error";
      console.error(`NEWSLETTER: campaign ${campaign.id} failed:`, message);
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "failed", error_details: { error: message } })
        .eq("id", campaign.id);
      totals.success = false;
    }
  }

  totals.quotaExhausted = allowance <= 0;
  totals.message =
    `Sent ${totals.sent}, failed ${totals.failed}, skipped ${totals.skipped}, retry later ${totals.retryable}.` +
    (totals.quotaExhausted ? " Daily newsletter quota reached; the rest continues tomorrow." : "");
  return totals;
}
