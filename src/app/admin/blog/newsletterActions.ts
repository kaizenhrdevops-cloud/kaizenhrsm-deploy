"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { Database } from "@/types/supabase";
import { getServiceClient } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { postNewsletterTemplate } from "@/lib/email-templates/post-newsletter-template";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

    return {
      success: true,
      adminEmail: configuredAdminEmail, // Uses value from settings
      postTitle: post.title || "Untitled Post",
      postPreview: postPreview,
      postImage: post.featured_image,
      subscriberCount: count || 0,
      dailyQuota,
    };
  } catch (error: any) {
    console.error("Error in getNewsletterModalData:", error.message);
    return { success: false, message: error.message };
  }
}

export async function sendTestNewsletter(postId: string, testEmail: string) {
  const { supabase } = await requireNewsletterAdmin();
  try {
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("title, excerpt, featured_image, slug, category")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      throw new Error("Post not found.");
    }

    const { data: postBlocks, error: blocksError } = await supabase
      .from("post_blocks")
      .select("type, content")
      .eq("post_id", postId)
      .order("order_index", { ascending: true });

    if (blocksError) {
      throw new Error("Could not fetch post content.");
    }

    const postPreview =
      post.excerpt ||
      generatePreviewFromBlocks(postBlocks) ||
      "Read the full article on our website.";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";
    const postPath =
      post.category === "blog"
        ? "resources/blog-articles"
        : "company/developments";
    const readMoreUrl = `${siteUrl}/${postPath}/${post.slug}`;
    // Use a real subscriber token when one exists so the test mail carries
    // a working unsubscribe link (it lands on the confirm screen — safe to
    // click). Falls back to the plain page when the list is empty.
    const { data: sampleSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("unsubscribe_token")
      .eq("status", "subscribed")
      .limit(1)
      .single();
    const unsubscribeUrl = sampleSubscriber?.unsubscribe_token
      ? `${siteUrl}/api/newsletter/unsubscribe?id=${sampleSubscriber.unsubscribe_token}`
      : `${siteUrl}/newsletter/unsubscribe`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [testEmail], // Uses the email passed from the modal
      subject: `[TEST] ${post.title}`,
      html: postNewsletterTemplate({
        postTitle: post.title || "Untitled Post",
        postPreviewText: postPreview,
        postImageUrl: post.featured_image,
        readMoreUrl: readMoreUrl,
        unsubscribeUrl: unsubscribeUrl,
      }),
    });

    // Log test sends like any other send so the daily quota math sees them.
    // (Previously test mail consumed Resend quota invisibly.)
    const supabaseAdmin = await createAdminClient();
    if (error) {
      await supabaseAdmin.from("email_send_log").insert({
        email_type: "newsletter_test",
        status: "failed",
        error_message: error.message,
      });
      throw new Error(friendlyResendError(error.message));
    }
    await supabaseAdmin.from("email_send_log").insert({
      email_type: "newsletter_test",
      status: "sent",
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error sending test newsletter:", error.message);
    return { success: false, message: error.message };
  }
}

