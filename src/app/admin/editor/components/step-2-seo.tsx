// src/app/admin/editor/components/step-2-seo.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Database } from "@/types/supabase";
import { getBrowserClient } from "@/lib/client";
import { compressImage } from "../utils/image-compressor";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface Step2SEOProps {
  post: Post;
  setPost: React.Dispatch<React.SetStateAction<Post>>;
  onValidationChange: (isValid: boolean) => void;
}

export default function Step2SEO({
  post,
  setPost,
  onValidationChange,
}: Step2SEOProps) {
  const [slugTouched, setSlugTouched] = useState(false);
  const [showSocialPreview, setShowSocialPreview] = useState(false);
  const [isUploadingOG, setIsUploadingOG] = useState(false);
  const ogFileInputRef = useRef<HTMLInputElement>(null);

  const supabase = getBrowserClient();

  function generateBaseSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove consecutive hyphens
  }

  function generateFullSlug(title: string): string {
    const baseSlug = generateBaseSlug(title || "untitled-post");
    if (!post.short_id) return baseSlug;
    return `${baseSlug}-${post.short_id}`.substring(0, 90); // Limit total length
  }

  const isSlugInSync = post.slug === generateFullSlug(post.title!);

  useEffect(() => {
    const isValid = !!(post.slug && post.slug.trim() !== "");
    onValidationChange(isValid);
  }, [post.slug, onValidationChange]);

  useEffect(() => {
    if (post.title && !slugTouched) {
      const newSlug = generateFullSlug(post.title);
      if (newSlug !== post.slug) {
        setPost((prev) => ({ ...prev, slug: newSlug }));
      }
    }
  }, [post.title, post.short_id, slugTouched]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugTouched) setSlugTouched(true);
    const cleaned = generateBaseSlug(e.target.value);
    setPost((prev) => ({ ...prev, slug: cleaned }));
  };

  const handleRegenerateSlug = () => {
    setSlugTouched(false);
    const newSlug = generateFullSlug(post.title!);
    setPost((prev) => ({ ...prev, slug: newSlug }));
  };

  const handleOGImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingOG(true);
    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        quality: 0.85,
      });
      const fileName = `og-${Date.now()}.webp`;
      const filePath = `public/${post.id}/og/${fileName}`;
      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(data.path);
      setPost((prev) => ({ ...prev, seo_og_image: publicUrl }));
    } catch (error) {
      console.error("Failed to upload OG image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingOG(false);
    }
  };

  const removeOGImage = () =>
    setPost((prev) => ({ ...prev, seo_og_image: null }));

  // --- ALL YOUR ORIGINAL FUNCTIONS ARE PRESERVED HERE ---
  const metaTitleLength = (post.seo_meta_title || "").length;
  const metaDescLength = (post.seo_meta_description || "").length;
  const getTitleColor = () => {
    if (metaTitleLength === 0) return "text-gray-400";
    if (metaTitleLength < 50) return "text-yellow-600";
    if (metaTitleLength <= 60) return "text-green-600";
    return "text-red-600";
  };
  const getDescColor = () => {
    if (metaDescLength === 0) return "text-gray-400";
    if (metaDescLength < 150) return "text-yellow-600";
    if (metaDescLength <= 160) return "text-green-600";
    return "text-red-600";
  };

  // --- THIS IS THE EXACT BLOCK YOU ASKED FOR, INTEGRATED ---
  const previewTitle = post.seo_meta_title || post.title || "Untitled Post";
  const previewDesc = post.seo_meta_description || "No description provided.";
  // Dynamic URL based on category
  const categoryPath =
    post.category === "blog" ? "blog-articles" : "developments";
  const previewUrl = `https://yoursite.com/${categoryPath}/${post.slug || "untitled-post"}`;
  const previewImage =
    post.seo_og_image || post.featured_image || "/placeholder-og.png";
  // --- END OF THE INTEGRATED BLOCK ---

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            SEO & Metadata
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Optimize how your post appears on search engines and social media
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Information Card */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="border-b border-gray-200 dark:border-gray-700 p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Post Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Post Title
                  </label>
                  <input
                    type="text"
                    value={post.title || ""}
                    onChange={(e) =>
                      setPost((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter your post title..."
                  />
                </div>
                {/* URL Slug Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL Slug *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                      {/* --- AND HERE IS THE VISUAL PREFIX UPDATE --- */}
                      <span className="inline-flex items-center px-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm border-r border-gray-300 dark:border-gray-600">
                        /{categoryPath}/
                      </span>
                      <input
                        type="text"
                        value={post.slug || ""}
                        onChange={handleSlugChange}
                        className="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0 dark:bg-gray-900 dark:text-white"
                        placeholder="your-post-slug"
                      />
                    </div>
                    <button
                      onClick={handleRegenerateSlug}
                      disabled={isSlugInSync}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        isSlugInSync
                          ? "Slug is already synced with title"
                          : "Regenerate from title"
                      }
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{previewUrl}</p>
                </div>
              </div>
            </div>
            {/* SEO Card */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="border-b border-gray-200 dark:border-gray-700 p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Search Engine Optimization
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Meta Title */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Meta Title *
                    </label>
                    <span className={`text-xs font-medium ${getTitleColor()}`}>
                      {metaTitleLength} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={post.seo_meta_title || ""}
                    onChange={(e) =>
                      setPost((prev) => ({
                        ...prev,
                        seo_meta_title: e.target.value,
                      }))
                    }
                    maxLength={70}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    placeholder="Compelling title for search results"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ideal length: 50-60 characters
                  </p>
                </div>
                {/* Meta Description */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Meta Description *
                    </label>
                    <span className={`text-xs font-medium ${getDescColor()}`}>
                      {metaDescLength} / 160
                    </span>
                  </div>
                  <textarea
                    value={post.seo_meta_description || ""}
                    onChange={(e) =>
                      setPost((prev) => ({
                        ...prev,
                        seo_meta_description: e.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={170}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white resize-none"
                    placeholder="Brief summary to appear in search results"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ideal length: 150-160 characters
                  </p>
                </div>
                {/* Social Media Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Social Media Image (Optional)
                  </label>
                  <input
                    ref={ogFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleOGImageUpload}
                    className="hidden"
                  />
                  {post.seo_og_image ? (
                    <div className="relative group">
                      <img
                        src={post.seo_og_image}
                        alt="OG preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={removeOGImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => ogFileInputRef.current?.click()}
                      disabled={isUploadingOG}
                      className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
                    >
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isUploadingOG
                          ? "Uploading..."
                          : "Upload custom image (1200x630px)"}
                      </span>
                    </button>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use featured image for social sharing
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column Previews */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 sticky top-4">
              <div className="border-b border-gray-200 dark:border-gray-700 p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Google Search Preview
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-1">
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {previewUrl}
                  </div>
                  <div className="text-lg text-blue-700 dark:text-blue-300 font-medium hover:underline cursor-pointer line-clamp-1">
                    {previewTitle}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {previewDesc}
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowSocialPreview(!showSocialPreview)}
                className="w-full flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Social Media Preview
                </h3>
                {showSocialPreview ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
              {showSocialPreview && (
                <div className="p-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={previewImage}
                      alt="Social preview"
                      className="w-full h-40 object-cover bg-gray-100 dark:bg-gray-700"
                    />
                    <div className="p-3 bg-gray-50 dark:bg-gray-900">
                      <div className="text-xs text-gray-500 uppercase mb-1">
                        yoursite.com
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {previewTitle}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {previewDesc}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
