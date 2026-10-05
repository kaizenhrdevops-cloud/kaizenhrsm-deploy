"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { formatDateMY } from "@/lib/format";
import {
  computeNextAutoSlot,
  getEmailQuota,
  getNewsletterScheduleConfig,
  processNewsletterQueue,
  type QueueRunResult,
} from "@/lib/newsletter-queue";

// --- Helper Functions ---

function generatePreviewFromBlocks(blocks: any[]): string | null {
  if (!blocks || blocks.length === 0) return null;
  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  if (!firstParagraph || !firstParagraph.content?.content) return null;
  try {
    for (const node of firstParagraph.content.content) {
      if (node.type === "paragraph" && node.content) {
        for (const innerNode of node.content) {
          if (innerNode.type === "text" && innerNode.text) {
            let text = innerNode.text.trim();
            if (text.length > 150) {
              text = text.substring(0, 150).trim() + "...";
            }
            return text;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error parsing block content:", e);
    return null;
  }
  return null;
}


async function createAdminClient() {
  return getServiceClient();
}

/** Shared super_admin gate for newsletter mutations. */
async function requireNewsletterAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    throw new Error("You do not have permission to perform this action.");
  }
  return { supabase, user };
}

async function auditCampaignAction(
  supabaseAdmin: any,
  adminId: string,
  action: string,
  campaignId: string,
  message: string
) {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      details: { message, campaign_id: campaignId },
    });
  } catch (err) {
    console.error("Campaign audit log failed:", err);
  }
}

// NEW: Helper to fetch system setting safely.
// system_settings.value is jsonb holding a JSON string ('"100"'), a JSON
// number, or legacy plain text — and PostgREST already decodes it, so the
// value can arrive as string OR number. Accept every shape.
async function getSystemSetting(supabase: any, key: string, fallback: string) {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (data?.value == null) return fallback;

  const raw = data.value;
  if (typeof raw === "number") return String(raw);
  if (typeof raw !== "string") return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed === "number") return String(parsed);
    return fallback;
  } catch {
    return raw || fallback;
  }
}

/** Daily send budget (Resend free = 100/day), always a positive int. */
export async function getNewsletterDailyLimit(): Promise<number> {
  try {
    const supabaseAdmin = await createAdminClient();
    const raw = await getSystemSetting(
      supabaseAdmin,
      "newsletter_daily_limit",
      "100"
    );
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  } catch {
    return 100;
  }
}

// --- Main Actions ---

export async function getNewsletterModalData(postId: string) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      throw new Error("Not authenticated");
    }

    // MODIFIED: Fetch admin email from settings, fallback to login email
    const configuredAdminEmail = await getSystemSetting(
      supabase,
      "admin_notification_email",
      user.email
    );

    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("title, excerpt, featured_image")
      .eq("id", postId)
      .single();

    if (postError) {
      throw new Error(`Post not found: ${postError.message}`);
    }

    const { data: postBlocks, error: blocksError } = await supabase
      .from("post_blocks")
      .select("type, content")
      .eq("post_id", postId)
      .order("order_index", { ascending: true });

    if (blocksError) {
      throw new Error(`Could not fetch post content: ${blocksError.message}`);
    }

    const postPreview =
      post.excerpt ||
      generatePreviewFromBlocks(postBlocks) ||
      "Read the full article on our website.";

    const { count, error: countError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "subscribed");

    if (countError) {
      throw new Error(`Could not count subscribers: ${countError.message}`);
    }

    // Daily send budget (Resend free = 100/day) for the drain estimate.
    const dailyQuota = await getNewsletterDailyLimit();

    // Delivery-slot info for the scheduling UI.
    const scheduleConfig = await getNewsletterScheduleConfig(supabaseAdmin);
    const [nextAutoSlot, quota] = await Promise.all([
      computeNextAutoSlot(supabaseAdmin, scheduleConfig),
      getEmailQuota(supabaseAdmin, scheduleConfig).catch(() => null),
    ]);

    return {
      success: true,
      adminEmail: configuredAdminEmail, // Uses value from settings
      postTitle: post.title || "Untitled Post",
      postPreview: postPreview,
      postImage: post.featured_image,
      subscriberCount: count || 0,
      dailyQuota,
      frequency: scheduleConfig.frequency,
      nextAutoSlot,
      newsletterAllowanceToday: quota?.newsletterAllowance ?? null,
      reserve: scheduleConfig.reserve,
    };
  } catch (error: any) {
    console.error("Error in getNewsletterModalData:", error.message);
    return { success: false, message: error.message };
  }
}

