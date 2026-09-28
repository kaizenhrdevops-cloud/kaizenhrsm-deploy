// src/app/admin/editor/components/paragraph-block.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import toast from "react-hot-toast";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import {
  CustomTableCell,
  CustomTableHeader,
} from "./table-extensions";
import TableContextMenu from "./table-context-menu";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Strikethrough,
  UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  Link as LinkIcon,
  MoreHorizontal,
  Copy,
  Trash2,
  Heading1,
  Quote,
  Undo,
  Redo,
  Table as TableIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";

interface ParagraphBlockProps {
  content: any;
  onChange: (newContent: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onConvert: (newType: "paragraph" | "heading" | "quote") => void;
}

export default function ParagraphBlock({
  content,
  onChange,
  onDelete,
  onDuplicate,
  onConvert,
}: ParagraphBlockProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  // Inline URL field inside the selection bubble menu.
  const [showBubbleLinkInput, setShowBubbleLinkInput] = useState(false);
  const [bubbleLinkUrl, setBubbleLinkUrl] = useState("");
  // Right-click (spreadsheet-style) table menu position, if open.
  const [tableMenuPos, setTableMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        link: false,
        underline: false,
        strike: false,
      }),

      Placeholder.configure({
        placeholder: "Start writing… (select text to format it)",
      }),

      // LINK — FIXED: href, target, rel saved
      Link.extend({
        addAttributes() {
          return {
            href: { default: null },
            target: { default: "_blank" },
            rel: { default: "noopener noreferrer nofollow" },
            class: {
              default:
                "text-[#008080] hover:text-[#006666] underline font-medium transition-colors",
            },
          };
        },
      }).configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-[#008080] hover:text-[#006666] underline font-medium transition-colors",
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),

      Underline,

      Highlight.configure({
        multicolor: true,
        HTMLAttributes: { class: "bg-yellow-200 dark:bg-yellow-800" },
      }),

