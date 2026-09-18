// src/app/admin/posts/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { Database } from "@/types/supabase";
import { nanoid } from "nanoid";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.status !== "active" ||
    !["admin", "super_admin"].includes(profile.role || "")
  ) {
    return { supabase, user: null as null, error: "Access denied" };
  }
  return { supabase, user, error: null };
}

export async function createPost(category: "blog" | "development") {
  const { supabase, user, error: authError } = await requireStaff();
  if (authError || !user) {
    return { success: false, message: authError || "Unauthorized" };
  }

  const defaultTitle = "Untitled Post";
  const newShortId = nanoid(8);
  const initialSlug = `untitled-post-${newShortId}`;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: defaultTitle,
      slug: initialSlug,
      short_id: newShortId,
      category: category,
      author_id: user.id,
      status: "draft", // The status is 'draft'
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { success: false, message: "Failed to create post." };
  }

  // --- (FIXED) ADD AUDIT LOG ---
  await supabase.from("admin_audit_log").insert({
    admin_id: user.id,
    action: "post.create",
    details: {
      // This message is now more precise, as you suggested
      message: `Created new draft ${category} post: ${defaultTitle}`,
      post_id: data.id,
      category: category,
      status: "draft",
    },
  });
  // --- END LOG ---

  revalidatePath("/admin/blog");
  return { success: true, postId: data.id };
}

export async function getAllPosts() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      title,
      slug,
      category,
      status,
      published_at,
      author_id,
      newsletter_sent_at, 
      excerpt,                 
      featured_image,          
      author:profiles!posts_author_id_fkey (
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data };
}

