// src/components/blog/PostRenderer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Core bundle already ships markup / css / clike / javascript — everything
// else the editor offers is imported here so published snippets actually
// highlight instead of rendering as plain text.
// Order matters: dependencies first.
import "prismjs/components/prism-markup";
// Required by the PHP grammar (its before-tokenize hook calls
// tokenizePlaceholders from markup-templating — without this import,
// any page containing a PHP block crashes highlightAll).
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-php";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

type Block = {
  id: string;
  type: string;
  content: any;
  order_index: number;
};

// Labels for the published code header (mirrors the editor's list).
const CODE_LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  c: "C",
  php: "PHP",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  yaml: "YAML",
  markdown: "Markdown",
  bash: "Bash",
  plaintext: "Plain text",
};

async function copyTextToClipboard(text: string): Promise<boolean> {
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

// An "empty" paragraph = no content, or only whitespace text.
// TipTap inserts these when the author hits Enter for a visual gap —
// rendered at full size they blow the paragraph→list spacing wide open.
const isEmptyParagraphNode = (node: any): boolean => {
  if (!node || node.type !== "paragraph") return false;
  if (!node.content || node.content.length === 0) return true;
  return node.content.every(
    (child: any) =>
      !child.text ||
      (typeof child.text === "string" && child.text.trim() === "")
  );
};

const isListNode = (node: any): boolean =>
  !!node &&
  (node.type === "bulletList" || node.type === "orderedList");

/**
 * Collapse redundant blank lines inside a TipTap doc before rendering:
 * - drop leading / trailing empty paragraphs
 * - collapse consecutive empty paragraphs into one
 * - drop an empty paragraph wedged directly before / after a list
 *   (the list's own mt/mb already provides that gap — keeping both is
 *   what caused the oversized paragraph→bullet spacing on publish)
 */
const normalizeDocChildren = (nodes: any[]): any[] => {
  const isEmpty = isEmptyParagraphNode;
  // 1. Trim leading / trailing empties
  let start = 0;
  let end = nodes.length;
  while (start < end && isEmpty(nodes[start])) start++;
  while (end > start && isEmpty(nodes[end - 1])) end--;
  const trimmed = nodes.slice(start, end);

  // 2. Collapse runs + drop empties adjacent to lists
  const out: any[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    const n = trimmed[i];
    if (isEmpty(n)) {
      const prev = out[out.length - 1];
      const next = trimmed[i + 1];
      // skip if previous kept node is empty or a list, or next is a list
      if (!prev || isEmpty(prev) || isListNode(prev) || isListNode(next))
        continue;
      out.push(n);
      continue;
    }
    out.push(n);
  }
  return out;
};

// Attribute sanitizers — block content is admin-authored, but pasted rich
// text can smuggle crafted mark/node attrs into stored JSON, so everything
// interpolated into the HTML string is validated here.
const SAFE_CSS_COLOR_FALLBACK = "#fef9c3";

function sanitizeCssColor(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (!v || /["';<>`]/.test(v)) return fallback;
  if (!/^[a-zA-Z0-9#(),.\s%/-]+$/.test(v)) return fallback;
  return v;
}

function sanitizeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().replace(/["'<>`\s]/g, "");
  if (!v) return null;
  // Safe protocols + site-relative links only.
  if (!/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(v)) return null;
  return v;
}

const SAFE_TEXT_ALIGNS = new Set(["left", "center", "right", "justify"]);

function sanitizeTextAlign(value: unknown): string {
  return typeof value === "string" && SAFE_TEXT_ALIGNS.has(value) ? value : "";
}

// FULLY FIXED: Dark text, bold links, centered text, no prose override
const renderTiptapContent = (node: any): string => {
  if (!node) return "";

  // Handle text nodes
  if (node.type === "text" && node.text) {
    let html = node.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // Apply marks (bold, link, etc.)
    if (node.marks) {
      const marks = [...node.marks].reverse();
      marks.forEach((mark) => {
        switch (mark.type) {
          case "bold":
            html = `<strong>${html}</strong>`;
            break;
          case "italic":
            html = `<em>${html}</em>`;
            break;
          case "strike":
            html = `<s>${html}</s>`;
            break;
          case "underline":
            html = `<u>${html}</u>`;
            break;
          case "code":
            html = `<code class="bg-slate-100 text-slate-800 font-mono text-[0.875em] px-1.5 py-0.5 rounded-md border border-slate-200/80 font-medium">${html}</code>`;
            break;
          case "highlight":
            html = `<mark style="background-color: ${sanitizeCssColor(mark.attrs?.color, "#fef9c3")}" class="px-1 py-0.5 rounded text-gray-900">${html}</mark>`;
            break;
          case "link": {
            // Only safe protocols become links — anything else renders as
            // plain text so a crafted href can't execute script.
            const safeHref = sanitizeHref(mark.attrs?.href);
            if (safeHref) {
              const target =
                mark.attrs?.target === "_self" ? "_self" : "_blank";
              html = `<a href="${safeHref}" class="text-[#008080] hover:text-[#006666] underline font-semibold transition-colors" target="${target}" rel="noopener noreferrer nofollow">${html}</a>`;
            }
            break;
          }
        }
      });
    }
    return html;
  }

  // Handle container nodes (doc-level normalisation first so blank lines
  // around lists collapse instead of stacking margins on publish).
  if (node.type === "doc" && Array.isArray(node.content)) {
    return normalizeDocChildren(node.content)
      .map(renderTiptapContent)
      .join("");
  }
  const children = node.content
    ? node.content.map(renderTiptapContent).join("")
    : "";

  // Apply textAlign (+ cell background for table cells).
  // backgroundColor is sanitized: only allow plain color values so a
  // crafted attribute can't break out of the style string.
  const safeBg =
    node.type === "tableHeader" || node.type === "tableCell"
      ? sanitizeCssColor(node.attrs?.backgroundColor)
      : "";
  const textAlign = sanitizeTextAlign(node.attrs?.textAlign);
  const cellBg = safeBg ? `background-color: ${safeBg};` : "";
  const styleAttr =
    textAlign || cellBg
      ? ` style="${textAlign ? `text-align: ${textAlign};` : ""}${cellBg}"`
      : "";

  switch (node.type) {
    case "paragraph":
      // Empty paragraphs (blank lines in the editor) render small so they
      // read as a normal line break instead of a double-spaced chasm.
      if (isEmptyParagraphNode(node)) {
        return `<p class="mb-1 leading-tight text-gray-900 font-medium text-sm"${styleAttr}>&nbsp;</p>`;
      }
      return `<p class="mb-4 leading-relaxed text-gray-900 font-medium"${styleAttr}>${children || "&nbsp;"}</p>`;

    case "heading":
      const level = node.attrs?.level || 2;
      const headingClass = `font-bold mb-4 mt-8 text-gray-900`;
      const sizeClass =
        level === 1
          ? "text-4xl"
          : level === 2
            ? "text-3xl"
            : level === 3
              ? "text-2xl"
              : "text-xl";
      return `<h${level} class="${sizeClass} ${headingClass}"${styleAttr}>${children}</h${level}>`;

    case "bulletList":
      return `<ul class="list-disc pl-6 mt-1 mb-4 space-y-1.5"${styleAttr}>${children}</ul>`;

    case "orderedList":
      return `<ol class="list-decimal pl-6 mt-1 mb-4 space-y-1.5"${styleAttr}>${children}</ol>`;

    case "listItem":
      return `<li class="leading-relaxed"${styleAttr}>${children}</li>`;

    case "horizontalRule":
      return '<hr class="my-8 border-t-2 border-gray-200">';

    // CHANGED: Updated table styles for a modern look
    case "table":
      return `<div class="overflow-x-auto my-6 rounded-lg shadow-md border border-gray-200"><table class="w-full border-collapse">${children}</table></div>`;

    // CHANGED: Updated table row styles
    case "tableRow":
      return `<tr class="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/70 transition-colors">${children}</tr>`;

    // CHANGED: Updated table header styles
    case "tableHeader":
      return `<th class="px-6 py-4 bg-[#f0fafa] text-[#006666] font-semibold text-sm text-center align-middle"${styleAttr}>${children}</th>`;

    // CHANGED: Updated table cell styles
    case "tableCell":
      return `<td class="px-6 py-4 text-gray-800 text-center align-middle"${styleAttr}>${children}</td>`;

    case "doc":
      return children;

    default:
      return children;
  }
};

export default function PostRenderer({ blocks }: { blocks: Block[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const copyCode = (code: string, blockId: string) => {
    copyTextToClipboard(code).then((ok) => {
      if (!ok) return;
      setCopiedCode(blockId);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const extractYouTubeId = (url: string) => {
    if (!url) return "";
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/
    );
    return match ? match[1] : "";
  };

  const renderBlock = (block: Block) => {
    const blockId = `heading-${block.id}`;

    switch (block.type) {
      case "heading": {
        const { level, text } = block.content;
        const commonProps = {
          id: blockId,
          className:
            level === 2
              ? "text-3xl font-bold text-gray-900 mb-6 mt-12"
              : "text-2xl font-bold text-gray-800 mb-4 mt-8",
        };

        switch (level) {
          case 1:
            return <h1 {...commonProps}>{text}</h1>;
          case 2:
            return <h2 {...commonProps}>{text}</h2>;
          case 3:
            return <h3 {...commonProps}>{text}</h3>;
          case 4:
            return <h4 {...commonProps}>{text}</h4>;
          case 5:
            return <h5 {...commonProps}>{text}</h5>;
          case 6:
            return <h6 {...commonProps}>{text}</h6>;
          default:
            return <p {...commonProps}>{text}</p>;
        }
      }

      case "paragraph":
      case "table":
        return (
          <div
            key={block.id}
            dangerouslySetInnerHTML={{
              __html: renderTiptapContent(block.content),
            }}
          />
        );

      case "image":
        return (
          <figure className="my-8">
            <img
              src={block.content.url}
              alt={block.content.alt || ""}
              className="w-full rounded-lg shadow-md"
            />
            {block.content.caption && (
              <figcaption className="text-center text-sm text-gray-600 mt-3">
                {block.content.caption}
              </figcaption>
            )}
          </figure>
        );

      case "video":
        const videoId = extractYouTubeId(block.content.url);
        if (!videoId) return null;
        return (
          <figure className="my-8">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allowFullScreen
                title="YouTube Video"
              />
            </div>
            {block.content.caption && (
              <figcaption className="text-center text-sm text-gray-600 mt-3">
                {block.content.caption}
              </figcaption>
            )}
          </figure>
        );

      case "quote":
        return (
          <blockquote className="my-8 pl-6 py-4 border-l-4 border-[#008080] bg-[#f0fafa] rounded-r-lg">
            <p className="text-xl italic text-gray-800 mb-2">
              {block.content.text}
            </p>
            {block.content.author && (
              <cite className="text-sm text-gray-600 not-italic">
                — {block.content.author}
              </cite>
            )}
          </blockquote>
        );

      case "code": {
        const rawCode = (block.content.code ?? "").toString();
        // Don't publish an empty dark box for untouched code blocks.
        if (!rawCode.trim()) return null;
        return (
          <CodeBlockView
            key={block.id}
            block={block}
            isCopied={copiedCode === block.id}
            onCopy={copyCode}
          />
        );
      }

      default:
        return null;
    }
  };

  // REMOVED `prose` CLASS → NO MORE MUTED TEXT
  return (
    <div className="max-w-none">
      {/* CHANGED: This style tag fixes the vertical alignment bug.
        It targets paragraphs inside your table cells and removes 
        the bottom margin that Tiptap adds by default.
      */}
      <style jsx global>{`
        .max-w-none th p,
        .max-w-none td p {
          margin-bottom: 0;
        }
        /* Paragraphs nested inside list items must not carry the full
           body-paragraph margin — that stacked mb-4 is what stretched
           bullets apart and pushed lists away from their intro text. */
        .max-w-none li p {
          margin-bottom: 0.25rem;
        }
        .max-w-none li p:last-child {
          margin-bottom: 0;
        }
        /* Tighten the intro-paragraph → list handoff to match the editor. */
        .max-w-none p:has(+ ul),
        .max-w-none p:has(+ ol) {
          margin-bottom: 0.5rem;
        }
        .max-w-none ul + p,
        .max-w-none ol + p {
          margin-top: 0.75rem;
        }
        /* Wrapped code view: break long lines instead of scrolling.
           Plain CSS (not a Tailwind important override) so it always wins
           over the Prism theme white-space rule. */
        .max-w-none pre.code-wrap code {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
      `}</style>

      {blocks.map((block) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}
    </div>
  );
}

// Long snippets start collapsed so they don't dominate the article.
const CODE_COLLAPSE_AFTER_LINES = 20;
const CODE_COLLAPSED_MAX_HEIGHT = 340;

/**
 * Published code snippet: language badge + filename, copy, line numbers,
 * word-wrap toggle, and collapse/expand for long snippets.
 */
function CodeBlockView({
  block,
  isCopied,
  onCopy,
}: {
  block: Block;
  isCopied: boolean;
  onCopy: (code: string, blockId: string) => void;
}) {
  const rawCode = (block.content.code ?? "").toString();
  const lang = (block.content.language || "plaintext").toString();
  const filename = (block.content.filename ?? "").toString().trim();
  const lineCount = rawCode.split("\n").length;
  const collapsible = lineCount > CODE_COLLAPSE_AFTER_LINES;

  const [expanded, setExpanded] = useState(!collapsible);
  const [wrap, setWrap] = useState(false);

  // Prism has no "plaintext" grammar — encode only, no language-* class,
  // so nothing downstream tries (and fails) to highlight it.
  // Runs DURING render (identical on server + client): the old
  // highlightAll-in-effect approach mutated the DOM after hydration
  // (Prism core adds tabindex + token spans), causing hydration mismatches.
  const highlighted = (() => {
    try {
      if (lang === "plaintext") return Prism.util.encode(rawCode) as string;
      const grammar = (Prism.languages as Record<string, unknown>)[lang];
      if (!grammar) return Prism.util.encode(rawCode) as string;
      return Prism.highlight(rawCode, grammar as never, lang);
    } catch (err) {
      // Highlighting must never take down the article.
      console.error("Prism highlighting failed:", err);
      return Prism.util.encode(rawCode) as string;
    }
  })();
  const codeClass = lang === "plaintext" ? "text-gray-200" : `language-${lang}`;
  const showGutter = lineCount > 1;

  return (
    // Dark backing on the card itself: with overflow:auto + a fixed
    // max-height + rounded clipping, Chrome can leave fractional-pixel
    // paint seams at the scroll-box edges on first paint — without this,
    // the white page background bleeds through as thin white strips.
    <div className="my-8 overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#2d2d2d] shadow-md">
      <div className="flex items-center gap-2 bg-[#2d2d2d] px-4 py-2.5 border-b border-white/10">
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-gray-200">
          {CODE_LANGUAGE_LABELS[lang] ?? lang}
        </span>
        {filename && (
          <span className="truncate font-mono text-xs text-gray-400">
            {filename}
          </span>
        )}
        <span className="hidden sm:inline font-mono text-[11px] text-gray-500">
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setWrap((w) => !w)}
          aria-pressed={wrap}
          title={wrap ? "Disable word wrap" : "Enable word wrap"}
          className={`rounded-md px-2 py-1 font-mono text-xs font-medium transition-colors ${
            wrap
              ? "bg-white/15 text-white"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          Wrap
        </button>
        <button
          onClick={() => onCopy(rawCode, block.id)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy code to clipboard"
        >
          {isCopied ? (
            <>
              <Check size={14} className="text-green-400" /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy
            </>
          )}
        </button>
      </div>
      {/* Gutter is plain React (sticky while scrolling) — no plugin spans,
          so there is nothing for hydration to disagree about. */}
      <div
        className="flex overflow-auto bg-[#2d2d2d]"
        style={expanded ? undefined : { maxHeight: CODE_COLLAPSED_MAX_HEIGHT }}
      >
        {showGutter && (
          <div
            aria-hidden
            className="sticky left-0 select-none bg-[#2d2d2d] py-4 pl-4 pr-3 text-right font-mono text-sm leading-relaxed text-gray-500"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i} className="block">
                {i + 1}
              </span>
            ))}
          </div>
        )}
        {/* Explicit dark bg: the tomorrow theme only styles pre elements
            carrying a language-* class, so an unclassed pre would render
            light text on a white background. */}
        <pre
          // External DOM mutations (e.g. browser extensions adding tabindex
          // to code regions before hydration finishes) must not fail the
          // whole article — scoped to this node only.
          suppressHydrationWarning
          className={`m-0 min-w-0 flex-1 overflow-visible rounded-none bg-[#2d2d2d] p-4 text-sm leading-relaxed ${
            showGutter ? "pl-3" : ""
          } ${wrap ? "code-wrap" : ""}`}
        >
          <code
            className={codeClass}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
      {collapsible && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 bg-[#2d2d2d] px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-[#363636] hover:text-white"
        >
          {expanded ? (
            <>
              Show less <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show all {lineCount} lines <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