      // TEXT ALIGN — includes table cells so alignment buttons and the
      // right-click menu work on text inside tables too.
      TextAlign.configure({
        types: ["paragraph", "heading", "tableHeader", "tableCell"],
        defaultAlignment: "left",
      }),

      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "border-collapse w-full" },
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
    ],

    // Fall back to an empty doc for legacy / malformed block content
    // instead of crashing the whole editor step.
    content: content ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },

    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] px-4 py-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:list-outside [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:list-outside [&_li]:my-1 [&_table]:my-4 [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:font-bold [&_th]:bg-gray-100 dark:[&_th]:bg-gray-700 select-text",
      },
    },

    onUpdate: ({ editor }) => {
      // Fresh (cloned) state so later editor mutations can't corrupt
      // what we already handed to autosave.
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      onChange(json);
    },
  });

  // Shared by the toolbar link popup and the bubble-menu link field.
  // Returns true when a link was applied.
  const applyLink = (rawUrl: string): boolean => {
    if (!editor) return false;
    const trimmed = rawUrl.trim();
    if (!trimmed) return false;

    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.error("Please select some text first.");
      return false;
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: url,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      })
      .run();
    return true;
  };

  const addLink = () => {
    if (!linkUrl || !editor) return;
    if (applyLink(linkUrl)) {
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const applyBubbleLink = () => {
    if (applyLink(bubbleLinkUrl)) {
      setBubbleLinkUrl("");
      setShowBubbleLinkInput(false);
    }
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
  };

  // Spreadsheet-style right-click: only hijack the menu when the click is
  // inside a table — everywhere else keeps the native browser menu.
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editor) return;
    const target = e.target as HTMLElement | null;
    const clickedInTable = !!target?.closest?.("table");
    if (!clickedInTable && !editor.isActive("table")) return;

    e.preventDefault();

    // If the cursor isn't already in a table (e.g. right-clicking a cell
    // while editing elsewhere), jump it to the clicked cell so row / column
    // / cell commands hit the right place. An existing table selection
    // (including multi-cell drag selections) is left untouched.
    if (!editor.isActive("table")) {
      try {
        const coords = editor.view.posAtCoords({
          left: e.clientX,
          top: e.clientY,
        });
        if (coords) {
          editor.commands.setTextSelection(coords.pos);
        }
      } catch {
        // Fall through and operate on the current selection.
      }
    }

    setTableMenuPos({ x: e.clientX, y: e.clientY });
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={16} />
        </ToolbarButton>
        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter size={16} />
        </ToolbarButton>
        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <Divider />

        {/* ALIGNMENT */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify size={16} />
        </ToolbarButton>
        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </ToolbarButton>

        <div className="relative">
          <ToolbarButton
            onClick={() => {
              if (editor.isActive("table")) {
                setShowTableMenu(!showTableMenu);
              } else {
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run();
              }
            }}
            isActive={editor.isActive("table")}
            title={editor.isActive("table") ? "Table Options" : "Insert Table"}
          >
            <TableIcon size={16} />
          </ToolbarButton>
          {showTableMenu && editor.isActive("table") && (
            <TableDropdown
              editor={editor}
              onClose={() => setShowTableMenu(false)}
            />
          )}
        </div>
        <Divider />

        <div className="relative">
          <ToolbarButton
            onClick={() => {
              if (editor.isActive("link")) {
                removeLink();
              } else {
                setShowLinkInput(!showLinkInput);
              }
            }}
            isActive={editor.isActive("link")}
            title="Add / Edit Link"
          >
            <LinkIcon size={16} />
          </ToolbarButton>

          {showLinkInput && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 w-72">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                  if (e.key === "Escape") setShowLinkInput(false);
                }}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addLink}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Link
                </button>
                <button
                  onClick={() => setShowLinkInput(false)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="relative">
          <ToolbarButton
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More"
          >
            <MoreHorizontal size={16} />
          </ToolbarButton>
          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {
                  onDuplicate();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy size={14} /> Duplicate
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onConvert("heading");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Heading1 size={14} /> Convert to Heading
                </button>
                <button
                  onClick={() => {
                    onConvert("quote");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Quote size={14} /> Convert to Quote
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onDelete();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div onContextMenu={handleContextMenu} className="relative">
        <EditorContent editor={editor} />
        {tableMenuPos && (
          <TableContextMenu
            editor={editor}
            position={tableMenuPos}
            onClose={() => setTableMenuPos(null)}
          />
        )}
      </div>

      {/* Selection bubble: format without scrolling back to the toolbar.
          Appears on any non-empty text selection (including table cells). */}
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 10 }}
        shouldShow={({ editor, state }) => {
          const { from, to } = state.selection;
          return from !== to && editor.isEditable;
        }}
      >
        <div className="flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-0.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl px-1.5 py-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter size={15} />
          </ToolbarButton>
          <Divider />
          {showBubbleLinkInput ? (
            <div className="flex items-center gap-1 pl-1">
              <input
                value={bubbleLinkUrl}
                onChange={(e) => setBubbleLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyBubbleLink();
                  }
                  if (e.key === "Escape") {
                    setShowBubbleLinkInput(false);
                    setBubbleLinkUrl("");
                  }
                }}
                placeholder="https://…"
                aria-label="Link URL"
                autoFocus
                className="w-44 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={applyBubbleLink}
                title="Apply link"
                aria-label="Apply link"
                className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => {
                  setShowBubbleLinkInput(false);
                  setBubbleLinkUrl("");
                }}
                title="Cancel"
                aria-label="Cancel"
                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <ToolbarButton
              onClick={() => {
                if (editor.isActive("link")) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  setBubbleLinkUrl("");
                  setShowBubbleLinkInput(true);
                }
              }}
              isActive={editor.isActive("link")}
              title={
                editor.isActive("link") ? "Remove link" : "Add link"
              }
            >
              <LinkIcon size={15} />
            </ToolbarButton>
          )}
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify size={15} />
          </ToolbarButton>
        </div>
      </BubbleMenu>
    </div>
  );
}

/* Helper Components */
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
          : "text-gray-700 dark:text-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />;
}

function TableDropdown({
  editor,
  onClose,
}: {
  editor: any;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
      <button
        onClick={() => {
          editor.chain().focus().addRowBefore().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add row above
      </button>
      <button
        onClick={() => {
          editor.chain().focus().addRowAfter().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add row below
      </button>
      <button
        onClick={() => {
          editor.chain().focus().deleteRow().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Delete row
      </button>
      <div className="border-t border-gray-200 dark:border-gray-700" />
      <button
        onClick={() => {
          editor.chain().focus().addColumnBefore().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add column left
      </button>
      <button
        onClick={() => {
          editor.chain().focus().addColumnAfter().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Add column right
      </button>
      <button
        onClick={() => {
          editor.chain().focus().deleteColumn().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Delete column
      </button>
      <div className="border-t border-gray-200 dark:border-gray-700" />
      <button
        onClick={() => {
          editor.chain().focus().mergeCells().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Merge cells
      </button>
      <button
        onClick={() => {
          editor.chain().focus().splitCell().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Split cell
      </button>
      <div className="border-t border-gray-200 dark:border-gray-700" />
      <button
        onClick={() => {
          editor.chain().focus().deleteTable().run();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Delete table
      </button>
    </div>
  );
}
