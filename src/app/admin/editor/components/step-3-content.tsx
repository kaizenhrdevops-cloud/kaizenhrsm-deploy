// src/app/admin/editor/components/step-3-content.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Database } from "@/types/supabase";
import FeaturedImageUploader from "./featured-image-uploader";
import { autoSaveDraft } from "../../posts/actions";
import { BlockWrapper } from "./block-wrapper";
import { createDefaultContent, type BlockType } from "./block-defaults";
import dynamic from "next/dynamic";

// Dynamically import the other blocks to reduce initial bundle size
const ParagraphBlock = dynamic(() => import("./paragraph-block"), {
  ssr: false,
});
const HeadingBlock = dynamic(() => import("./heading-block"));
const ImageBlock = dynamic(() => import("./image-block"));
const VideoBlock = dynamic(() => import("./video-block"));
const QuoteBlock = dynamic(() => import("./quote-block"));
const CodeBlock = dynamic(() => import("./code-block"));
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  PlusCircle,
  Type,
  Heading1,
  Image,
  Video,
  Quote,
  Code,
  X,
  Table,
} from "lucide-react";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];

interface Step3ContentProps {
  post: Post;
  setPost: React.Dispatch<React.SetStateAction<Post>>;
  blocks: PostBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<PostBlock[]>>;
  getEditorJSON: React.MutableRefObject<(() => any) | undefined>;
  setAutoSaveStatus: (status: "idle" | "saving" | "saved") => void;
  flushRef?: React.MutableRefObject<(() => Promise<boolean>) | undefined>;
}