export type ScheduleMode = "auto" | "custom" | "now";

/**
 * Create a newsletter campaign for a post.
 *
 * - "auto":   next free slot from Admin → Settings → Newsletter Delivery
 *             (once a day / once a week at the configured time).
 * - "custom": the exact time the admin picked.
 * - "now":    start sending immediately (first batch is sent inline,
 *             within the newsletter share of today's quota).
 */
export async function scheduleNewsletter(
  postId: string,
  mode: ScheduleMode = "auto",
  customAt?: string | null
) {
  const { supabase, user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
    // 1. --- Resolve delivery time first (fail fast on bad input) ---
    let targetSchedule: string;
    if (mode === "now") {
      targetSchedule = new Date().toISOString();
    } else if (mode === "custom") {
      const parsed = customAt ? new Date(customAt) : null;
      if (!parsed || isNaN(parsed.getTime())) {
        throw new Error("Invalid scheduled date/time.");
      }
      if (parsed.getTime() < Date.now() - 60_000) {
        throw new Error("Scheduled time must be in the future.");
      }
      targetSchedule = parsed.toISOString();
    } else {
      targetSchedule = await computeNextAutoSlot(supabaseAdmin);
    }

    // 2. --- Get Post Data ---
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("title, excerpt, featured_image, newsletter_sent_at")
      .eq("id", postId)
      .single();

    if (postError || !post) throw new Error("Post not found.");
    if (post.newsletter_sent_at) {
      throw new Error("This newsletter has already been sent or is scheduled.");
    }

    // 3. --- Get Post Content (for Preview) ---
    const { data: postBlocks, error: blocksError } = await supabase
      .from("post_blocks")
      .select("type, content")
      .eq("post_id", postId)
      .order("order_index", { ascending: true });

    if (blocksError) throw new Error("Could not fetch post content.");

    const postPreview =
      post.excerpt ||
      generatePreviewFromBlocks(postBlocks) ||
      "Read the full article on our website.";

    // 4. --- Get Subscribers ---
    const { data: subscribers, error: subsError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, unsubscribe_token")
      .eq("status", "subscribed");

    if (subsError) throw new Error("Could not fetch subscribers.");
    if (!subscribers || subscribers.length === 0) {
      return {
        success: false,
        message: "There are no subscribers to send to.",
      };
    }

    // 5. --- Create Campaign Log ---
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .insert({
        post_id: postId,
        subject: post.title || "Untitled Post",
        preview_text: postPreview,
        sent_by: user.id,
        total_recipients: subscribers.length,
        status: "scheduled",
        scheduled_at: targetSchedule,
        queued_count: subscribers.length,
        sent_count: 0,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      // Partial unique index guards the double-schedule race: a concurrent
      // schedule that committed first surfaces here as 23505.
      if ((campaignError as { code?: string } | null)?.code === "23505") {
        throw new Error("A live campaign already exists for this post.");
      }
      throw new Error(
        `Failed to create campaign log: ${campaignError?.message}`
      );
    }

    // 6. --- Create 'queued' entries for all subscribers ---
    // Chunked: a single giant insert can exceed payload limits on big lists.
    const LOG_INSERT_CHUNK = 500;
    const logEntries = subscribers.map((sub) => ({
      campaign_id: campaign.id,
      subscriber_id: sub.id,
      email: sub.email,
      status: "queued",
    }));

    for (let i = 0; i < logEntries.length; i += LOG_INSERT_CHUNK) {
      const { error: logError } = await supabaseAdmin
        .from("newsletter_send_log")
        .insert(logEntries.slice(i, i + LOG_INSERT_CHUNK));

      if (logError) {
        // Rollback campaign creation if logging fails
        await supabaseAdmin
          .from("newsletter_campaigns")
          .delete()
          .eq("id", campaign.id);
        throw new Error(`Failed to queue recipients: ${logError.message}`);
      }
    }

    // 7. --- Mark the post as having a newsletter sent/scheduled ---
    // Checked (not fire-and-forget): without the stamp, the UI would allow
    // a duplicate schedule. On failure, roll the campaign back so no
    // orphan queued campaign is left behind.
    const { error: stampError } = await supabase
      .from("posts")
      .update({ newsletter_sent_at: new Date().toISOString() })
      .eq("id", postId);

    if (stampError) {
      await supabaseAdmin
        .from("newsletter_campaigns")
        .delete()
        .eq("id", campaign.id);
      throw new Error(`Failed to mark post as scheduled: ${stampError.message}`);
    }

    await auditCampaignAction(
      supabaseAdmin,
      user.id,
      "campaign.schedule",
      campaign.id,
      `Scheduled campaign "${post.title || "Untitled"}" for ${subscribers.length} subscribers (${mode}, ${formatDateMY(targetSchedule)})`
    );

    // 8. --- "Send now": deliver right away instead of waiting for a tick ---
    let message = `Campaign scheduled for ${formatDateMY(targetSchedule)} (${subscribers.length} subscribers).`;
    if (mode === "now") {
      const run = await processNewsletterQueue({
        campaignId: campaign.id,
        timeBudgetMs: INLINE_SEND_BUDGET_MS,
      });
      message = describeInlineRun(run, subscribers.length);
    }

    revalidatePath("/admin/newsletter");
    revalidatePath("/admin/blog");

    return { success: true, message };
  } catch (error: any) {
    console.error("Error scheduling newsletter:", error.message);
    return { success: false, message: error.message };
  }
}

/** Inline "send now" budget — stays well under the 60s function limit. */
const INLINE_SEND_BUDGET_MS = 25_000;

function describeInlineRun(run: QueueRunResult, total: number): string {
  if (!run.success && run.sent === 0) {
    return `Campaign queued, but sending hit an error: ${run.message} It will be retried automatically.`;
  }
  if (run.sent >= total) {
    return `Newsletter sent to all ${run.sent} subscriber(s).`;
  }
  const rest = total - run.sent - run.skipped;
  if (run.quotaExhausted) {
    return `Sent to ${run.sent} subscriber(s) now. Today's newsletter quota is used up, so the remaining ${rest} will go out automatically tomorrow.`;
  }
  return `Sent to ${run.sent} subscriber(s) now; the remaining ${rest} will continue automatically within a few minutes.`;
}

// --- Campaign lifecycle actions (used by /admin/newsletter) ---

export type CampaignActionResult = { success: boolean; message: string };

/**
 * Retry a FAILED campaign: flip its failed rows back to queued and
 * re-open it for the cron. Sent rows are kept (no duplicates).
 */
export async function retryCampaign(
  campaignId: string
): Promise<CampaignActionResult> {
  const { user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
    const { data: campaign, error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("id, status, post_id, subject")
      .eq("id", campaignId)
      .single();

    if (error || !campaign) {
      return { success: false, message: "Campaign not found." };
    }
    if (campaign.status !== "failed") {
      return {
        success: false,
        message: `Only failed campaigns can be retried (this one is ${campaign.status}).`,
      };
    }

    const { error: flipError, count } = await supabaseAdmin
      .from("newsletter_send_log")
      .update({ status: "queued", error_message: null }, { count: "exact" })
      .eq("campaign_id", campaignId)
      .eq("status", "failed");

    if (flipError) {
      return { success: false, message: `Could not requeue: ${flipError.message}` };
    }

    const { error: campaignError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({
        status: "scheduled",
        queued_count: count ?? 0,
        total_failed: 0,
        completed_at: null,
        error_details: null,
      })
      .eq("id", campaignId);

    if (campaignError) {
      return { success: false, message: `Could not reopen: ${campaignError.message}` };
    }

    await auditCampaignAction(
      supabaseAdmin,
      user.id,
      "campaign.retry",
      campaignId,
      `Retried campaign: ${campaign.subject} (${count ?? 0} recipients requeued)`
    );
    revalidatePath("/admin/newsletter");
    revalidatePath(`/admin/newsletter/${campaignId}`);
    return {
      success: true,
      message: `Campaign retried — ${count ?? 0} recipients requeued.`,
    };
  } catch (error: any) {
    console.error("Error retrying campaign:", error?.message);
    return { success: false, message: error?.message || "Retry failed." };
  }
}

/**
 * Cancel a SCHEDULED or IN_PROGRESS campaign. Unsent rows are deleted;
 * already-sent rows stay sent. The post stamp is cleared only when nothing
 * was sent yet (otherwise rescheduling would duplicate mail).
 */
export async function cancelCampaign(
  campaignId: string
): Promise<CampaignActionResult> {
  const { user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
    const { data: campaign, error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("id, status, post_id, subject, sent_count")
      .eq("id", campaignId)
      .single();

    if (error || !campaign) {
      return { success: false, message: "Campaign not found." };
    }
    if (campaign.status !== "scheduled" && campaign.status !== "in_progress") {
      return {
        success: false,
        message: `Only scheduled or sending campaigns can be cancelled (this one is ${campaign.status}).`,
      };
    }

    // Drop everything not yet delivered.
    const { error: deleteError, count: dropped } = await supabaseAdmin
      .from("newsletter_send_log")
      .delete({ count: "exact" })
      .eq("campaign_id", campaignId)
      .in("status", ["queued", "sending"]);

    if (deleteError) {
      return { success: false, message: `Could not cancel: ${deleteError.message}` };
    }

    const { error: campaignError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({ status: "cancelled", queued_count: 0, completed_at: new Date().toISOString() })
      .eq("id", campaignId);

    if (campaignError) {
      return { success: false, message: `Could not cancel: ${campaignError.message}` };
    }

    // Free the post for a future schedule only if nobody was mailed —
    // otherwise a reschedule would re-send to already-mailed recipients.
    let stampNote = "";
    if ((campaign.sent_count || 0) === 0) {
      await supabaseAdmin
        .from("posts")
        .update({ newsletter_sent_at: null })
        .eq("id", campaign.post_id);
      stampNote = " The post can be scheduled again.";
    } else {
      stampNote = ` ${campaign.sent_count} mail(s) already went out and will not be re-sent.`;
    }

    await auditCampaignAction(
      supabaseAdmin,
      user.id,
      "campaign.cancel",
      campaignId,
      `Cancelled campaign: ${campaign.subject} (${dropped ?? 0} unsent rows dropped)`
    );
    revalidatePath("/admin/newsletter");
    revalidatePath(`/admin/newsletter/${campaignId}`);
    return {
      success: true,
      message: `Campaign cancelled.${stampNote}`,
    };
  } catch (error: any) {
    console.error("Error cancelling campaign:", error?.message);
    return { success: false, message: error?.message || "Cancel failed." };
  }
}

/**
 * Delete a campaign and its logs (FK cascade). In-flight campaigns must be
 * cancelled first — deleting mid-tick can't recall already-fetched sends.
 * The post stamp is cleared for anything not completed, so a replacement
 * send remains possible.
 */
export async function deleteCampaign(
  campaignId: string
): Promise<CampaignActionResult> {
  const { user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
    const { data: campaign, error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("id, status, post_id, subject")
      .eq("id", campaignId)
      .single();

    if (error || !campaign) {
      return { success: false, message: "Campaign not found." };
    }
    if (campaign.status === "in_progress") {
      return {
        success: false,
        message: "Cancel a sending campaign before deleting it.",
      };
    }

    const { error: deleteError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .delete()
      .eq("id", campaignId);

    if (deleteError) {
      return { success: false, message: `Could not delete: ${deleteError.message}` };
    }

    if (campaign.status !== "completed") {
      await supabaseAdmin
        .from("posts")
        .update({ newsletter_sent_at: null })
        .eq("id", campaign.post_id);
    }

    await auditCampaignAction(
      supabaseAdmin,
      user.id,
      "campaign.delete",
      campaignId,
      `Deleted campaign: ${campaign.subject} (was ${campaign.status})`
    );
    revalidatePath("/admin/newsletter");
    return { success: true, message: "Campaign deleted." };
  } catch (error: any) {
    console.error("Error deleting campaign:", error?.message);
    return { success: false, message: error?.message || "Delete failed." };
  }
}

/**
 * Reschedule a SCHEDULED campaign to a new date and time.
 */
export async function updateCampaignSchedule(
  campaignId: string,
  newScheduledAt: string
): Promise<CampaignActionResult> {
  const { user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
    const { data: campaign, error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("id, status, subject, post_id")
      .eq("id", campaignId)
      .single();

    if (error || !campaign) {
      return { success: false, message: "Campaign not found." };
    }
    if (campaign.status !== "scheduled") {
      return {
        success: false,
        message: `Only scheduled campaigns can be rescheduled (current status is ${campaign.status}).`,
      };
    }

    const parsed = new Date(newScheduledAt);
    if (isNaN(parsed.getTime())) {
      return { success: false, message: "Invalid scheduled date/time." };
    }
    const isoDate = parsed.toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({ scheduled_at: isoDate })
      .eq("id", campaignId);

    if (updateError) {
      return {
        success: false,
        message: `Could not update schedule: ${updateError.message}`,
      };
    }

    await auditCampaignAction(
      supabaseAdmin,
      user.id,
      "campaign.reschedule",
      campaignId,
      `Rescheduled campaign "${campaign.subject}" to ${formatDateMY(isoDate)}`
    );

    revalidatePath("/admin/newsletter");
    revalidatePath(`/admin/newsletter/${campaignId}`);
    return {
      success: true,
      message: `Campaign rescheduled to ${formatDateMY(isoDate)}.`,
    };
  } catch (err: any) {
    console.error("Error rescheduling campaign:", err?.message);
    return { success: false, message: err?.message || "Reschedule failed." };
  }
}

/**
 * Send a SCHEDULED campaign immediately without waiting for scheduled time.
 */
export async function sendCampaignNow(
  campaignId: string
): Promise<CampaignActionResult> {
  const { user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
    const { data: campaign, error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("id, status, subject, total_recipients")
      .eq("id", campaignId)
      .single();

    if (error || !campaign) {
      return { success: false, message: "Campaign not found." };
    }
    if (campaign.status !== "scheduled") {
      return {
        success: false,
        message: `Only scheduled campaigns can be triggered now (current status is ${campaign.status}).`,
      };
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({ scheduled_at: nowIso })
      .eq("id", campaignId);

    if (updateError) {
      return {
        success: false,
        message: `Could not update campaign: ${updateError.message}`,
      };
    }

    await auditCampaignAction(
      supabaseAdmin,
      user.id,
      "campaign.send_now",
      campaignId,
      `Triggered immediate send for campaign "${campaign.subject}"`
    );

    // Awaited on purpose: a fire-and-forget promise is killed as soon as
    // the serverless function returns, which is why "Send now" used to
    // wait for the next daily cron.
    const run = await processNewsletterQueue({
      campaignId,
      timeBudgetMs: INLINE_SEND_BUDGET_MS,
    });

    revalidatePath("/admin/newsletter");
    revalidatePath(`/admin/newsletter/${campaignId}`);
    return {
      success: run.success || run.sent > 0,
      message: describeInlineRun(run, campaign.total_recipients ?? run.sent),
    };
  } catch (err: any) {
    console.error("Error sending campaign now:", err?.message);
    return { success: false, message: err?.message || "Send failed." };
  }
}