export async function deletePost(postId: string) {
  const { supabase, user, error: authError } = await requireStaff();
  if (authError || !user) {
    return { success: false, message: authError || "Unauthorized" };
  }

  // Get post title *before* deleting for the log
  const { data: postToLog } = await supabase
    .from("posts")
    .select("title")
    .eq("id", postId)
    .single();

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    return { success: false, message: "Failed to delete post." };
  }

  // --- (FIXED) ADD AUDIT LOG ---
  await supabase.from("admin_audit_log").insert({
    admin_id: user.id,
    action: "post.delete",
    details: {
      message: `Deleted post: ${postToLog?.title || postId}`,
      post_id: postId,
      deleted_title: postToLog?.title,
    },
  });
  // --- END LOG ---

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/editor/${postId}`);
  return { success: true, message: "Post deleted successfully." };
}

export async function getPostById(postId: string) {
  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError) {
    console.error("Error fetching post:", postError);
    return { success: false, message: "Post not found.", post: null, blocks: [] };
  }

  if (post.has_unpublished_changes) {
    const draftPost = {
      ...post,
      title: post.draft_title || post.title,
      excerpt: post.draft_excerpt || post.excerpt,
      featured_image: post.draft_featured_image || post.featured_image,
      featured_image_alt: post.draft_featured_image_alt || post.featured_image_alt,
      seo_meta_title: post.draft_seo_meta_title || post.seo_meta_title,
      seo_meta_description: post.draft_seo_meta_description || post.seo_meta_description,
      seo_og_image: post.draft_seo_og_image || post.seo_og_image,
      updated_by: post.updated_by,
    };
    
    let blocks: any[] = [];
    if (Array.isArray(post.draft_blocks)) {
      blocks = post.draft_blocks;
    }

    return { success: true, post: draftPost, blocks: blocks || [] };
  }

  const { data: blocks, error: blocksError } = await supabase
    .from("post_blocks")
    .select("id, post_id, type, content, order_index")
    .eq("post_id", postId)
    .order("order_index", { ascending: true });

  if (blocksError) {
    console.error("Error fetching blocks:", blocksError);
  }

  return { success: true, post, blocks: blocks || [] };
}

export async function updatePostCategory(
  postId: string,
  category: "blog" | "development"
) {
  const { supabase, user, error: authError } = await requireStaff();
  if (authError || !user) {
    return { success: false, message: authError || "Unauthorized" };
  }

  const { error } = await supabase
    .from("posts")
    .update({ category: category, updated_by: user.id })
    .eq("id", postId);

  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath(`/admin/editor/${postId}`);
  return { success: true };
}

export async function updatePostDetails(
  postId: string,
  details: Partial<Database["public"]["Tables"]["posts"]["Row"]>
) {
  const { supabase, user, error: authError } = await requireStaff();
  if (authError || !user) {
    return { success: false, message: authError || "Unauthorized" };
  }

  const { error } = await supabase
    .from("posts")
    .update({ ...details, updated_by: user.id })
    .eq("id", postId);

  if (error) {
    return { success: false, message: error.message };
  }
  revalidatePath(`/admin/editor/${postId}`);
  return { success: true, message: "Details saved successfully." };
}

export async function autoSaveDraft(
  postId: string,
  postDetails: Partial<Database["public"]["Tables"]["posts"]["Row"]>,
  blocks: any[]
) {
  const { supabase, user, error: authError } = await requireStaff();
  if (authError || !user) {
    return { success: false, message: authError || "Unauthorized" };
  }
  
  const { error: postUpdateError } = await supabase
    .from("posts")
    .update({
      draft_title: postDetails.title,
      draft_excerpt: postDetails.excerpt,
      draft_featured_image: postDetails.featured_image,
      draft_featured_image_alt: postDetails.featured_image_alt,
      draft_seo_meta_title: postDetails.seo_meta_title,
      draft_seo_meta_description: postDetails.seo_meta_description,
      draft_seo_og_image: postDetails.seo_og_image,
      draft_blocks: blocks,
      has_unpublished_changes: true,
      last_autosaved_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", postId);

  if (postUpdateError) {
    console.error("Error autosaving draft:", postUpdateError);
    return { success: false, message: postUpdateError.message };
  }

  return { success: true, message: "Draft saved." };
}

export async function publishPost(postId: string) {
  const { supabase, user, error: authError } = await requireStaff();
  if (authError || !user) {
    return { success: false, message: authError || "Unauthorized" };
  }

  // --- (FIXED) ADD LOGIC TO CHECK IF POST IS ALREADY PUBLISHED ---
  const { data: existingPost, error: existingError } = await supabase
    .from("posts")
    .select("published_at, draft_title, draft_slug, draft_excerpt, draft_featured_image, draft_featured_image_alt, draft_seo_meta_title, draft_seo_meta_description, draft_seo_og_image, draft_blocks")
    .eq("id", postId)
    .single();

  if (existingError || !existingPost) {
    console.error("Error fetching draft data to publish:", existingError);
    return { success: false, message: "Could not find draft data to publish." };
  }
  
  const isRepublish = !!existingPost.published_at;
  const draftData = existingPost; // Rename for clarity
  // --- END FIX ---

  const { error: deleteBlocksError } = await supabase
    .from("post_blocks")
    .delete()
    .eq("post_id", postId);

  if (deleteBlocksError) {
    console.error("Error deleting old blocks:", deleteBlocksError);
    return { success: false, message: deleteBlocksError.message };
  }


  if (draftData.draft_blocks && Array.isArray(draftData.draft_blocks)) {
    const blocksToInsert = (draftData.draft_blocks as any[]).map(
      (block, index) => ({
        post_id: postId,
        type: block.type,
        content: block.content,
        order_index: index,
      })
    );

    if (blocksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("post_blocks")
        .insert(blocksToInsert);

      if (insertError) {
        console.error("Error inserting new blocks:", insertError);
        return { success: false, message: insertError.message };
      }
    }
  }

  const finalTitle = draftData.draft_title || "Untitled Post";
  const finalSlug = draftData.draft_slug || `post-${nanoid(8)}`;

  const { error } = await supabase
    .from("posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      
      title: finalTitle,
      slug: finalSlug,
      excerpt: draftData.draft_excerpt,
      featured_image: draftData.draft_featured_image,
      featured_image_alt: draftData.draft_featured_image_alt,
      seo_meta_title: draftData.draft_seo_meta_title,
      seo_meta_description: draftData.draft_seo_meta_description,
      seo_og_image: draftData.draft_seo_og_image,
      
      has_unpublished_changes: false,
      draft_title: null,
      draft_slug: null,
      draft_excerpt: null,
      draft_featured_image: null,
      draft_featured_image_alt: null,
      draft_seo_meta_title: null,
      draft_seo_meta_description: null,
      draft_seo_og_image: null,
      draft_blocks: null,
      updated_by: user.id,
    })
    .eq("id", postId);

  if (error) {
    console.error("Error publishing post:", error);
    return { success: false, message: error.message };
  }

  // --- (FIXED) ADD AUDIT LOG ---
  const message = isRepublish
    ? `Updated published post: ${finalTitle}`
    : `Published new post: ${finalTitle}`;

  await supabase.from("admin_audit_log").insert({
    admin_id: user.id,
    action: isRepublish ? "post.update" : "post.publish", // Use a different action
    details: {
      message: message,
      post_id: postId,
    },
  });
  // --- END LOG ---

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/editor/${postId}`);
  revalidatePath("/resources/blog-articles");
  revalidatePath("/company/developments");

  return { success: true, message: "Post published successfully!" };
}