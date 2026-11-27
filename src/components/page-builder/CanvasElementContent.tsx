// src/components/page-builder/CanvasElementContent.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Globe,
  Heart,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Lock,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  extractYouTubeEmbedUrl,
  resolveDynamicTokens,
  resolveFontFamilyCss,
  sanitizeLinkHref,
  type Breakpoint,
  type ButtonHoverEffect,
  type CanvasElement,
  type DynamicTokenContext,
  type ImageShapePreset,
  type ShadowPreset,
  type StudioIconName,
} from "@/data/about-us-defaults";

export const STUDIO_ICON_MAP: Record<StudioIconName, LucideIcon> = {
  Award,
  Users,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  Briefcase,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Clock,
  Calendar,
  Calculator,
  Smartphone,
  Globe,
  Zap,
  Target,
  Compass,
  Heart,
  Star,
  Lightbulb,
  Cpu,
  Lock,
  Rocket,
};

const SHADOW_CLASS: Record<ShadowPreset, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  "2xl": "shadow-2xl",
};

const BUTTON_HOVER_CLASS: Record<ButtonHoverEffect, string> = {
  lift: "hover:-translate-y-0.5 hover:shadow-lg hover:brightness-105 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
  scale: "hover:scale-[1.03] hover:shadow-md active:scale-[0.97]",
  glow: "hover:brightness-110 hover:shadow-[0_0_24px_rgba(0,128,128,0.45)] active:scale-[0.98]",
  none: "",
};