export default function Step3Content({
  post,
  setPost,
  blocks,
  setBlocks,
  getEditorJSON,
  setAutoSaveStatus,
  flushRef,
}: Step3ContentProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  // Id of the block currently being dragged (drives the DragOverlay preview)
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : undefined;

  // --- Autosave Logic ---
  // Latest snapshots for the debounced saver / flush (avoids stale closures).
  const blocksRef = useRef(blocks);
  const postRef = useRef(post);
  blocksRef.current = blocks;
  postRef.current = post;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true); // To prevent saving on initial load
  const isSavingRef = useRef(false);

  // The function that performs the save. Returns true on success.
  const savePost = useCallback(async (): Promise<boolean> => {
    if (isSavingRef.current) return false;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    isSavingRef.current = true;
    setAutoSaveStatus("saving");

    try {
      // Calls the draft function with the LATEST state via refs
      const result = await autoSaveDraft(
        postRef.current.id,
        postRef.current,
        blocksRef.current
      );

      setAutoSaveStatus(result.success ? "saved" : "idle");
      return result.success;
    } catch {
      setAutoSaveStatus("idle");
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [setAutoSaveStatus]);

  // Flush = cancel pending debounce + save immediately.
  // Registered to the parent so Next/Back can await it before unmount.
  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = async () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return savePost();
    };
    return () => {
      flushRef.current = undefined;
    };
  }, [flushRef, savePost]);

  // This effect listens for changes and sets the debounce timer
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAutoSaveStatus("idle");
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      void savePost();
    }, 2000);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // Depend on the VALUES (not the saver) so edits re-arm the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, blocks]);
  // --- END: Autosave Logic ---

  // Expose a function to get all blocks as JSON (always latest via ref)
  React.useEffect(() => {
    getEditorJSON.current = () => {
      return { blocks: blocksRef.current };
    };
  }, [getEditorJSON]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Gentle settle animation when the preview drops into place.
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } },
    }),
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: PostBlock = {
      id: crypto.randomUUID(),
      post_id: post.id,
      type: type,
      content: createDefaultContent(type),
      order_index: blocks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBlocks((prev) => [...prev, newBlock]);
    setShowBlockMenu(false);
  };

  const handleBlockChange = (blockId: string, newContent: any) => {

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: newContent,
              updated_at: new Date().toISOString(),
            }
          : block
      )
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((block) => block.id !== blockId);
      // Re-index after deletion
      return filtered.map((block, index) => ({
        ...block,
        order_index: index,
      }));
    });
  };

  const handleDuplicateBlock = (blockId: string) => {
    const blockToDuplicate = blocks.find((b) => b.id === blockId);
    if (!blockToDuplicate) return;

    const newBlock: PostBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      order_index: blockToDuplicate.order_index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks.splice(blockToDuplicate.order_index + 1, 0, newBlock);
      // Re-index
      return newBlocks.map((block, index) => ({
        ...block,
        order_index: index,
      }));
    });
  };

  const handleConvertBlock = (
    blockId: string,
    newType: "paragraph" | "heading" | "quote"
  ) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;

        let newContent: any = {};
        const oldContent = block.content as any;

        // Try to preserve text content when converting
        switch (newType) {
          case "paragraph":
            newContent = {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: oldContent.text
                    ? [{ type: "text", text: oldContent.text }]
                    : [],
                },
              ],
            };
            break;
          case "heading":
            newContent = {
              level: 2,
              text:
                oldContent.text ||
                oldContent.content?.[0]?.content?.[0]?.text ||
                "",
            };
            break;
          case "quote":
            newContent = {
              text:
                oldContent.text ||
                oldContent.content?.[0]?.content?.[0]?.text ||
                "",
              author: "",
            };
            break;
        }

        return {
          ...block,
          type: newType,
          content: newContent,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = Array.from(items);
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        return newItems.map((item, index) => ({ ...item, order_index: index }));
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const renderBlock = (block: PostBlock) => {
    const baseProps = {
      onChange: (newContent: any) => handleBlockChange(block.id, newContent),
      onDelete: () => handleDeleteBlock(block.id),
      onDuplicate: () => handleDuplicateBlock(block.id),
      onConvert: (newType: any) => handleConvertBlock(block.id, newType),
    };

    switch (block.type) {
      case "paragraph":
      case "table": // Use same component for table blocks
        return <ParagraphBlock content={block.content as any} {...baseProps} />;
      case "heading":
        return <HeadingBlock content={block.content as any} {...baseProps} />;
      case "image":
        return (
          <ImageBlock
            content={block.content as any}
            postId={post.id}
            {...baseProps}
          />
        );
      case "video":
        return <VideoBlock content={block.content as any} {...baseProps} />;
      case "quote":
        return <QuoteBlock content={block.content as any} {...baseProps} />;
      case "code":
        return <CodeBlock content={block.content as any} {...baseProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title Block */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <div className="border-b border-gray-200 dark:border-gray-700 p-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Post Title
            </span>
          </div>
          <textarea
            rows={1}
            value={post.title || ""}
            onChange={(e) => {
              setPost((prev) => ({ ...prev, title: e.target.value }));
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-0 resize-none focus:ring-0 focus:outline-none p-4 overflow-hidden text-gray-900 dark:text-white"
            placeholder="Enter post title..."
            style={{ minHeight: "4rem" }}
          />
        </div>

        {/* Featured Image Block */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <div className="border-b border-gray-200 dark:border-gray-700 p-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Featured Image
            </span>
          </div>
          <div className="p-4">
            <FeaturedImageUploader post={post} setPost={setPost} />
          </div>
        </div>

        {/* Content Blocks */}
        <div className="py-4 relative space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <BlockWrapper key={block.id} id={block.id}>
                  {renderBlock(block)}
                </BlockWrapper>
              ))}
            </SortableContext>
            {/* Floating preview that follows the cursor. Static snapshot
                (not a second live editor) so it can't stretch, steal focus,
                or double-mount TipTap instances mid-drag. */}
            <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
              {activeBlock ? (
                <DragPreviewCard block={activeBlock} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Add Block Button */}
        <div className="relative">
          <button
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            className="inline-flex items-center gap-1 px-4 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <PlusCircle size={16} />
            Add Block
          </button>

          {/* Block Type Menu */}
          {showBlockMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="p-2 space-y-1">
                <BlockMenuItem
                  icon={<Type size={18} />}
                  label="Paragraph"
                  description="Rich text content"
                  onClick={() => handleAddBlock("paragraph")}
                />
                <BlockMenuItem
                  icon={<Heading1 size={18} />}
                  label="Heading"
                  description="Section title"
                  onClick={() => handleAddBlock("heading")}
                />
                <BlockMenuItem
                  icon={<Image size={18} />}
                  label="Image"
                  description="Upload or embed"
                  onClick={() => handleAddBlock("image")}
                />
                <BlockMenuItem
                  icon={<Video size={18} />}
                  label="Video"
                  description="YouTube embed"
                  onClick={() => handleAddBlock("video")}
                />
                <BlockMenuItem
                  icon={<Quote size={18} />}
                  label="Quote"
                  description="Highlighted quote"
                  onClick={() => handleAddBlock("quote")}
                />
                <BlockMenuItem
                  icon={<Table size={18} />}
                  label="Table"
                  description="Data table"
                  onClick={() => handleAddBlock("table")}
                />
                <BlockMenuItem
                  icon={<Code size={18} />}
                  label="Code"
                  description="Code snippet"
                  onClick={() => handleAddBlock("code")}
                />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <button
                  onClick={() => setShowBlockMenu(false)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <X size={16} />
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* Static drag preview — plain snapshot, never a live editor instance. */
function DragPreviewCard({ block }: { block: PostBlock }) {
  const meta = BLOCK_PREVIEW_META[block.type] ?? {
    label: block.type,
    Icon: Type,
  };
  const { Icon } = meta;
  const preview = getBlockPreview(block);

  return (
    <div className="w-[min(56rem,calc(100vw-3rem))] max-h-[300px] overflow-hidden rounded-xl border-2 border-[#008080] bg-white dark:bg-gray-800 shadow-2xl pointer-events-none">
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008080]/10 px-2.5 py-0.5 text-xs font-semibold text-[#008080] dark:text-teal-300">
          <Icon size={13} />
          {meta.label}
        </span>
        <span className="text-xs text-gray-400">Moving…</span>
      </div>
      <div className="px-4 py-3">
        {block.type === "image" && (block.content as any)?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(block.content as any).url}
            alt=""
            className="h-28 w-full rounded-lg object-cover"
          />
        ) : block.type === "heading" ? (
          <p className="truncate text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {preview || "Heading"}
          </p>
        ) : (
          <p className="line-clamp-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {preview || "Empty block"}
          </p>
        )}
      </div>
    </div>
  );
}

const BLOCK_PREVIEW_META: Record<
  string,
  { label: string; Icon: typeof Type }
> = {
  paragraph: { label: "Paragraph", Icon: Type },
  heading: { label: "Heading", Icon: Heading1 },
  image: { label: "Image", Icon: Image },
  video: { label: "Video", Icon: Video },
  quote: { label: "Quote", Icon: Quote },
  code: { label: "Code", Icon: Code },
  table: { label: "Table", Icon: Table },
};

/** Plain-text excerpt of a block for the drag preview. */
function getBlockPreview(block: PostBlock): string {
  const c = block.content as any;
  if (!c) return "";
  switch (block.type) {
    case "heading":
    case "quote":
      return (c.text || "").toString().slice(0, 220);
    case "code":
      return (c.code || "").toString().slice(0, 220);
    case "video":
      return (c.url || "").toString().slice(0, 220);
    case "image":
      return (c.caption || c.alt || "").toString().slice(0, 220);
    case "paragraph":
    case "table":
    default:
      return extractTiptapText(c).slice(0, 220);
  }
}

function extractTiptapText(node: any): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (typeof node.text === "string" && !node.content) return node.text;
  if (Array.isArray(node.content)) {
    return node.content
      .map(extractTiptapText)
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function BlockMenuItem({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start gap-3"
    >
      <div className="text-gray-600 dark:text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-sm text-gray-900 dark:text-white">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
    </button>
  );
}
