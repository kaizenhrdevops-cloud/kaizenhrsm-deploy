// src/app/(public)/company/developments/[slug]/page.tsx
import { cache } from "react";
import { Metadata } from "next";
import { getServiceClient } from "@/lib/supabase-admin";
import BlogPostLayout from "@/components/blog/BlogPostLayout";

export const revalidate = 60;

const getPost = cache(async (slug: string) => {
  try {
    const supabase = getServiceClient();
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select(`
        id, title, slug, excerpt, featured_image, published_at, updated_at, author_id,
        seo_meta_title, seo_meta_description, seo_og_image,
        author:profiles!posts_author_id_fkey(full_name, email)
      `)
      .eq("slug", slug)
      .eq("category", "development")
      .eq("status", "published")
      .single();

    if (postError || !postData) return null;

    const { data: blocksData } = await supabase
      .from("post_blocks")
      .select("id, post_id, type, content, order_index")
      .eq("post_id", postData.id)
      .order("order_index", { ascending: true });

    const rawAuthor = (postData as any).author;
    const author = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;

    return {
      post: {
        ...(postData as any),
        author,
      },
      blocks: blocksData || [],
    };
  } catch (err) {
    console.error("Error loading development post on server:", err);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data?.post) {
    return {
      title: "Post Not Found | KaizenHR",
    };
  }

  const { post } = data;
  return {
    title: `${post.seo_meta_title || post.title} | KaizenHR`,
    description: post.seo_meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.seo_meta_title || post.title,
      description: post.seo_meta_description || post.excerpt || undefined,
      images: post.seo_og_image || post.featured_image ? [post.seo_og_image || post.featured_image!] : [],
    },
  };
}

export default async function DevelopmentPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPost(slug);

  return (
    <BlogPostLayout
      slug={slug}
      category="development"
      initialPost={data?.post || null}
      initialBlocks={data?.blocks || []}
    />
  );
}
