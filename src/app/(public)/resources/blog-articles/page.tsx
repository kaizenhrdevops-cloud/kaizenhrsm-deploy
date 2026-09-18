"use client";

import React, { useState, useEffect } from "react";
import { getBrowserClient } from "@/lib/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowRight, FileText } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
};

export default function BlogArticlesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const postsPerPage = 7;

  const supabase = getBrowserClient();

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("category", "blog")
        .eq("status", "published");

      setTotalPages(Math.ceil((count || 0) / postsPerPage));

      // Get paginated posts
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image, published_at")
        .eq("category", "blog")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range((currentPage - 1) * postsPerPage, currentPage * postsPerPage - 1);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading posts...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-5xl font-bold text-gray-900 mt-8">Blog</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto my-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <EmptyState
            title="No posts found"
            message="There are no blog articles published yet. Check back soon!"
            action={
              <a
                href="/resources/hr-checklist"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Explore HR Checklist
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            }
          />
        ) : (
          <>
            {/* Featured Post (First Post) */}
            <div className="mb-12">
              <a
                href={`/resources/blog-articles/${posts[0].slug}`}
                className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative h-64 md:h-full bg-gray-200">
                    {posts[0].featured_image ? (
                      <img
                        src={posts[0].featured_image}
                        alt={posts[0].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <FileText className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 line-clamp-2">
                      {posts[0].title}
                    </h2>
                    {/* <p className="text-gray-600 mb-6 line-clamp-3">
                      {posts[0].excerpt || "Read this article to learn more..."}
                    </p> */}
                    <div className="inline-flex items-center text-blue-600 font-medium group">
                      Read More
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {/* Grid Posts */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {posts.slice(1).map((post) => (
                  <a
                    key={post.id}
                    href={`/resources/blog-articles/${post.slug}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <FileText className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      {/* <p className="text-gray-600 mb-4 line-clamp-2">
                        {post.excerpt || "Read this article to learn more..."}
                      </p> */}
                      <div className="inline-flex items-center text-blue-600 font-medium group">
                        Read More
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Shared pagination (see src/components/ui/Pagination.tsx) */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}