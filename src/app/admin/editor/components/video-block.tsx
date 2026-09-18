// src/app/admin/editor/components/video-block.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { MoreHorizontal, Copy, Trash2, Youtube } from "lucide-react";

interface VideoBlockProps {
  content: { url: string; caption: string };
  onChange: (newContent: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function VideoBlock({
  content,
  onChange,
  onDelete,
  onDuplicate,
}: VideoBlockProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [urlInput, setUrlInput] = useState(content.url || "");

  // Extract YouTube video ID from various URL formats
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // Already an embed URL
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    // Standard watch URL
    const watchMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // Shorts URL
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    return null;
  };

  const handleUrlSubmit = () => {
    const embedUrl = getYouTubeEmbedUrl(urlInput);
    if (embedUrl) {
      onChange({ ...content, url: embedUrl });
    } else {
      toast.error("Please enter a valid YouTube URL");
    }
  };

  const embedUrl = getYouTubeEmbedUrl(content.url);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2">
        <Youtube size={18} className="text-red-600" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          YouTube Video
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
      <div className="p-4 space-y-3">
        {!embedUrl ? (
          <div className="space-y-3">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Youtube size={32} className="text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Paste a YouTube video URL to embed it
              </p>
              <div className="w-full max-w-md">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUrlSubmit();
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                />
                <button
                  onClick={handleUrlSubmit}
                  className="w-full mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Embed Video
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                src={embedUrl}
                title="YouTube video"
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <input
              type="text"
              value={content.caption}
              onChange={(e) =>
                onChange({ ...content, caption: e.target.value })
              }
              placeholder="Caption (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            />

            <button
              onClick={() => {
                onChange({ url: "", caption: content.caption });
                setUrlInput("");
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Change Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
