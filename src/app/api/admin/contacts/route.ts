// src/app/api/admin/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/api-auth";

const supabaseAdmin = getServiceClient();

// Shared admin auth check (see src/lib/api-auth.ts)
async function getAuthUser(req: NextRequest) {
  return requireAdmin(req);
}

// GET - Fetch all contacts
export async function GET(req: NextRequest) {
  try {
    const authData = await getAuthUser(req);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contacts, error } = await supabaseAdmin
      .from("contacts")
      .select(
        "id, full_name, contact_number, company, business_email, company_size, message, status, created_at, updated_at, last_reply_at, is_starred"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    console.error("Contacts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a contact (super_admin only)
export async function DELETE(req: NextRequest) {
  try {
    const authData = await getAuthUser(req);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authData.profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can delete contacts" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // --- (FIXED) ADD AUDIT LOG ---
    // Get full contact details *before* deleting for a better log message
    const { data: contactToLog } = await supabaseAdmin
      .from("contacts")
      .select("full_name, business_email, company") // Get all the details
      .eq("id", id)
      .single();
    // --- END LOG ---

    const { error } = await supabaseAdmin
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting contact:", error);
      return NextResponse.json(
        { error: "Failed to delete contact" },
        { status: 500 }
      );
    }

    // --- (FIXED) ADD AUDIT LOG ---
    // Create the new descriptive message
    const message = `Deleted contact: ${contactToLog?.full_name || "Unknown"} from ${contactToLog?.company || "Unknown"} (${contactToLog?.business_email || id})`;

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: authData.user.id,
      action: "contact.delete",
      details: {
        message: message, // Use the new descriptive message
        contact_id: id,
        deleted_name: contactToLog?.full_name,
        deleted_email: contactToLog?.business_email,
        deleted_company: contactToLog?.company,
      },
    });
    // --- END LOG ---

    return NextResponse.json(
      { message: "Contact deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}