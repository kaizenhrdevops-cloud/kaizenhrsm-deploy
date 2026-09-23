"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { getBrowserClient } from "@/lib/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import Pagination from "@/components/ui/Pagination";
import { ArrowRight, Search, X, Calendar, Image as ImageIcon } from "lucide-react";

export type PostBlock = {
  type: string;
  content: any;
  order_index: number;
};

export type ListingPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  post_blocks?: PostBlock[] | null;
};

interface PostListingPageProps {
  category: "blog" | "development";
  title: string;
  subtitle?: string;
  basePath: string;
  emptyMessage?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}

const POSTS_PER_PAGE = 7; // 1 featured + 6 in grid

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return null;
  }
}

/** Recursively extracts plain text from tiptap/content JSON nodes */
function extractPlainText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node.text === "string") return node.text;
  if (typeof node.quote === "string") return node.quote;
  if (Array.isArray(node)) {
    return node.map(extractPlainText).join(" ");
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join(" ");
  }
  return "";
}

/** Returns the first 10-15 words directly from the post content itself, ending with '...' */
function getPostSnippet(post: ListingPost, maxWords = 14): string | null {
  let fullText = "";

  if (post.excerpt && post.excerpt.trim()) {
    fullText = post.excerpt.trim();
  } else if (post.post_blocks && post.post_blocks.length > 0) {
    const sorted = [...post.post_blocks].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );
    const textPieces: string[] = [];
    for (const b of sorted) {
      if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") {
        const text = extractPlainText(b.content).trim();
        if (text) textPieces.push(text);
      }
    }
    fullText = textPieces.join(" ");
  }

  const words = fullText
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return null;

  return words.slice(0, maxWords).join(" ") + "...";
}

