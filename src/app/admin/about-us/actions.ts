// src/app/admin/about-us/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/server";
import { getServiceClient } from "@/lib/supabase-admin";
import { PUBLIC_PAGES_TAG } from "@/lib/cache-tags";
import {
  DEFAULT_ABOUT_SEO,
  DEFAULT_ABOUT_US_DOC,
  normalizeFreeformDocument,
  type FreeformDocument,
  type PageSeoMetadata,
} from "@/data/about-us-defaults";
import type { Json } from "@/types/supabase";

const ABOUT_SLUG = "about-us";

export type AboutPageRevisionSummary = {
  id: string;
  revision_number: number;
  change_summary: string | null;
  created_at: string | null;
  created_by_name: string | null;
};

export type AboutPageAdminData = {
  draftDoc: FreeformDocument;
  publishedDoc: FreeformDocument;
  draftSeo: PageSeoMetadata;
  publishedSeo: PageSeoMetadata;
  status: "draft" | "published";
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  lastAutosavedAt: string | null;
  revisions: AboutPageRevisionSummary[];
};

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null as null, error: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.status !== "active" ||
    profile.role !== "super_admin"
  ) {
    return {
      user: null as null,
      error: "Access denied. Active super admin role required.",
    };
  }

  return { user, error: null };
}

async function logAudit(
  adminId: string,
  action: string,
  details: { [key: string]: Json | undefined }
) {
  try {
    const adminClient = getServiceClient();
    await adminClient.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      details,
    });
  } catch (err) {
    console.error("Failed to log about-us audit entry:", err);
  }
}

function revalidateAboutPage() {
  revalidateTag(PUBLIC_PAGES_TAG);
  revalidatePath("/company/about-us");
  revalidatePath("/admin/about-us");
}

