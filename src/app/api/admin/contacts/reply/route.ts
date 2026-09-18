// src/app/api/admin/contacts/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { Resend } from "resend";
import {
  replyEmailTemplate,
  type ReplyEmailData,
} from "@/lib/email-templates/reply-template";

const supabaseAdmin = getServiceClient();

const resend = new Resend(process.env.RESEND_API_KEY);

// Shared admin auth check (see src/lib/api-auth.ts)
async function getAuthUser(req: NextRequest) {
  return requireAdmin(req);
}


// POST - Send reply
export async function POST(req: NextRequest) {
  try {
    const authData = await getAuthUser(req);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authData.profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can send replies" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { contactId, replyMessage, replyMethod } = body;

    if (!contactId || !replyMessage || !replyMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .select("id, full_name, company, business_email, message")
      .eq("id", contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Insert reply into contact_replies table
    const { data: reply, error: replyError } = await supabaseAdmin
      .from("contact_replies")
      .insert({
        contact_id: contactId,
        reply_message: replyMessage,
        reply_method: replyMethod,
        replied_by: authData.user.id,
      })
      .select()
      .single();

    if (replyError) {
      console.error("Error saving reply:", replyError);
      return NextResponse.json(
        { error: "Failed to save reply" },
        { status: 500 }
      );
    }

    // ... (Audit log logic remains) ...
    const message = `Replied to contact: ${contact.full_name} from ${contact.company} (${contact.business_email})`;
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: authData.user.id,
      action: "contact.reply",
      details: {
        message: message,
        contact_id: contactId,
        contact_name: contact.full_name,
        contact_email: contact.business_email,
        contact_company: contact.company,
        reply_method: replyMethod,
      },
    });

    // If in-app method, send email
    if (replyMethod === "in_app") {
      // --- ✅ ADDED: Log this email send ---
      let logStatus: "sent" | "failed" = "sent";
      let logError: string | null = null;
      // --- End of Log Init ---

      try {
        const emailData: ReplyEmailData = {
          contactName: contact.full_name,
          contactEmail: contact.business_email,
          replyMessage: replyMessage,
          adminName: authData.profile.full_name || "KaizenHR Team",
          originalMessage: contact.message || "No message provided.",
        };

        const recipientEmail = contact.business_email;

        const { error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: recipientEmail,
          subject: `Re: Your KaizenHR Inquiry`,
          html: replyEmailTemplate(emailData),
        });

        if (emailError) {
          console.error("Resend Error:", emailError);
          logStatus = "failed"; // Mark for logging
          logError = (emailError as Error).message; // Mark for logging
        } else {
          console.log("Reply email sent successfully to:", recipientEmail);
        }
      } catch (emailError) {
        console.error("Error sending reply email:", emailError);
        logStatus = "failed";
        logError = (emailError as Error).message;
      }

      // --- ✅ ADDED: Save the log entry ---
      await supabaseAdmin.from("email_send_log").insert({
        email_type: "contact_reply",
        status: logStatus,
        error_message: logError,
      });
      // --- End of Log Save ---
    }

    return NextResponse.json(
      {
        success: true,
        message: "Reply sent successfully",
        data: reply,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reply API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ... (GET function remains unchanged) ...
export async function GET(req: NextRequest) {
  try {
    const authData = await getAuthUser(req);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const { data: replies, error } = await supabaseAdmin
      .from("contact_replies")
      .select(
        `
        *,
        profiles:replied_by (
          full_name,
          email
        )
      `
      )
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ replies }, { status: 200 });
  } catch (error) {
    console.error("Fetch replies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}