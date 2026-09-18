"use server";

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

// NEW: Helper to fetch system setting safely
async function getSystemSetting(supabase: any, key: string, fallback: string) {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (!data?.value) return fallback;

  try {
    // Settings are often stored as JSON strings
    const parsed = JSON.parse(data.value);
    return typeof parsed === "string" ? parsed : fallback;
  } catch {
    return data.value || fallback;
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

    return {
      success: true,
      adminEmail: configuredAdminEmail, // Uses value from settings
      postTitle: post.title || "Untitled Post",
      postPreview: postPreview,
      postImage: post.featured_image,
      subscriberCount: count || 0,
    };
  } catch (error: any) {
    console.error("Error in getNewsletterModalData:", error.message);
    return { success: false, message: error.message };
  }
}

export async function sendTestNewsletter(postId: string, testEmail: string) {
  const supabase = await createClient();
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
    const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=test-token`;

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

    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error sending test newsletter:", error.message);
    return { success: false, message: error.message };
  }
}

export async function scheduleNewsletter(postId: string) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  try {
    // 1. --- Authorization ---
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
      throw new Error(
        `Failed to create campaign log: ${campaignError?.message}`
      );
    }

    // 6. --- Create 'queued' entries for all subscribers ---
    const logEntries = subscribers.map((sub) => ({
      campaign_id: campaign.id,
      subscriber_id: sub.id,
      email: sub.email,
      status: "queued",
    }));

    if (logEntries.length > 0) {
      const { error: logError } = await supabaseAdmin
        .from("newsletter_send_log")
        .insert(logEntries);

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
    await supabase
      .from("posts")
      .update({ newsletter_sent_at: new Date().toISOString() })
      .eq("id", postId);

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
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select(
        "id, post_id, subject, preview_text, status, scheduled_at, total_recipients, sent_count, queued_count, total_failed"
      )
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .single();

    if (campaignError || !campaign) {
      console.log("CRON: No campaigns to process.");
      return { success: true, message: "No campaigns to process." };
    }

    if (campaign.status === "scheduled") {
      await supabaseAdmin
        .from("newsletter_campaigns")
        .update({ status: "in_progress" })
        .eq("id", campaign.id);
    }

    // 3. --- Get Post and Subscribers Batch ---
    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .select("title, featured_image, slug, category")
      .eq("id", campaign.post_id)
      .single();

    if (postError || !post) {
      throw new Error(`Post ${campaign.post_id} not found for campaign.`);
    }

    // Small per-run batch: fits Vercel free 10s timeout + Resend free
    // 100/day. Cron runs hourly; each tick sends at most BATCH_SIZE.
    const BATCH_SIZE = 25;
    const batchLimit = Math.min(remaining_quota, BATCH_SIZE);

    const { data: batch, error: batchError } = await supabaseAdmin
      .from("newsletter_send_log")
      .select("id, email, subscriber_id")
      .eq("campaign_id", campaign.id)
      .eq("status", "queued")
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
        .eq("id", campaign.id);
      console.log(`CRON: Campaign ${campaign.id} completed.`);
      return { success: true, message: "Campaign completed." };
    }

    console.log(
      `CRON: Found campaign ${campaign.id}. Sending to ${batch.length} recipients...`
    );

    // 4. --- Prepare and Send Batch ---
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";
    const postPath =
      post.category === "blog"
        ? "resources/blog-articles"
        : "company/developments";
    const readMoreUrl = `${siteUrl}/${postPath}/${post.slug}`;

    // Bulk-fetch unsubscribe tokens (1 query instead of N).
    const subscriberIds = [...new Set(batch.map((r) => r.subscriber_id))];
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, unsubscribe_token")
      .in("id", subscriberIds);

    if (tokenError) throw new Error("Failed to fetch unsubscribe tokens.");

    const tokenBySubscriberId = new Map(
      (tokenRows || []).map((s) => [s.id, s.unsubscribe_token])
    );

    const sendPromises = batch.map(async (recipient) => {
      const unsubscribeToken = tokenBySubscriberId.get(
        recipient.subscriber_id
      );

      if (!unsubscribeToken) {
        console.error(`CRON: Skipping ${recipient.email}, no unsubscribe token found.`);
        return Promise.reject({
          message: "Unsubscribe token not found",
          log_id: recipient.id,
        });
      }

      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?id=${unsubscribeToken}`;

      return resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: [recipient.email],
        subject: campaign.subject,
        html: postNewsletterTemplate({
          postTitle: campaign.subject,
          postPreviewText: campaign.preview_text || "Read the full article...",
          postImageUrl: post.featured_image,
          readMoreUrl: readMoreUrl,
          unsubscribeUrl: unsubscribeUrl,
        }),
      }).then(response => ({
        ...response,
        log_id: recipient.id,
      }));
    });

    const results = await Promise.allSettled(sendPromises);

    // 5. --- Log Results ---
    let successfulSends = 0;
    let failedSends = 0;
    const updateLogPromises: Promise<any>[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled' && !result.value.error) {
        successfulSends++;
        updateLogPromises.push(
          (async () => {
            return supabaseAdmin
              .from("newsletter_send_log")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
              })
              .eq("id", result.value.log_id)
              .select();
          })()
        );
      } else {
        failedSends++;
        const error = (result as any).reason || (result as any).value?.error;
        const logId = (result as any).reason?.log_id || (result as any).value?.log_id;

        updateLogPromises.push(
          (async () => {
            return supabaseAdmin
              .from("newsletter_send_log")
              .update({
                status: "failed",
                error_message: error?.message || "Send failed",
              })
              .eq("id", logId)
              .select();
          })()
        );
      }
    });

    await Promise.all(updateLogPromises);
    console.log(
      `CRON: Batch complete. Success: ${successfulSends}, Failed: ${failedSends}`
    );

    // 6. --- Update Campaign Counters ---
    const newQueuedCount = Math.max(0, (campaign.queued_count || 0) - batch.length);
    const newSentCount = (campaign.sent_count || 0) + successfulSends;
    const newFailedCount = (campaign.total_failed || 0) + failedSends;
    
    await supabaseAdmin
      .from("newsletter_campaigns")
      .update({
        sent_count: newSentCount,
        queued_count: newQueuedCount,
        total_failed: newFailedCount,
        status: newQueuedCount === 0 ? "completed" : "in_progress",
        completed_at: newQueuedCount === 0 ? new Date().toISOString() : null,
      })
      .eq("id", campaign.id);

    return {
      success: true,
      message: `Batch processed. Sent: ${successfulSends}, Failed: ${failedSends}.`,
    };
  } catch (error: any) {
    console.error("CRON: Error processing queue:", error.message);
    const campaignId = (error as any).campaign_id;
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