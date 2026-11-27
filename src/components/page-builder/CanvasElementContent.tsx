// src/components/page-builder/CanvasElementContent.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  Building2,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import {
  extractYouTubeEmbedUrl,
  resolveDynamicTokens,
  sanitizeLinkHref,
  type Breakpoint,
  type CalloutIconName,
  type CanvasElement,
  type DynamicTokenContext,
  type ShadowPreset,
} from "@/data/about-us-defaults";

export const CALLOUT_ICON_MAP: Record<CalloutIconName, LucideIcon> = {
  Award,
  Sparkles,
  ShieldCheck,
  Star,
  Heart,
  Lightbulb,
  Building2,
  Users,
  CheckCircle2,
};

const SHADOW_CLASS: Record<ShadowPreset, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  "2xl": "shadow-2xl",
};

/**
 * Pure WYSIWYG element renderer shared 1:1 between the Admin Canvas Editor
 * and the public About Us page.
 */
export default function CanvasElementContent({
  element,
  breakpoint,
  tokenCtx,
  interactive = true,
  isEditingInline = false,
  onInlineTextChange,
  onInlineTextBlur,
  suppressH1 = false,
}: {
  element: CanvasElement;
  breakpoint: Breakpoint;
  tokenCtx: DynamicTokenContext;
  /** False inside the canvas editor so links/iframes don't hijack dragging. */
  interactive?: boolean;
  isEditingInline?: boolean;
  onInlineTextChange?: (nextText: string) => void;
  onInlineTextBlur?: () => void;
  /** Prevents duplicate <h1> elements when mobile/desktop trees both mount. */
  suppressH1?: boolean;
}) {
  const opacityStyle =
    typeof element.opacity === "number" && element.opacity < 100
      ? element.opacity / 100
      : 1;

  if (element.type === "text") {
    const p = element.props;
    const fontSize =
      breakpoint === "mobile" && typeof p.mobileFontSize === "number"
        ? p.mobileFontSize
        : p.fontSize;

    const textStyle: React.CSSProperties = {
      fontSize: `${fontSize}px`,
      fontWeight: Number(p.fontWeight),
      lineHeight: p.lineHeight,
      letterSpacing:
        typeof p.letterSpacing === "number"
          ? `${p.letterSpacing}em`
          : undefined,
      textAlign: p.textAlign,
      color: p.color,
      backgroundColor: p.backgroundColor || "transparent",
      borderRadius: p.borderRadius ? `${p.borderRadius}px` : undefined,
      padding: p.padding ? `${p.padding}px` : undefined,
      opacity: opacityStyle,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    };

    if (isEditingInline) {
      return (
        <textarea
          value={p.content}
          onChange={(e) => onInlineTextChange?.(e.target.value)}
          onBlur={() => onInlineTextBlur?.()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onInlineTextBlur?.();
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          autoFocus
          style={textStyle}
          className="w-full h-full resize-none bg-transparent outline-none ring-2 ring-blue-500/60 rounded"
        />
      );
    }

    const renderedText = resolveDynamicTokens(p.content, tokenCtx);
    const Tag = p.tag === "h1" && suppressH1 ? "div" : p.tag;

    return (
      <Tag style={textStyle} className="w-full h-full overflow-hidden">
        {renderedText}
      </Tag>
    );
  }

  if (element.type === "image") {
    const p = element.props;
    return (
      <div
        className={`w-full h-full overflow-hidden ${SHADOW_CLASS[p.shadow] || ""}`}
        style={{
          borderRadius: `${p.borderRadius}px`,
          borderWidth: p.borderWidth ? `${p.borderWidth}px` : undefined,
          borderStyle: p.borderWidth ? "solid" : undefined,
          borderColor: p.borderWidth ? p.borderColor : undefined,
          opacity: opacityStyle,
        }}
      >
        {p.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.src}
            alt={p.alt || element.name}
            draggable={false}
            className="w-full h-full select-none"
            style={{ objectFit: p.objectFit }}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
            <ImageIcon size={28} />
            <span className="text-xs font-medium text-center">
              Select to upload image
            </span>
          </div>
        )}
      </div>
    );
  }

  if (element.type === "stat") {
    const p = element.props;
    return (
      <div
        className={`w-full h-full flex flex-col justify-center px-6 py-5 border ${SHADOW_CLASS[p.shadow] || ""}`}
        style={{
          backgroundColor: p.backgroundColor,
          borderColor: p.borderColor,
          borderRadius: `${p.borderRadius}px`,
          textAlign: p.textAlign,
          opacity: opacityStyle,
        }}
      >
        <p
          className="text-3xl md:text-4xl font-bold leading-tight truncate"
          style={{ color: p.valueColor }}
        >
          {resolveDynamicTokens(p.value, tokenCtx)}
        </p>
        <p
          className="mt-1.5 text-sm leading-snug"
          style={{ color: p.labelColor }}
        >
          {resolveDynamicTokens(p.label, tokenCtx)}
        </p>
      </div>
    );
  }

  if (element.type === "callout") {
    const p = element.props;
    const Icon = CALLOUT_ICON_MAP[p.icon] || Award;
    return (
      <div
        className="w-full h-full flex items-start gap-4 p-6 border overflow-hidden"
        style={{
          backgroundColor: p.backgroundColor,
          borderColor: p.borderColor,
          borderRadius: `${p.borderRadius}px`,
          opacity: opacityStyle,
        }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: p.accentColor }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          {p.title?.trim() && (
            <p
              className="text-base font-bold leading-snug"
              style={{ color: p.textColor }}
            >
              {resolveDynamicTokens(p.title, tokenCtx)}
            </p>
          )}
          <p
            className="text-sm sm:text-base font-medium leading-relaxed"
            style={{ color: p.textColor }}
          >
            {resolveDynamicTokens(p.text, tokenCtx)}
          </p>
        </div>
      </div>
    );
  }

  if (element.type === "button") {
    const p = element.props;
    const isSolid = p.variant === "solid";
    const style: React.CSSProperties = {
      backgroundColor: isSolid ? p.backgroundColor : "transparent",
      color: p.textColor,
      borderColor: p.borderColor || p.backgroundColor,
      borderWidth: isSolid ? 0 : 2,
      borderStyle: isSolid ? "none" : "solid",
      borderRadius: `${p.borderRadius}px`,
      fontSize: `${p.fontSize}px`,
      opacity: opacityStyle,
    };

    const className =
      "w-full h-full inline-flex items-center justify-center font-semibold px-5 transition-opacity hover:opacity-90 select-none";

    const label = resolveDynamicTokens(p.label, tokenCtx);

    if (!interactive) {
      return (
        <div style={style} className={className}>
          {label}
        </div>
      );
    }

    const safeHref = sanitizeLinkHref(p.href);
    const isExternal = /^https?:\/\//i.test(safeHref);
    if (isExternal || p.openInNewTab) {
      return (
        <a
          href={safeHref}
          target={p.openInNewTab ? "_blank" : undefined}
          rel={p.openInNewTab ? "noopener noreferrer" : undefined}
          style={style}
          className={className}
        >
          {label}
        </a>
      );
    }

    return (
      <Link href={safeHref} style={style} className={className}>
        {label}
      </Link>
    );
  }

  if (element.type === "shape") {
    const p = element.props;
    if (p.shapeKind === "divider") {
      return (
        <div
          className="w-full h-full flex items-center"
          style={{ opacity: opacityStyle }}
        >
          <div
            className="w-full"
            style={{
              height: `${Math.max(1, p.borderWidth || 2)}px`,
              backgroundColor: p.backgroundColor,
              borderRadius: `${p.borderRadius}px`,
            }}
          />
        </div>
      );
    }

    const radius =
      p.shapeKind === "circle"
        ? "9999px"
        : p.shapeKind === "pill"
          ? "9999px"
          : `${p.borderRadius}px`;

    return (
      <div
        className={`w-full h-full ${SHADOW_CLASS[p.shadow] || ""}`}
        style={{
          backgroundColor: p.backgroundColor,
          borderRadius: radius,
          borderWidth: p.borderWidth ? `${p.borderWidth}px` : undefined,
          borderStyle: p.borderWidth ? "solid" : undefined,
          borderColor: p.borderWidth ? p.borderColor : undefined,
          opacity: opacityStyle,
        }}
      />
    );
  }

  if (element.type === "video") {
    const p = element.props;
    const embedUrl = extractYouTubeEmbedUrl(p.url);
    return (
      <div
        className={`w-full h-full overflow-hidden relative bg-slate-900 ${SHADOW_CLASS[p.shadow] || ""}`}
        style={{
          borderRadius: `${p.borderRadius}px`,
          opacity: opacityStyle,
        }}
      >
        {embedUrl ? (
          <>
            <iframe
              src={embedUrl}
              title={element.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {!interactive && <div className="absolute inset-0 bg-transparent" />}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
            <Youtube size={30} className="text-red-500" />
            <span className="text-xs font-medium text-center">
              Paste a YouTube URL in the right panel
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
