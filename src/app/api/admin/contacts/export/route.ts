// src/app/api/admin/contacts/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/api-auth";

const supabaseAdmin = getServiceClient();

// Shared admin auth check (see src/lib/api-auth.ts)
async function getAuthUser(req: NextRequest) {
  return requireAdmin(req);
}

// Convert data to CSV
function convertToCSV(contacts: any[]) {
  if (contacts.length === 0) return "";

  // Define CSV headers
  const headers = [
    "ID",
    "Full Name",
    "Email",
    "Contact Number",
    "Company",
    "Company Size",
    "Message",
    "Status",
    "Created At",
    "Reply Note",
    "Replied At",
    "Replied By",
  ];

  // Create CSV rows
  const rows = contacts.map((contact) => {
    return [
      contact.id,
      `"${contact.full_name.replace(/"/g, '""')}"`, // Escape quotes
      contact.business_email,
      contact.contact_number,
      `"${contact.company.replace(/"/g, '""')}"`,
      contact.company_size,
      `"${(contact.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`, // Escape and remove newlines
      contact.status,
      new Date(contact.created_at).toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
      }),
      contact.reply_note
        ? `"${contact.reply_note.replace(/"/g, '""').replace(/\n/g, " ")}"`
        : "",
      contact.replied_at
        ? new Date(contact.replied_at).toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
          })
        : "",
      contact.profiles?.full_name || "",
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

export async function GET(req: NextRequest) {
  try {
    const authData = await getAuthUser(req);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all contacts
    const { data: contacts, error } = await supabaseAdmin
      .from("contacts")
      .select(
        `
        *,
        profiles:replied_by (
          full_name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    // Convert to CSV
    const csv = convertToCSV(contacts || []);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `contacts-export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export contacts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