export default function PostListingPage({
  category,
  title,
  subtitle,
  basePath,
  emptyMessage = "No articles published yet. Check back soon!",
  emptyActionHref = "/company/contact-us",
  emptyActionLabel = "Get in Touch",
}: PostListingPageProps) {
  const [posts, setPosts] = useState<ListingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const contentTopRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const supabase = getBrowserClient();

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // 1. Get total count of published posts for this category
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("category", category)
        .eq("status", "published");

      setTotalPosts(count || 0);

      // 2. Fetch paginated posts including their blocks to derive snippets
      const from = (currentPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, title, slug, excerpt, featured_image, published_at,
          post_blocks(type, content, order_index)
        `)
        .eq("category", category)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPosts((data as unknown as ListingPost[]) || []);
    } catch (err) {
      console.error(`Error fetching ${category} posts:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (contentTopRef.current) {
      const topOffset = contentTopRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  // Filter posts on current view if user types in search
  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => {
      const matchTitle = post.title?.toLowerCase().includes(q);
      const snippet = getPostSnippet(post, 50)?.toLowerCase() || "";
      return matchTitle || snippet.includes(q);
    });
  }, [posts, searchQuery]);

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-20">
        {/* Header Section */}
        <div ref={contentTopRef} className="border-b border-gray-100 pb-8 sm:pb-10">
          <Container>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Live Search Bar */}
              <div className="w-full md:w-80 relative">
                <label htmlFor="search-posts" className="sr-only">
                  Search articles
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="search-posts"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Content Section */}
        <Container className="py-12">
          {loading ? (
            /* Skeleton Loading State */
            <div className="space-y-12">
              {/* Featured Skeleton */}
              <div className="border border-gray-200/70 rounded-2xl p-6 sm:p-8 animate-pulse bg-white">
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-6 aspect-[16/10] bg-gray-100 rounded-xl" />
                  <div className="md:col-span-6 space-y-4">
                    <div className="h-4 w-28 bg-gray-100 rounded" />
                    <div className="h-8 w-4/5 bg-gray-100 rounded" />
                    <div className="h-4 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded" />
                    <div className="h-4 w-24 bg-gray-100 rounded pt-4" />
                  </div>
                </div>
              </div>

              {/* Grid Skeletons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200/70 rounded-2xl overflow-hidden bg-white animate-pulse"
                  >
                    <div className="aspect-[16/10] bg-gray-100" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                      <div className="h-5 w-3/4 bg-gray-100 rounded" />
                      <div className="h-4 w-full bg-gray-100 rounded" />
                      <div className="h-4 w-1/2 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? "No matching articles found" : "No articles found"}
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-6 text-sm">
                {searchQuery
                  ? `We couldn't find any articles matching "${searchQuery}". Try using different keywords.`
                  : emptyMessage}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  Clear search query
                </button>
              ) : (
                <Link
                  href={emptyActionHref}
                  className="inline-flex items-center text-sm font-semibold text-teal-700 hover:text-teal-800 gap-1.5"
                >
                  {emptyActionLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-14">
              {/* Search Active Notification */}
              {searchQuery && (
                <div className="flex items-center justify-between text-sm text-gray-500 pb-2 border-b border-gray-100">
                  <span>
                    Found {filteredPosts.length}{" "}
                    {filteredPosts.length === 1 ? "article" : "articles"} matching &quot;
                    <span className="font-semibold text-gray-900">{searchQuery}</span>&quot;
                  </span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-teal-700 hover:text-teal-800 font-medium"
                  >
                    Clear filter
                  </button>
                </div>
              )}

              {/* Featured Post (First Post) */}
              {featuredPost && (
                <article className="group relative bg-white border border-gray-200/80 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                  <div className="grid md:grid-cols-12 gap-0 md:items-stretch">
                    {/* Featured Image */}
                    <div className="md:col-span-7 relative aspect-[16/10] md:aspect-auto md:min-h-[380px] bg-gray-50 overflow-hidden">
                      {featuredPost.featured_image ? (
                        <img
                          src={featuredPost.featured_image}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                          <ImageIcon className="w-16 h-16 stroke-[1.2]" />
                        </div>
                      )}
                    </div>

                    {/* Featured Content */}
                    <div className="md:col-span-5 p-7 sm:p-9 md:p-10 flex flex-col justify-between">
                      <div>
                        {featuredPost.published_at && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <time dateTime={featuredPost.published_at}>
                              {formatDate(featuredPost.published_at)}
                            </time>
                          </div>
                        )}

                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors duration-200 line-clamp-3 leading-snug">
                          <Link href={`${basePath}/${featuredPost.slug}`}>
                            {featuredPost.title}
                          </Link>
                        </h2>

                        {/* 10-15 word snippet from post content or excerpt */}
                        {(() => {
                          const snippet = getPostSnippet(featuredPost, 15);
                          return snippet ? (
                            <p className="mt-4 text-sm sm:text-base text-gray-600 line-clamp-3 leading-relaxed">
                              {snippet}
                            </p>
                          ) : null;
                        })()}
                      </div>

                      <div className="pt-6 mt-6 border-t border-gray-100">
                        <Link
                          href={`${basePath}/${featuredPost.slug}`}
                          className="inline-flex items-center text-sm font-semibold text-teal-700 group-hover:text-teal-800 gap-2 transition-colors"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Grid Posts */}
              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {gridPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group flex flex-col bg-white border border-gray-200/80 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Card Image */}
                      <Link
                        href={`${basePath}/${post.slug}`}
                        className="relative aspect-[16/10] bg-gray-50 overflow-hidden block"
                      >
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                            <ImageIcon className="w-10 h-10 stroke-[1.2]" />
                          </div>
                        )}
                      </Link>

                      {/* Card Body */}
                      <div className="p-6 flex flex-col flex-grow justify-between">
                        <div>
                          {post.published_at && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <time dateTime={post.published_at}>
                                {formatDate(post.published_at)}
                              </time>
                            </div>
                          )}

                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors duration-200 line-clamp-2 leading-snug">
                            <Link href={`${basePath}/${post.slug}`}>{post.title}</Link>
                          </h3>

                          {/* 10-15 word snippet from post content or excerpt */}
                          {(() => {
                            const snippet = getPostSnippet(post, 14);
                            return snippet ? (
                              <p className="mt-2.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {snippet}
                              </p>
                            ) : null;
                          })()}
                        </div>

                        <div className="pt-4 mt-5 border-t border-gray-100 flex items-center justify-between">
                          <Link
                            href={`${basePath}/${post.slug}`}
                            className="inline-flex items-center text-sm font-semibold text-teal-700 group-hover:text-teal-800 gap-1.5 transition-colors"
                          >
                            Read More
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Shared Pagination */}
              {!searchQuery && totalPages > 1 && (
                <div className="pt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
