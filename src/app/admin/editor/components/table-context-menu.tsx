// Spreadsheet-style right-click menu for tables (Excel / Sheets-like).
// Rendered by ParagraphBlock when the user right-clicks inside a <table>.
// All commands run on the current selection, so selecting several cells
// first (drag across them) applies color / alignment to all of them.

"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Columns3,
  Combine,
  Eraser,
  PaintBucket,
  Rows3,
  Split,
  Table2,
  Trash2,
} from "lucide-react";

const CELL_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fecaca", // red
  "#e9d5ff", // purple
  "#fed7aa", // orange
  "#99f6e4", // teal
  "#e2e8f0", // gray
];

type Align = "left" | "center" | "right" | "justify";

export default function TableContextMenu({
  editor,
  position,
  onClose,
}: {
  editor: Editor;
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState(position);

  // Clamp into the viewport (flip left/up near the edges).
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      x: Math.max(8, Math.min(position.x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(position.y, window.innerHeight - rect.height - 8)),
    });
  }, [position]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  const act = (fn: () => void) => {
    fn();
    onClose();
  };

  const setAlign = (align: Align) =>
    act(() => editor.chain().focus().setTextAlign(align).run());

  const setCellColor = (color: string | null) =>
    act(() => {
      const chain = editor.chain().focus();
      if (color) {
        chain.setCellAttribute("backgroundColor", color).run();
      } else {
        chain.setCellAttribute("backgroundColor", null).run();
      }
    });

  const activeCellColor =
    editor.getAttributes("tableCell").backgroundColor ||
    editor.getAttributes("tableHeader").backgroundColor ||
    null;

  const activeAlign: Align | null =
    (editor.getAttributes("tableCell").textAlign as Align | null) ||
    (editor.getAttributes("tableHeader").textAlign as Align | null) ||
    null;

  const canMerge = editor.can().mergeCells();
  const canSplit = editor.can().splitCell();

  return (
    <>
      {/* Backdrop: click / right-click anywhere else dismisses */}
      <div
        className="fixed inset-0 z-[60] cursor-default"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        role="menu"
        style={{ left: coords.x, top: coords.y }}
        className="fixed z-[61] w-60 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl py-1.5 text-sm"
        onContextMenu={(e) => e.preventDefault()}
      >
        <MenuSection label="Row" icon={<Rows3 size={14} />}>
          <MenuItem
            icon={<ArrowUp size={15} />}
            label="Insert row above"
            onClick={() => act(() => editor.chain().focus().addRowBefore().run())}
          />
          <MenuItem
            icon={<ArrowDown size={15} />}
            label="Insert row below"
            onClick={() => act(() => editor.chain().focus().addRowAfter().run())}
          />
          <MenuItem
            icon={<Trash2 size={15} />}
            label="Delete row"
            danger
            onClick={() => act(() => editor.chain().focus().deleteRow().run())}
          />
        </MenuSection>

        <MenuSection label="Column" icon={<Columns3 size={14} />}>
          <MenuItem
            icon={<ArrowLeft size={15} />}
            label="Insert column left"
            onClick={() =>
              act(() => editor.chain().focus().addColumnBefore().run())
            }
          />
          <MenuItem
            icon={<ArrowRight size={15} />}
            label="Insert column right"
            onClick={() =>
              act(() => editor.chain().focus().addColumnAfter().run())
            }
          />
          <MenuItem
            icon={<Trash2 size={15} />}
            label="Delete column"
            danger
            onClick={() => act(() => editor.chain().focus().deleteColumn().run())}
          />
        </MenuSection>

        <MenuSection label="Cells" icon={<Combine size={14} />}>
          <MenuItem
            icon={<Combine size={15} />}
            label="Merge cells"
            disabled={!canMerge}
            hint="Select 2+ cells"
            onClick={() => act(() => editor.chain().focus().mergeCells().run())}
          />
          <MenuItem
            icon={<Split size={15} />}
            label="Split cell"
            disabled={!canSplit}
            onClick={() => act(() => editor.chain().focus().splitCell().run())}
          />
        </MenuSection>

        <MenuSection label="Text align" icon={<AlignCenter size={14} />}>
          <div className="flex items-center gap-1 px-2 pb-1">
            {(
              [
                { value: "left", Icon: AlignLeft, title: "Align left" },
                { value: "center", Icon: AlignCenter, title: "Center" },
                { value: "right", Icon: AlignRight, title: "Align right" },
                { value: "justify", Icon: AlignJustify, title: "Justify" },
              ] as const
            ).map(({ value, Icon, title }) => (
              <button
                key={value}
                title={title}
                onClick={() => setAlign(value)}
                className={`flex-1 flex items-center justify-center p-2 rounded-md transition-colors ${
                  activeAlign === value
                    ? "bg-[#008080]/15 text-[#008080] dark:text-teal-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </MenuSection>

        <MenuSection label="Cell color" icon={<PaintBucket size={14} />}>
          <div className="flex items-center gap-1.5 px-3 pb-1.5 flex-wrap">
            {CELL_COLORS.map((color) => (
              <button
                key={color}
                title={color}
                onClick={() => setCellColor(color)}
                style={{ backgroundColor: color }}
                className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
                  activeCellColor === color ||
                  activeCellColor?.toLowerCase() === color
                    ? "border-gray-900 dark:border-white ring-2 ring-offset-1 ring-gray-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
            ))}
            <button
              title="Clear color"
              onClick={() => setCellColor(null)}
              className="h-6 w-6 rounded-md border border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Eraser size={13} />
            </button>
          </div>
          <p className="px-3 pb-1 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
            Tip: drag across cells first to color several at once.
          </p>
        </MenuSection>

        <MenuSection label="Table" icon={<Table2 size={14} />} last>
          <MenuItem
            icon={<Rows3 size={15} />}
            label={
              editor.isActive("tableHeader")
                ? "Remove header row"
                : "Make first row header"
            }
            onClick={() =>
              act(() => editor.chain().focus().toggleHeaderRow().run())
            }
          />
          <MenuItem
            icon={<Trash2 size={15} />}
            label="Delete table"
            danger
            onClick={() => act(() => editor.chain().focus().deleteTable().run())}
          />
        </MenuSection>
      </div>
    </>
  );
}

function MenuSection({
  label,
  icon,
  children,
  last = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "border-b border-gray-100 dark:border-gray-700/70 pb-1 mb-1"}>
      <div className="flex items-center gap-1.5 px-3 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
    >
      <span className="shrink-0 opacity-70">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
    </button>
  );
}
