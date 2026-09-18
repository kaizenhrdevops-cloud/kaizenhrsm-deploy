// src/app/admin/editor/components/paragraph-block.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import toast from "react-hot-toast";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
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

  // DEBUG: Print JSON + warn on missing href/textAlign
  const debugJson = (json: any) => {
    const warnings: string[] = [];

    const walk = (node: any) => {
      if (
        (node.type === "paragraph" || node.type === "heading") &&
        !node.attrs?.textAlign
      ) {
        warnings.push(`MISSING textAlign on ${node.type}`);
      }
      if (node.marks) {
        node.marks.forEach((m: any) => {
          if (m.type === "link" && !m.attrs?.href) {
            warnings.push(`MISSING href on link: ${JSON.stringify(m)}`);
          }
        });
      }
      if (node.content) node.content.forEach(walk);
    };

    if (json.content) json.content.forEach(walk);

    if (warnings.length > 0) {
      console.warn("EDITOR WARNINGS:", warnings.join(" | "));
    }

    console.log(
      "%cEDITOR JSON →",
      "color: #06b6d4; font-weight: bold;",
      JSON.stringify(json, null, 2)
    );
  };

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

      Placeholder.configure({ placeholder: "Type / to see commands..." }),

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

      // TEXT ALIGN — FIXED: saves textAlign on node
      TextAlign.configure({
        types: ["paragraph", "heading"],
        defaultAlignment: "left",
      }),

      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "border-collapse w-full" },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],

    content: content,

    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] px-4 py-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:list-outside [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:list-outside [&_li]:my-1 [&_table]:my-4 [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:font-bold [&_th]:bg-gray-100 dark:[&_th]:bg-gray-700 select-text",
      },
    },

    onUpdate: ({ editor }) => {
      // Force fresh state
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      console.log("FRESH JSON →", json);
      onChange(json);
    },
  });

  const addLink = () => {
    if (!linkUrl || !editor) return;

    let url = linkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.error("Please select some text first.");
      return;
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

    setLinkUrl("");
    setShowLinkInput(false);
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
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

      <EditorContent editor={editor} />
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
