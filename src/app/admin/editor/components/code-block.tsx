// src/app/admin/editor/components/code-block.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Copy,
  CopyPlus,
  Trash2,
  Code as CodeIcon,
  FileCode2,
  Check,
  X,
} from "lucide-react";

interface CodeBlockProps {
  content: { code: string; language: string; filename?: string };
  onChange: (newContent: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "plaintext", label: "Plain Text" },
];

const TAB = "  ";
const MAX_HEIGHT = 480;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / denied permissions.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function CodeBlock({
  content,
  onChange,
  onDelete,
  onDuplicate,
}: CodeBlockProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = content.code ?? "";
  const lineCount = code === "" ? 0 : code.split("\n").length;

  // Auto-grow the textarea up to MAX_HEIGHT, then scroll internally.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, MAX_HEIGHT) + "px";
  }, [code]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const flashCopyState = (state: "copied" | "failed") => {
    setCopyState(state);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  };

  const handleCopyCode = async () => {
    if (!code) return;
    flashCopyState((await copyText(code)) ? "copied" : "failed");
  };

  // Tab inserts indentation (Shift+Tab unindents) and Enter keeps the
  // current line's indentation — without this, Tab just blurs the field.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta) return;

    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = ta;
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf("\n", s - 1) + 1;
        const removable =
          value.slice(lineStart).match(/^ {1,2}/)?.[0].length ?? 0;
        if (removable > 0) {
          const next =
            value.slice(0, lineStart) + value.slice(lineStart + removable);
          onChange({ ...content, code: next });
          requestAnimationFrame(() =>
            ta.setSelectionRange(s - removable, en - removable)
          );
        }
      } else {
        const next = value.slice(0, s) + TAB + value.slice(en);
        onChange({ ...content, code: next });
        requestAnimationFrame(() =>
          ta.setSelectionRange(s + TAB.length, s + TAB.length)
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = ta;
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const indent = value.slice(lineStart, s).match(/^[ \t]*/)?.[0] ?? "";
      // Extra indent after an opening brace / bracket / paren / colon / comma.
      const extra = /[{(\[,:]\s*$/.test(value.slice(lineStart, s)) ? TAB : "";
      const insert = "\n" + indent + extra;
      const next = value.slice(0, s) + insert + value.slice(en);
      onChange({ ...content, code: next });
      const pos = s + insert.length;
      requestAnimationFrame(() => ta.setSelectionRange(pos, pos));
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2 flex-wrap">
        <CodeIcon size={18} className="text-gray-600 dark:text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Code
        </span>

        {/* Language Selector */}
        <select
          aria-label="Code language"
          value={content.language}
          onChange={(e) => onChange({ ...content, language: e.target.value })}
          className="ml-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white max-w-[10rem]"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* Optional filename */}
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCode2
            size={15}
            className="text-gray-400 dark:text-gray-500 shrink-0"
          />
          <input
            value={content.filename ?? ""}
            onChange={(e) => onChange({ ...content, filename: e.target.value })}
            placeholder="filename e.g. app.ts"
            aria-label="Optional filename"
            spellCheck={false}
            autoComplete="off"
            className="w-36 sm:w-44 bg-transparent px-1 py-1 font-mono text-xs text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 border-b border-dashed border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex-1" />

        {/* Copy Button */}
        <button
          onClick={handleCopyCode}
          disabled={!code}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          title={code ? "Copy code" : "Nothing to copy yet"}
        >
          {copyState === "copied" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <Check size={14} /> Copied!
            </span>
          ) : copyState === "failed" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <X size={14} /> Copy failed
            </span>
          ) : (
            <Copy size={16} />
          )}
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="More options"
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <CopyPlus size={14} />
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
            </>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange({ ...content, code: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="// Enter your code here... (Tab indents, Enter keeps indent)"
          aria-label="Code content"
          className="w-full p-4 font-mono text-[13px] leading-relaxed bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-0 focus:outline-none focus:ring-0 resize-none overflow-y-auto"
          rows={6}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
          style={{
            tabSize: 2,
            minHeight: "140px",
            maxHeight: `${MAX_HEIGHT}px`,
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-mono select-none">
        <span>
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
        <span>{code.length} chars</span>
        <span className="hidden sm:inline">Tab: 2 spaces</span>
        <div className="flex-1" />
        <span>{LANGUAGES.find((l) => l.value === content.language)?.label}</span>
      </div>
    </div>
  );
}
