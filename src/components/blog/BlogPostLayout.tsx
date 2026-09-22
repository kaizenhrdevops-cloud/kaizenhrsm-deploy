"use client";

import React, { useState, useEffect } from "react";
import { getBrowserClient } from "@/lib/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StickySidebar } from "./StickySidebar";
import PostRenderer from "./PostRenderer";
import { useSettings } from "@/components/layout/SettingsProvider";

// Type definitions... (Keep existing types)
type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string;
  author_id: string | null;
  author?: {
    full_name: string | null;
    email: string;
  };
};

type Block = {
  id: string;
  type: string;
  content: any;
  order_index: number;
};

type TOCItem = {
  id: string;
  text: string;
  level: number;
};

export default function BlogPostLayout({
  slug,
  category,
  initialPost = null,
  initialBlocks = [],
}: {
  slug: string;
  category: "blog" | "development";
  initialPost?: Post | null;
  initialBlocks?: Block[];
}) {
  const [post, setPost] = useState<Post | null>(initialPost);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [loading, setLoading] = useState(initialPost ? false : true);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  // Default author comes from layout-provided settings (no own fetch).
  const { blog_default_author_name } = useSettings();
  const [defaultAuthorName, setDefaultAuthorName] = useState(
    blog_default_author_name || "KaizenHR Team"
  );

  const supabase = getBrowserClient();

  useEffect(() => {
    if (!initialPost) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, category, initialPost]);

  useEffect(() => {
    if (blocks.length > 0) {
      generateTOC();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(
          `id, title, slug, excerpt, featured_image, published_at, updated_at, author_id`
        )
        .eq("slug", slug)
        .eq("category", category)
        .eq("status", "published")
        .single();

      if (postError && postError.code !== "PGRST116") {
        throw postError;
      }

      if (postData) {
        const { data: blocksData, error: blocksError } = await supabase
          .from("post_blocks")
          .select("id, post_id, type, content, order_index")
          .eq("post_id", postData.id)
          .order("order_index", { ascending: true });

        if (blocksError) throw blocksError;

        setPost(postData as any);
        setBlocks(blocksData || []);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateTOC = () => {
    const headings: TOCItem[] = [];
    blocks.forEach((block) => {
      const content = block.content as any;
      if (
        block.type === "heading" &&
        content &&
        (content.level === 2 || content.level === 3)
      ) {
        headings.push({
          id: `heading-${block.id}`,
          text: content.text,
          level: content.level,
        });
      }
    });
    setToc(headings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008080]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex flex-1 items-center justify-center pt-16 min-h-[700px] md:min-h-[800px]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Post Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The post you're looking for doesn't exist.
            </p>
            <a
              href={
                category === "blog"
                  ? "/resources/blog-articles"
                  : "/company/developments"
              }
              className="text-[#008080] hover:underline"
            >
              ← Back to {category === "blog" ? "Blog" : "Developments"}
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="relative bg-slate-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 items-center py-12">
            <div className="md:col-span-2 p-6 md:p-0 flex flex-col justify-center">
              <p className="text-sm text-gray-500 mb-2">
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>
              <div className="flex items-center text-gray-600">
                <span>
                  By {/* --- UPDATED: Use the dynamic default author --- */}
                  {post.author?.full_name ||
                    post.author?.email ||
                    defaultAuthorName}
                </span>
              </div>
            </div>

            <div className="md:col-span-3 relative h-64 md:h-80 rounded-lg overflow-hidden">
              {post.featured_image ? (
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#008080] to-[#20b2aa] flex items-center justify-center">
                  <span className="text-white text-xl">KaizenHR</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside
            className="hidden lg:block lg:w-2/5 lg:sticky lg:top-24 lg:self-start order-2 lg:order-1"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            <StickySidebar
              toc={toc}
              activeSection={activeSection}
              postTitle={post.title}
            />
          </aside>

          <article className="lg:w-3/5 order-1 lg:order-2">
            <div className="max-w-none">
              <PostRenderer blocks={blocks} />
            </div>
          </article>
        </div>
      </div>

      <div className="lg:hidden px-4 mb-8">
        <StickySidebar
          toc={toc}
          activeSection={activeSection}
          postTitle={post.title}
        />
      </div>

      <Footer />
    </div>
  );
}
