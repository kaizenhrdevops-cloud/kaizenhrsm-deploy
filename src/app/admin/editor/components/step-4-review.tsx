// src/app/admin/editor/components/step-4-review.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { Database } from "@/types/supabase";
import PostRenderer from "@/components/blog/PostRenderer";
import { StickySidebar } from "@/components/blog/StickySidebar";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  Smartphone,
  Monitor,
  ExternalLink,
  Twitter,
  Linkedin,
  Mail,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];

type TOCItem = {
  id: string;
  text: string;
  level: number;
};

interface Step4ReviewProps {
  post: Post;
  blocks: PostBlock[];
  onEditStep?: (step: number) => void;
  // We remove onPublish, as the main editor-client controls publishing
}

export default function Step4Review({
  post,
  blocks,
  onEditStep,
}: Step4ReviewProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeSection, setActiveSection] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [device, setDevice] = useState<"sm" | "lg">("lg");
  const observerRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  // ────── ADD THESE TWO LINES HERE ──────
  const [copiedLink, setCopiedLink] = useState(false);

  const sharePost = (platform: "twitter" | "linkedin" | "email" | "copy") => {
    const url = window.location.href;
    const text = post.title || "";

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${text}&body=${url}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        break;
    }
  };
  // ───────────────────────────────────────

  const metadata = (post.metadata || {}) as any;

  // Generate TOC
  useEffect(() => {
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
  }, [blocks]);

  // Scroll Spy
  useEffect(() => {
    // Only run scroll spy on full-width (xl) preview
    if (device !== "lg") {
      setActiveSection(""); // Clear active section
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          observerRef.current.set(entry.target.id, entry);
        });

        const visible = Array.from(observerRef.current.entries())
          .filter(([_, e]) => e.isIntersecting)
          .sort(([_, a], [__, b]) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(visible[0][0]);
        }
      },
      {
        rootMargin: "-100px 0px -70% 0px", // Top of viewport
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    const previewContainer = document.getElementById("preview-container");
    if (previewContainer) {
      previewContainer.querySelectorAll("[id^='heading-']").forEach((el) => {
        observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [blocks, device]); // Rerun when device changes

  const deviceWidths = {
    sm: "max-w-xl", // Mobile
    lg: "max-w-7xl", // Desktop
  };

  const categoryPath =
    post.category === "blog" ? "blog-articles" : "developments";

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-center mx-auto px-4 py-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#008080] to-[#20b2aa] bg-clip-text text-transparent">
              Review & Publish
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Final check before going live
            </p>
          </div>
        </div>

        <div className="mx-auto space-y-6 mt-6 pb-6">
          {/* Collapsible Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setSummaryOpen(!summaryOpen)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Post Summary
                </h3>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
                  <Check size={12} />
                  Ready to Publish
                </span>
              </div>
              {summaryOpen ? (
                <ChevronUp size={20} className="text-gray-500" />
              ) : (
                <ChevronDown size={20} className="text-gray-500" />
              )}
            </button>

            {summaryOpen && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-sm">
                  {[
                    {
                      label: "Category",
                      value: post.category,
                      editable: false,
                    },
                    {
                      label: "Status",
                      value: (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          Draft
                        </span>
                      ),
                    },
                    {
                      label: "URL",
                      value: (
                        <div className="flex items-center gap-1 group">
                          <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            /{categoryPath}/{post.slug}
                          </code>
                          <button
                            onClick={() => onEditStep?.(2)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2
                              size={14}
                              className="text-gray-400 hover:text-[#008080]"
                            />
                          </button>
                        </div>
                      ),
                    },
                    {
                      label: "Meta Title",
                      value: (
                        <div className="flex items-center gap-1 group line-clamp-1">
                          <span className="text-gray-900 dark:text-white">
                            {post.seo_meta_title || post.title}
                          </span>
                          <button
                            onClick={() => onEditStep?.(2)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2
                              size={14}
                              className="text-gray-400 hover:text-[#008080]"
                            />
                          </button>
                        </div>
                      ),
                    },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="font-medium text-gray-600 dark:text-gray-400">
                        {item.label}
                      </div>
                      <div>{item.value}</div>
                    </div>
                  ))}

                  {post.category === "development" && (
                    <>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-600 dark:text-gray-400">
                          Version
                        </div>
                        <div className="text-gray-900 dark:text-white">
                          {metadata.version || "N/A"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-600 dark:text-gray-400">
                          Release Date
                        </div>
                        <div className="text-gray-900 dark:text-white">
                          {metadata.release_date || "N/A"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ────────────────────── LIVE PREVIEW CARD ────────────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* ---------- HEADER (title + toggle on the same line) ---------- */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ExternalLink size={18} />
                Live Preview
              </h3>

              {/* Device toggle – right-aligned */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                {(
                  [
                    ["sm", Smartphone],
                    ["lg", Monitor],
                  ] as const
                ).map(([key, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setDevice(key)}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      device === key
                        ? "bg-white dark:bg-gray-800 text-[#008080] shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    aria-label={`Preview on ${key === "sm" ? "mobile" : "desktop"}`}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* ---------- PREVIEW CONTENT ---------- */}
            <div
              id="preview-container"
              className={cn(
                "mx-auto transition-all duration-300 ease-in-out bg-white",
                deviceWidths[device],
                device !== "lg" && "my-8 border border-gray-300 shadow-lg"
              )}
            >
              {/* BANNER */}
              <div className="bg-slate-50">
                <div
                  className={cn(
                    "mx-auto px-4 sm:px-6",
                    device === "sm" ? "max-w-xl" : "max-w-7xl"
                  )}
                >
                  <div
                    className={cn(
                      "grid gap-8 items-center py-12",
                      device === "lg" ? "md:grid-cols-5" : "grid-cols-1"
                    )}
                  >
                    <div className={cn(device === "lg" ? "md:col-span-2" : "")}>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(
                          post.published_at || Date.now()
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        {post.title}
                      </h1>
                      <div className="flex items-center text-gray-600">
                        <span>By KaizenHR Team (Preview)</span>
                      </div>
                    </div>

                    <div className={cn(device === "lg" ? "md:col-span-3" : "")}>
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-56 md:h-80 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-56 md:h-80 bg-gradient-to-br from-[#008080] to-[#20b2aa] flex items-center justify-center rounded-lg">
                          <span className="text-white text-2xl font-bold">
                            KaizenHR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENT + SIDEBAR */}
              <div
                className={cn(
                  "px-4 md:px-8 py-12",
                  device === "sm" ? "max-w-xl mx-auto" : "max-w-7xl mx-auto"
                )}
              >
                {device === "sm" ? (
                  <div className="space-y-12">
                    {/* Article */}
                    <article>
                      <style jsx>{`
                        article p {
                          margin-bottom: 1rem;
                        }
                        /* Keep list items tight: inner paragraphs must not
                           carry the full body margin, and blank lines around
                           lists collapse like the published renderer. */
                        article li p {
                          margin-bottom: 0.25rem;
                        }
                        article li p:last-child {
                          margin-bottom: 0;
                        }
                        article p:has(+ ul),
                        article p:has(+ ol) {
                          margin-bottom: 0.5rem;
                        }
                        article th p,
                        article td p {
                          margin-bottom: 0;
                        }
                      `}</style>
                      <div className="max-w-none">
                        <PostRenderer blocks={blocks} />
                      </div>
                    </article>

                    {/* Share */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Share this post
                      </h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => sharePost("twitter")}
                          className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          <Twitter size={20} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => sharePost("linkedin")}
                          className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          <Linkedin size={20} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => sharePost("email")}
                          className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          <Mail size={20} className="text-gray-700" />
                        </button>
                        <button
                          onClick={() => sharePost("copy")}
                          className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          {copiedLink ? (
                            <Check size={20} className="text-green-600" />
                          ) : (
                            <Link2 size={20} className="text-gray-700" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-gradient-to-br from-[#008080] to-[#20b2aa] rounded-lg p-6 text-white">
                      <h3 className="text-lg font-bold mb-2">
                        Need HR Solutions?
                      </h3>
                      <p className="text-sm mb-4 text-white/90">
                        Transform your HR management with KaizenHR. Let's
                        discuss how we can help.
                      </p>
                      <a
                        href="/company/contact-us"
                        className="inline-block w-full text-center bg-white text-[#008080] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Contact Us
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Desktop layout – unchanged */
                  <div className="flex flex-col lg:flex-row gap-12">
                    <aside
                      className="hidden lg:block lg:w-2/5 lg:sticky lg:top-24 lg:self-start"
                      style={{ maxHeight: "calc(100vh - 140px)" }}
                    >
                      <StickySidebar
                        toc={toc}
                        activeSection={activeSection}
                        postTitle={post.title}
                      />
                    </aside>
                    <article className="lg:w-3/5">
                      <div className="max-w-none">
                        <PostRenderer blocks={blocks} />
                      </div>
                    </article>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