export async function scheduleNewsletter(postId: string) {
  const { supabase, user } = await requireNewsletterAdmin();
  const supabaseAdmin = await createAdminClient();

  try {
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
        scheduled_at: new Date().toISOString(),
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

    if (logEntries.length > 0) {
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

    return {
      success: true,
      message: `Campaign scheduled for ${subscribers.length} subscribers!`,
    };
  } catch (error: any) {
    console.error("Error scheduling newsletter:", error.message);
    return { success: false, message: error.message };
  }
}

export async function processNewsletterQueue() {
  console.log("CRON: processNewsletterQueue started...");
  const supabaseAdmin = await createAdminClient();
  // Available to the catch block (fixes dead error.campaign_id handling).
  let campaignId: string | null = null;

  try {
    // 1. --- Get Remaining Quota ---
    const { data: quota, error: rpcError } = await supabaseAdmin.rpc(
      "get_remaining_daily_email_quota"
    );

    if (rpcError) throw new Error(`Failed to get quota: ${rpcError.message}`);

    const remaining_quota = quota as number;
    console.log(`CRON: Remaining daily quota: ${remaining_quota}`);

    if (remaining_quota <= 0) {
      console.log("CRON: No quota remaining. Exiting.");
      return { success: true, message: "No quota remaining." };
    }

    // 2. --- Find a Campaign to Process ---
    const { data: activeCampaign, error: activeCampaignError } =
      await supabaseAdmin
        .from("newsletter_campaigns")
        .select(
          "id, post_id, subject, preview_text, status, scheduled_at, total_recipients, sent_count, queued_count, total_failed"
        )
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .single();

    if (activeCampaignError || !activeCampaign) {
      console.log("CRON: No campaigns to process.");
      return { success: true, message: "No campaigns to process." };
    }
    campaignId = activeCampaign.id;

    if (activeCampaign.status === "scheduled") {
      await supabaseAdmin
        .from("newsletter_campaigns")
        .update({ status: "in_progress" })
        .eq("id", campaignId);
    }

    // 3. --- Get Post and Subscribers Batch ---
    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .select("title, featured_image, slug, category")
      .eq("id", activeCampaign.post_id)
      .single();

    if (postError || !post) {
      throw new Error(`Post ${activeCampaign.post_id} not found for campaign.`);
    }

    // Small per-run batch for free-tier limits:
    // - Vercel Hobby: 10s serverless timeout
    // - Resend free: ~2 API requests/second → sequential sends paced 600ms
    //   (≈6-7s per tick). Cron runs hourly; each tick sends at most BATCH_SIZE.
    const BATCH_SIZE = 10;
    const SEND_PACING_MS = 600;
    const batchLimit = Math.min(remaining_quota, BATCH_SIZE);

    // FIFO order (deterministic) + stale `sending` rows from an interrupted
    // tick are retried here instead of getting stuck forever.
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("newsletter_send_log")
      .select("id, email, subscriber_id")
      .eq("campaign_id", campaignId)
      .in("status", ["queued", "sending"])
      .order("created_at", { ascending: true })
      .limit(batchLimit);

    if (batchError) throw new Error("Failed to fetch recipient batch.");

    if (!batch || batch.length === 0) {
      await supabaseAdmin
        .from("newsletter_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          queued_count: 0,
        })
        .eq("id", campaignId);
      console.log(`CRON: Campaign ${campaignId} completed.`);
      return { success: true, message: "Campaign completed." };
    }

    // Claim the batch so an overlapping tick can't double-send the same rows.
    await supabaseAdmin
      .from("newsletter_send_log")
      .update({ status: "sending" })
      .eq("campaign_id", campaignId)
      .in(
        "id",
        batch.map((r) => r.id)
      );

    console.log(
      `CRON: Found campaign ${campaignId}. Sending to ${batch.length} recipients...`
    );

    // 4. --- Prepare and Send Batch ---
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";
    const postPath =
      post.category === "blog"
        ? "resources/blog-articles"
        : "company/developments";
    const readMoreUrl = `${siteUrl}/${postPath}/${post.slug}`;

    // Bulk-fetch unsubscribe tokens + current status (1 query instead of N).
    // Status is re-checked here so anyone who unsubscribed after scheduling
    // is skipped instead of emailed.
    const subscriberIds = [...new Set(batch.map((r) => r.subscriber_id))];
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, status, unsubscribe_token")
      .in("id", subscriberIds);

    if (tokenError) throw new Error("Failed to fetch unsubscribe tokens.");

    const subscriberById = new Map(
      (tokenRows || []).map((s) => [s.id, s])
    );

    type SendOutcome = {
      log_id: string;
      outcome: "sent" | "failed" | "skipped" | "retryable";
      error?: string;
    };
    const outcomes: SendOutcome[] = [];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < batch.length; i++) {
      const recipient = batch[i];
      const subscriber = subscriberById.get(recipient.subscriber_id);

      if (!subscriber || subscriber.status !== "subscribed") {
        // Unsubscribed/deleted after scheduling: drop the row, don't count
        // it as a failure.
        await supabaseAdmin
          .from("newsletter_send_log")
          .delete()
          .eq("id", recipient.id);
        outcomes.push({ log_id: recipient.id, outcome: "skipped" });
        continue;
      }

      if (!subscriber.unsubscribe_token) {
        console.error(
          `CRON: Skipping ${recipient.email}, no unsubscribe token found.`
        );
        outcomes.push({
          log_id: recipient.id,
          outcome: "failed",
          error: "Unsubscribe token not found",
        });
        continue;
      }

      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?id=${subscriber.unsubscribe_token}`;

      try {
        const { error: sendError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: [recipient.email],
          subject: activeCampaign.subject,
          html: postNewsletterTemplate({
            postTitle: activeCampaign.subject,
            postPreviewText: activeCampaign.preview_text || "Read the full article...",
            postImageUrl: post.featured_image,
            readMoreUrl: readMoreUrl,
            unsubscribeUrl: unsubscribeUrl,
          }),
        });

        if (sendError) {
          const msg =
            (sendError as { message?: string })?.message || "Send failed";
          const retryable = isRetryableSendError(sendError);
          outcomes.push({
            log_id: recipient.id,
            outcome: retryable ? "retryable" : "failed",
            error: msg,
          });
        } else {
          outcomes.push({ log_id: recipient.id, outcome: "sent" });
        }
      } catch (err: any) {
        outcomes.push({
          log_id: recipient.id,
          outcome: "failed",
          error: err?.message || "Send failed",
        });
      }

      // Resend free ≈ 2 req/s — never burst.
      if (i < batch.length - 1) await sleep(SEND_PACING_MS);
    }

    // 5. --- Log Results ---
    // Individual update failures must not abort the rest: settle everything,
    // then update counters regardless.
    const logUpdates = outcomes.map((o) => {
      if (o.outcome === "sent") {
        return supabaseAdmin
          .from("newsletter_send_log")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", o.log_id);
      }
      if (o.outcome === "failed") {
        return supabaseAdmin
          .from("newsletter_send_log")
          .update({ status: "failed", error_message: o.error || "Send failed" })
          .eq("id", o.log_id);
      }
      // skipped rows were already deleted; retryable rows stay `sending`
      // for the next tick.
      return Promise.resolve(null);
    });

    const settled = await Promise.allSettled(logUpdates);
    settled.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `CRON: Failed to update send-log row ${outcomes[i].log_id}:`,
          r.reason
        );
      }
    });

    const successfulSends = outcomes.filter((o) => o.outcome === "sent").length;
    const failedSends = outcomes.filter((o) => o.outcome === "failed").length;
    const skippedSends = outcomes.filter((o) => o.outcome === "skipped").length;
    const retryableSends = outcomes.filter(
      (o) => o.outcome === "retryable"
    ).length;
    console.log(
      `CRON: Batch complete. Success: ${successfulSends}, Failed: ${failedSends}, Skipped: ${skippedSends}, Retryable: ${retryableSends}.`
    );

    // 6. --- Update Campaign Counters ---
    // Resolved rows (sent/failed/skipped) leave the queue; retryable rows
    // stay `sending` and keep queued_count above zero.
    const resolvedCount = successfulSends + failedSends + skippedSends;
    const newQueuedCount = Math.max(
      0,
      (activeCampaign.queued_count || 0) - resolvedCount
    );
    const newSentCount = (activeCampaign.sent_count || 0) + successfulSends;
    const newFailedCount = (activeCampaign.total_failed || 0) + failedSends;

    try {
      await supabaseAdmin
        .from("newsletter_campaigns")
        .update({
          sent_count: newSentCount,
          queued_count: newQueuedCount,
          total_failed: newFailedCount,
          status: newQueuedCount === 0 ? "completed" : "in_progress",
          completed_at: newQueuedCount === 0 ? new Date().toISOString() : null,
        })
        .eq("id", campaignId);
    } catch (counterError: any) {
      // Sends already happened — never fail the tick over counters.
      console.error("CRON: Failed to update campaign counters:", counterError);
    }

    return {
      success: true,
      message: `Batch processed. Sent: ${successfulSends}, Failed: ${failedSends}, Skipped: ${skippedSends}, Retry later: ${retryableSends}.`,
    };
  } catch (error: any) {
    console.error("CRON: Error processing queue:", error.message);
    if (campaignId) {
      await supabaseAdmin
        .from("newsletter_campaigns")
        .update({
          status: "failed",
          error_details: { error: error.message },
        })
        .eq("id", campaignId);
    }
    return { success: false, message: error.message };
  }
}

/**
 * Resend's free tier without a verified domain rejects any recipient except
 * the account owner's address with a "testing emails ... verify a domain"
 * error. Surface that as an actionable message instead of raw provider text.
 */
function friendlyResendError(message: string): string {
  if (/testing emails|verify a domain/i.test(message)) {
    return (
      "Resend refused the recipient: on the free tier without a verified " +
      "domain, mail can only go to your Resend account email. Set Admin " +
      "notification email (Admin → Settings) to that address for testing, " +
      "or verify a domain in Resend. " +
      `Provider said: ${message}`
    );
  }
  return message;
}

/** Rate-limit / transient errors are worth retrying next tick. */function isRetryableSendError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number } | null)?.statusCode;
  if (statusCode === 429 || (statusCode != null && statusCode >= 500)) return true;
  const message = (
    (error as { message?: unknown } | null)?.message ?? ""
  ).toString();
  return /rate limit|too many requests|429|temporar|timeout|network|fetch failed/i.test(
    message
  );
}

// --- Campaign lifecycle actions (used by /admin/newsletter) ---

type CampaignActionResult = { success: boolean; message: string };

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