async function loadRevisions(): Promise<AboutPageRevisionSummary[]> {
  const adminClient = getServiceClient();
  const { data } = await adminClient
    .from("site_page_revisions")
    .select("id, revision_number, change_summary, created_at, created_by")
    .eq("page_slug", ABOUT_SLUG)
    .order("revision_number", { ascending: false })
    .limit(20);

  const rows = data ?? [];
  const creatorIds = Array.from(
    new Set(
      rows
        .map((r) => r.created_by)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const nameMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", creatorIds);
    (profiles ?? []).forEach((p) => {
      nameMap.set(p.id, p.full_name || p.email);
    });
  }

  return rows.map((r) => ({
    id: r.id,
    revision_number: r.revision_number,
    change_summary: r.change_summary,
    created_at: r.created_at,
    created_by_name: r.created_by ? nameMap.get(r.created_by) ?? null : null,
  }));
}

export async function getAboutPageAdmin(): Promise<{
  success: boolean;
  data: AboutPageAdminData | null;
  message: string;
  migrationMissing?: boolean;
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) {
    return { success: false, data: null, message: error || "Unauthorized" };
  }

  const adminClient = getServiceClient();
  const { data: existing, error: fetchError } = await adminClient
    .from("site_pages")
    .select("*")
    .eq("slug", ABOUT_SLUG)
    .maybeSingle();

  if (fetchError) {
    const missing =
      fetchError.code === "42P01" ||
      /relation .*site_pages.* does not exist/i.test(fetchError.message) ||
      /could not find the table .*site_pages/i.test(fetchError.message);

    return {
      success: false,
      data: null,
      message: fetchError.message,
      migrationMissing: missing,
    };
  }

  let row = existing;

  // Auto-seed the canonical About Us page on first open
  if (!row) {
    const seedJson = DEFAULT_ABOUT_US_DOC as unknown as Json;
    const { data: inserted, error: insertError } = await adminClient
      .from("site_pages")
      .insert({
        slug: ABOUT_SLUG,
        title: "About Us",
        status: "published",
        published_doc: seedJson,
        draft_doc: seedJson,
        has_unpublished_changes: false,
        seo_meta_title: DEFAULT_ABOUT_SEO.metaTitle,
        seo_meta_description: DEFAULT_ABOUT_SEO.metaDescription,
        seo_og_image: DEFAULT_ABOUT_SEO.ogImage,
        draft_seo_meta_title: DEFAULT_ABOUT_SEO.metaTitle,
        draft_seo_meta_description: DEFAULT_ABOUT_SEO.metaDescription,
        draft_seo_og_image: DEFAULT_ABOUT_SEO.ogImage,
        updated_by: user.id,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      return {
        success: false,
        data: null,
        message: insertError?.message || "Failed to initialize About Us page.",
      };
    }
    row = inserted;
  }

  const revisions = await loadRevisions();

  return {
    success: true,
    message: "ok",
    data: {
      draftDoc: normalizeFreeformDocument(row.draft_doc),
      publishedDoc: normalizeFreeformDocument(row.published_doc),
      draftSeo: {
        metaTitle:
          row.draft_seo_meta_title ??
          row.seo_meta_title ??
          DEFAULT_ABOUT_SEO.metaTitle,
        metaDescription:
          row.draft_seo_meta_description ??
          row.seo_meta_description ??
          DEFAULT_ABOUT_SEO.metaDescription,
        ogImage:
          row.draft_seo_og_image ??
          row.seo_og_image ??
          DEFAULT_ABOUT_SEO.ogImage,
      },
      publishedSeo: {
        metaTitle: row.seo_meta_title ?? DEFAULT_ABOUT_SEO.metaTitle,
        metaDescription:
          row.seo_meta_description ?? DEFAULT_ABOUT_SEO.metaDescription,
        ogImage: row.seo_og_image ?? DEFAULT_ABOUT_SEO.ogImage,
      },
      status: row.status === "draft" ? "draft" : "published",
      hasUnpublishedChanges: row.has_unpublished_changes,
      publishedAt: row.published_at,
      lastAutosavedAt: row.last_autosaved_at,
      revisions,
    },
  };
}

export async function saveAboutPageDraft(
  doc: FreeformDocument,
  seo: PageSeoMetadata
): Promise<{
  success: boolean;
  message: string;
  savedAt?: string;
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const normalized = normalizeFreeformDocument(doc);
  const nowISO = new Date().toISOString();
  const adminClient = getServiceClient();

  const { error: updateError } = await adminClient
    .from("site_pages")
    .update({
      draft_doc: normalized as unknown as Json,
      draft_seo_meta_title: seo.metaTitle.trim() || DEFAULT_ABOUT_SEO.metaTitle,
      draft_seo_meta_description: seo.metaDescription.trim(),
      draft_seo_og_image: seo.ogImage.trim(),
      has_unpublished_changes: true,
      last_autosaved_at: nowISO,
      updated_by: user.id,
    })
    .eq("slug", ABOUT_SLUG);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  return { success: true, message: "Draft saved.", savedAt: nowISO };
}

export async function publishAboutPage(
  doc: FreeformDocument,
  seo: PageSeoMetadata,
  changeSummary?: string
): Promise<{
  success: boolean;
  message: string;
  publishedAt?: string;
  revisions?: AboutPageRevisionSummary[];
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const normalized = normalizeFreeformDocument(doc);
  const cleanSeo: PageSeoMetadata = {
    metaTitle: seo.metaTitle.trim() || DEFAULT_ABOUT_SEO.metaTitle,
    metaDescription: seo.metaDescription.trim(),
    ogImage: seo.ogImage.trim(),
  };
  const nowISO = new Date().toISOString();
  const adminClient = getServiceClient();

  const { error: updateError } = await adminClient
    .from("site_pages")
    .update({
      status: "published",
      published_doc: normalized as unknown as Json,
      draft_doc: normalized as unknown as Json,
      seo_meta_title: cleanSeo.metaTitle,
      seo_meta_description: cleanSeo.metaDescription,
      seo_og_image: cleanSeo.ogImage,
      draft_seo_meta_title: cleanSeo.metaTitle,
      draft_seo_meta_description: cleanSeo.metaDescription,
      draft_seo_og_image: cleanSeo.ogImage,
      has_unpublished_changes: false,
      published_at: nowISO,
      last_autosaved_at: nowISO,
      updated_by: user.id,
    })
    .eq("slug", ABOUT_SLUG);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Record revision snapshot
  const { data: latestRev } = await adminClient
    .from("site_page_revisions")
    .select("revision_number")
    .eq("page_slug", ABOUT_SLUG)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextRevNumber = (latestRev?.revision_number ?? 0) + 1;
  const totalElements = normalized.sections.reduce(
    (sum, s) => sum + s.elements.length,
    0
  );

  await adminClient.from("site_page_revisions").insert({
    page_slug: ABOUT_SLUG,
    revision_number: nextRevNumber,
    doc: normalized as unknown as Json,
    seo_meta_title: cleanSeo.metaTitle,
    seo_meta_description: cleanSeo.metaDescription,
    seo_og_image: cleanSeo.ogImage,
    change_summary:
      changeSummary?.trim() ||
      `Published ${normalized.sections.length} section(s), ${totalElements} element(s)`,
    created_by: user.id,
  });

  await logAudit(user.id, "about_page.publish", {
    message: `Published About Us page (revision #${nextRevNumber})`,
    revision_number: nextRevNumber,
    sections: normalized.sections.length,
    elements: totalElements,
  });

  revalidateAboutPage();
  const revisions = await loadRevisions();

  return {
    success: true,
    message: "About Us page published live!",
    publishedAt: nowISO,
    revisions,
  };
}

export async function restoreAboutRevisionToDraft(revisionId: string): Promise<{
  success: boolean;
  message: string;
  doc?: FreeformDocument;
  seo?: PageSeoMetadata;
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { data: rev, error: revError } = await adminClient
    .from("site_page_revisions")
    .select("*")
    .eq("id", revisionId)
    .eq("page_slug", ABOUT_SLUG)
    .single();

  if (revError || !rev) {
    return { success: false, message: "Revision not found." };
  }

  const restoredDoc = normalizeFreeformDocument(rev.doc);
  const restoredSeo: PageSeoMetadata = {
    metaTitle: rev.seo_meta_title || DEFAULT_ABOUT_SEO.metaTitle,
    metaDescription: rev.seo_meta_description || "",
    ogImage: rev.seo_og_image || "",
  };

  const { error: updateError } = await adminClient
    .from("site_pages")
    .update({
      draft_doc: restoredDoc as unknown as Json,
      draft_seo_meta_title: restoredSeo.metaTitle,
      draft_seo_meta_description: restoredSeo.metaDescription,
      draft_seo_og_image: restoredSeo.ogImage,
      has_unpublished_changes: true,
      last_autosaved_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("slug", ABOUT_SLUG);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await logAudit(user.id, "about_page.restore_draft", {
    message: `Loaded About Us revision #${rev.revision_number} into draft.`,
    revision_number: rev.revision_number,
  });

  return {
    success: true,
    message: `Revision #${rev.revision_number} loaded into your draft. Click Publish to make it live.`,
    doc: restoredDoc,
    seo: restoredSeo,
  };
}

export async function resetAboutDraftToDefault(): Promise<{
  success: boolean;
  message: string;
  doc?: FreeformDocument;
  seo?: PageSeoMetadata;
}> {
  const { user, error } = await requireSuperAdmin();
  if (error || !user) return { success: false, message: error || "Unauthorized" };

  const adminClient = getServiceClient();
  const { error: updateError } = await adminClient
    .from("site_pages")
    .update({
      draft_doc: DEFAULT_ABOUT_US_DOC as unknown as Json,
      draft_seo_meta_title: DEFAULT_ABOUT_SEO.metaTitle,
      draft_seo_meta_description: DEFAULT_ABOUT_SEO.metaDescription,
      draft_seo_og_image: DEFAULT_ABOUT_SEO.ogImage,
      has_unpublished_changes: true,
      last_autosaved_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("slug", ABOUT_SLUG);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await logAudit(user.id, "about_page.reset_default", {
    message: "Reset About Us draft to default Kaizen template.",
  });

  return {
    success: true,
    message: "Default template loaded into draft. Click Publish when ready.",
    doc: structuredClone(DEFAULT_ABOUT_US_DOC),
    seo: { ...DEFAULT_ABOUT_SEO },
  };
}