function getImageShapeStyle(
  shape: ImageShapePreset | undefined,
  borderRadius: number
): React.CSSProperties {
  switch (shape) {
    case "circle":
      return { borderRadius: "9999px" };
    case "arch":
      return { borderRadius: "999px 999px 16px 16px" };
    case "blob":
      return { borderRadius: "42% 58% 62% 38% / 44% 46% 54% 56%" };
    case "hexagon":
      return {
        clipPath:
          "polygon(50% 0%, 96% 25%, 96% 75%, 50% 100%, 4% 75%, 4% 25%)",
      };
    case "chamfer":
      return {
        clipPath:
          "polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px)",
      };
    case "rounded":
      return { borderRadius: `${Math.max(borderRadius, 16)}px` };
    case "rectangle":
    default:
      return { borderRadius: `${borderRadius}px` };
  }
}

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
  interactive?: boolean;
  isEditingInline?: boolean;
  onInlineTextChange?: (nextText: string) => void;
  onInlineTextBlur?: () => void;
  suppressH1?: boolean;
}) {
  const opacityStyle =
    typeof element.opacity === "number" && element.opacity < 100
      ? element.opacity / 100
      : 1;

  // =========================================================================
  // TEXT & TYPOGRAPHY SHAPES
  // =========================================================================
  if (element.type === "text") {
    const p = element.props;
    const fontSize =
      breakpoint === "mobile" && typeof p.mobileFontSize === "number"
        ? p.mobileFontSize
        : p.fontSize;
    const textShape = p.textStyle || "plain";
    const accent = p.accentColor || "#008080";

    const baseStyle: React.CSSProperties = {
      fontFamily: resolveFontFamilyCss(p.fontFamily),
      fontSize: `${fontSize}px`,
      fontWeight: Number(p.fontWeight),
      fontStyle: p.fontStyle || "normal",
      textTransform: p.textTransform || "none",
      lineHeight: p.lineHeight,
      letterSpacing:
        typeof p.letterSpacing === "number"
          ? `${p.letterSpacing}em`
          : undefined,
      textAlign: p.textAlign,
      color: p.color,
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
          style={{
            ...baseStyle,
            backgroundColor: p.backgroundColor || "transparent",
            padding: p.padding ? `${p.padding}px` : "4px",
          }}
          className="w-full h-full resize-none outline-none ring-2 ring-blue-500/70 rounded"
        />
      );
    }

    const renderedText = resolveDynamicTokens(p.content, tokenCtx);
    const Tag = p.tag === "h1" && suppressH1 ? "div" : p.tag;

    if (textShape === "pill-badge" || textShape === "outline-tag") {
      const isOutline = textShape === "outline-tag";
      return (
        <div
          className="w-full h-full flex items-center"
          style={{
            justifyContent:
              p.textAlign === "center"
                ? "center"
                : p.textAlign === "right"
                  ? "flex-end"
                  : "flex-start",
            opacity: opacityStyle,
          }}
        >
          <Tag
            style={{
              ...baseStyle,
              opacity: 1,
              backgroundColor: isOutline
                ? "transparent"
                : p.backgroundColor || "rgba(0,128,128,0.1)",
              borderColor: p.borderColor || accent,
              borderWidth: "1px",
              borderStyle: "solid",
              borderRadius: `${p.borderRadius ?? 999}px`,
              padding: `${p.padding ?? 6}px ${Math.max(12, (p.padding ?? 6) * 2)}px`,
            }}
            className="inline-flex items-center justify-center max-w-full truncate"
          >
            {renderedText}
          </Tag>
        </div>
      );
    }

    if (textShape === "eyebrow") {
      return (
        <div
          className="w-full h-full flex items-center gap-2.5"
          style={{
            justifyContent:
              p.textAlign === "center"
                ? "center"
                : p.textAlign === "right"
                  ? "flex-end"
                  : "flex-start",
            opacity: opacityStyle,
          }}
        >
          <span
            className="h-0.5 w-6 rounded-full shrink-0"
            style={{ backgroundColor: accent }}
          />
          <Tag style={{ ...baseStyle, opacity: 1 }}>{renderedText}</Tag>
        </div>
      );
    }

    if (textShape === "gradient") {
      return (
        <Tag
          style={{
            ...baseStyle,
            backgroundImage: `linear-gradient(135deg, ${p.color || "#005c5c"} 0%, ${accent} 55%, #1853E9 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            padding: p.padding ? `${p.padding}px` : undefined,
          }}
          className="w-full h-full overflow-hidden"
        >
          {renderedText}
        </Tag>
      );
    }

    if (textShape === "left-accent") {
      return (
        <Tag
          style={{
            ...baseStyle,
            borderLeft: `3px solid ${accent}`,
            backgroundColor: p.backgroundColor || "transparent",
            borderRadius: p.borderRadius ? `${p.borderRadius}px` : undefined,
            paddingLeft: `${Math.max(12, p.padding ?? 14)}px`,
            paddingTop: p.padding ? `${Math.round(p.padding / 2)}px` : "4px",
            paddingBottom: p.padding ? `${Math.round(p.padding / 2)}px` : "4px",
            paddingRight: p.padding ? `${p.padding}px` : "4px",
          }}
          className="w-full h-full overflow-hidden"
        >
          {renderedText}
        </Tag>
      );
    }

    if (textShape === "highlight") {
      return (
        <Tag
          style={{
            ...baseStyle,
            backgroundColor: p.backgroundColor || "rgba(0,128,128,0.08)",
            borderRadius: `${p.borderRadius ?? 12}px`,
            padding: `${p.padding ?? 14}px`,
          }}
          className="w-full h-full overflow-hidden"
        >
          {renderedText}
        </Tag>
      );
    }

    return (
      <Tag
        style={{
          ...baseStyle,
          backgroundColor:
            p.backgroundColor && p.backgroundColor !== "transparent"
              ? p.backgroundColor
              : "transparent",
          borderRadius: p.borderRadius ? `${p.borderRadius}px` : undefined,
          padding: p.padding ? `${p.padding}px` : undefined,
        }}
        className="w-full h-full overflow-hidden"
      >
        {renderedText}
      </Tag>
    );
  }

  // =========================================================================
  // IMAGE (Multiple Shapes + 5 Fit Modes + Focal Point)
  // =========================================================================
  if (element.type === "image") {
    const p = element.props;
    const shapeStyle = getImageShapeStyle(p.shape, p.borderRadius);

    return (
      <div
        className={`w-full h-full overflow-hidden ${SHADOW_CLASS[p.shadow] || ""}`}
        style={{
          ...shapeStyle,
          backgroundColor: p.backgroundColor || "transparent",
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
            style={{
              objectFit: p.objectFit,
              objectPosition: p.objectPosition || "center",
            }}
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

  // =========================================================================
  // STAT CARD
  // =========================================================================
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
          className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight truncate"
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

  // =========================================================================
  // CALLOUT / AWARD / PILLAR CARD
  // =========================================================================
  if (element.type === "callout") {
    const p = element.props;
    const Icon = STUDIO_ICON_MAP[p.icon] || Award;
    return (
      <div
        className="w-full h-full flex items-start gap-4 p-5 sm:p-6 border overflow-hidden"
        style={{
          backgroundColor: p.backgroundColor,
          borderColor: p.borderColor,
          borderRadius: `${p.borderRadius}px`,
          opacity: opacityStyle,
        }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
          style={{ backgroundColor: p.accentColor }}
        >
          <Icon className="h-5 w-5" />
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
            className="text-sm font-medium leading-relaxed opacity-90"
            style={{ color: p.textColor }}
          >
            {resolveDynamicTokens(p.text, tokenCtx)}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // BUTTON / CTA WITH SUBTLE HOVER & CLICK ANIMATIONS
  // =========================================================================
  if (element.type === "button") {
    const p = element.props;
    const isSolid = p.variant === "solid";
    const hoverClass = BUTTON_HOVER_CLASS[p.hoverEffect ?? "lift"];
    const shadowClass = SHADOW_CLASS[p.shadow ?? "none"];

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

    const className = `group/btn w-full h-full inline-flex items-center justify-center gap-2 font-semibold px-5 select-none transition-all duration-200 ease-out cursor-pointer ${shadowClass} ${hoverClass}`;

    const label = resolveDynamicTokens(p.label, tokenCtx);
    const inner = (
      <>
        <span>{label}</span>
        {p.showArrow && (
          <ArrowRight
            size={16}
            className="transition-transform duration-200 group-hover/btn:translate-x-1"
          />
        )}
      </>
    );

    if (!interactive) {
      return (
        <div style={style} className={className}>
          {inner}
        </div>
      );
    }

    const safeHref = sanitizeLinkHref(p.href);
    const isExternal = /^https?:\/\//i.test(safeHref);
    const isPdf = /\.pdf$/i.test(safeHref);
    if (isExternal || isPdf || p.openInNewTab) {
      return (
        <a
          href={safeHref}
          target={p.openInNewTab || isPdf ? "_blank" : undefined}
          rel={p.openInNewTab || isPdf ? "noopener noreferrer" : undefined}
          style={style}
          className={className}
        >
          {inner}
        </a>
      );
    }

    return (
      <Link href={safeHref} style={style} className={className}>
        {inner}
      </Link>
    );
  }

  // =========================================================================
  // BOX / SHAPE / DIVIDER (Supports Transparent Fill & Frosted Glass)
  // =========================================================================
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
      p.shapeKind === "circle" || p.shapeKind === "pill"
        ? "9999px"
        : `${p.borderRadius}px`;

    return (
      <div
        className={`w-full h-full ${SHADOW_CLASS[p.shadow] || ""} ${
          p.backdropBlur ? "backdrop-blur-md" : ""
        }`}
        style={{
          backgroundColor:
            p.backgroundColor === "transparent"
              ? "transparent"
              : p.backgroundColor,
          borderRadius: radius,
          borderWidth: p.borderWidth ? `${p.borderWidth}px` : undefined,
          borderStyle: p.borderWidth ? "solid" : undefined,
          borderColor: p.borderWidth ? p.borderColor : undefined,
          opacity: opacityStyle,
        }}
      />
    );
  }

  // =========================================================================
  // STANDALONE ICON ELEMENT
  // =========================================================================
  if (element.type === "icon") {
    const p = element.props;
    const Icon = STUDIO_ICON_MAP[p.icon] || Sparkles;
    const isContainerless = p.containerShape === "none";
    const radius =
      p.containerShape === "circle"
        ? "9999px"
        : p.containerShape === "rounded"
          ? "14px"
          : "0px";

    return (
      <div
        className={`w-full h-full flex items-center justify-center ${
          isContainerless ? "" : SHADOW_CLASS[p.shadow] || ""
        }`}
        style={{
          backgroundColor: isContainerless ? "transparent" : p.backgroundColor,
          borderRadius: isContainerless ? undefined : radius,
          borderWidth:
            !isContainerless && p.borderWidth ? `${p.borderWidth}px` : undefined,
          borderStyle: !isContainerless && p.borderWidth ? "solid" : undefined,
          borderColor: !isContainerless && p.borderWidth ? p.borderColor : undefined,
          color: p.color,
          opacity: opacityStyle,
        }}
      >
        <Icon size={p.iconSize || 28} strokeWidth={p.strokeWidth || 2} />
      </div>
    );
  }

  // =========================================================================
  // YOUTUBE VIDEO
  // =========================================================================
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
