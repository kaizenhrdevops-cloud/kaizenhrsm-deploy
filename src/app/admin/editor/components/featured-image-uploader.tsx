// src/app/admin/editor/components/featured-image-uploader.tsx
"use client";

import { useState, useRef } from "react";
import { UploadCloud, X } from "lucide-react";
import { getBrowserClient } from "@/lib/client";
import type { Database } from "@/types/supabase";
import { compressImage } from "../utils/image-compressor";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface FeaturedImageUploaderProps {
  post: Post;
  setPost: React.Dispatch<React.SetStateAction<Post>>;
}

export default function FeaturedImageUploader({
  post,
  setPost,
}: FeaturedImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = getBrowserClient();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        quality: 0.7,
      });
      const fileName = `${Date.now()}.webp`;
      const filePath = `public/${post.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(data.path);

      setPost((prev) => ({ ...prev, featured_image: publicUrl }));
    } catch (e: any) {
      setError("Failed to upload image. Please try again.");
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    // 4. Also update the database when removing an image
    setPost((prev) => ({
      ...prev,
      featured_image: null,
      featured_image_alt: null,
    }));
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {post.featured_image ? (
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={post.featured_image}
              alt={post.featured_image_alt || "Featured image preview"}
              className="w-full h-auto max-h-80 object-contain rounded-md"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label
              htmlFor="featured_image_alt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Alt Text for Image
            </label>
            <input
              type="text"
              id="featured_image_alt"
              value={post.featured_image_alt || ""}
              onChange={(e) =>
                setPost((prev) => ({
                  ...prev,
                  featured_image_alt: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              placeholder="A brief description of the image"
            />
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex justify-center items-center">
            <UploadCloud className="w-12 h-12 text-gray-400" />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Click to upload a banner
            </span>
          </p>
          <p className="text-xs text-gray-500">Recommended size: 1920x1080px</p>
          {isUploading && (
            <p className="mt-2 text-sm animate-pulse">
              Compressing & Uploading...
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
