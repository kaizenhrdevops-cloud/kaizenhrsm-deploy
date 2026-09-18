"use client";

import { useState, useRef } from "react";
import { getBrowserClient } from "@/lib/client";
import type { Database } from "@/types/supabase";
import { compressImage } from "../utils/image-compressor";
import {
  Upload,
  Link as LinkIcon,
  MoreHorizontal,
  Copy,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

interface ImageBlockProps {
  content: { url: string; alt: string; caption: string };
  onChange: (newContent: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onConvert?: (newType: "paragraph" | "heading" | "quote") => void;
  postId: string;
}

export default function ImageBlock({
  content,
  onChange,
  onDelete,
  onDuplicate,
  postId,
}: ImageBlockProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = getBrowserClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // --- MODIFICATION ---
      // 1. Get the processed file (could be the original GIF or a new WebP)
      const fileToUpload = await compressImage(file, {
        maxWidth: 1920,
        quality: 0.8,
      });

      // 2. Determine extension from the *processed* file's type
      const extension = fileToUpload.type === "image/gif" ? "gif" : "webp";
      const originalName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+/g, "-");
      const fileName = `${Date.now()}-${originalName}.${extension}`;
      const filePath = `public/${postId}/content/${fileName}`;

      // 3. Upload the processed file
      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(filePath, fileToUpload, {
          // Use fileToUpload
          cacheControl: "3600",
          upsert: false,
        });
      // --- END MODIFICATION ---

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(data.path);

      onChange({ ...content, url: publicUrl });
    } catch (error: any) {
      setUploadError("Failed to upload image. Please try again.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange({ ...content, url: urlInput.trim() });
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    onChange({ ...content, url: "" });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Image
        </span>

        <div className="flex-1" />

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="More options"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {
                  onDuplicate();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy size={14} />
                Duplicate
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onDelete();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!content.url ? (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*" // This already allows GIFs
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                ) : (
                  <Upload size={24} className="text-gray-400" />
                )}
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isUploading ? "Uploading..." : "Upload Image"}
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  From your device
                </span>
              </button>

              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <LinkIcon size={24} className="text-gray-400" />
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Embed URL
                </span>
                <span className="mt-1 text-xs text-gray-500">From the web</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUrlSubmit();
                    if (e.key === "Escape") setShowUrlInput(false);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleUrlSubmit}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Embed
                  </button>
                  <button
                    onClick={() => setShowUrlInput(false)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative group">
              <img
                src={content.url}
                alt={content.alt || "Block image"}
                className="w-full h-auto rounded-lg"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              value={content.alt}
              onChange={(e) => onChange({ ...content, alt: e.target.value })}
              placeholder="Alt text (for accessibility)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            />

            <input
              type="text"
              value={content.caption}
              onChange={(e) =>
                onChange({ ...content, caption: e.target.value })
              }
              placeholder="Caption (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
