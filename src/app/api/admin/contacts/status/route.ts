// src/app/api/admin/contacts/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/api-auth";

const supabaseAdmin = getServiceClient();

// Shared admin auth check (see src/lib/api-auth.ts)
async function getAuthUser(req: NextRequest) {
  return requireAdmin(req);
}

// PATCH - Update contact status
export async function PATCH(req: NextRequest) {
  try {
    const authData = await getAuthUser(req);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contactId, status } = body;

    if (!contactId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validStatuses = ["new", "contacted", "replied", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get old status for the log message
    const { data: oldContact } = await supabaseAdmin
      .from("contacts")
      .select("status, full_name")
      .eq("id", contactId)
      .single();

    // Update status
    const { error } = await supabaseAdmin
      .from("contacts")
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: authData.user.id,
      })
      .eq("id", contactId);

    if (error) {
      console.error("Error updating status:", error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    // --- (FIXED) ADD AUDIT LOG ---
    if (oldContact?.status !== status) {
      await supabaseAdmin.from("admin_audit_log").insert({
        admin_id: authData.user.id,
        action: "contact.status_change",
        details: {
          message: `Changed ${oldContact?.full_name || "contact"}'s status from '${
            oldContact?.status
          }' to '${status}'`,
          contact_id: contactId,
          old_status: oldContact?.status,
          new_status: status,
        },
      });
    }
    // --- END LOG ---

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}