// src/app/admin/about-us/components/InspectorPanel.tsx
"use client";

import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartHorizontal,
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Trash2,
  Unlock,
  Upload,
} from "lucide-react";
import {
  DESKTOP_STAGE_WIDTH,
  MOBILE_STAGE_WIDTH,
  SECTION_GRADIENT_PRESETS,
  type Breakpoint,
  type ButtonHoverEffect,
  type CanvasElement,
  type ElementFrame,
  type FreeformSection,
  type ImageFitMode,
  type ImagePositionPreset,
  type ImageShapePreset,
  type ShadowPreset,
  type StudioIconName,
  type TextTypographyShape,
} from "@/data/about-us-defaults";
import { uploadCompressedImage } from "@/lib/storage-upload";
import { STUDIO_ICON_MAP } from "@/components/page-builder/CanvasElementContent";

const SHADOW_OPTIONS: { value: ShadowPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Soft" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "2xl", label: "Elevated" },
];

const TEXT_SHAPE_OPTIONS: { value: TextTypographyShape; label: string }[] = [
  { value: "plain", label: "Plain Text" },
  { value: "pill-badge", label: "Pill Badge" },
  { value: "eyebrow", label: "Eyebrow + Accent Line" },
  { value: "gradient", label: "Brand Gradient Text" },
  { value: "left-accent", label: "Left Accent Bar" },
  { value: "highlight", label: "Soft Highlight Box" },
  { value: "outline-tag", label: "Outline Tag" },
];

const IMAGE_SHAPE_OPTIONS: { value: ImageShapePreset; label: string }[] = [
  { value: "rectangle", label: "Rectangle" },
  { value: "rounded", label: "Rounded Card" },
  { value: "circle", label: "Circle / Oval" },
  { value: "arch", label: "Arch" },
  { value: "blob", label: "Organic Blob" },
  { value: "hexagon", label: "Hexagon" },
  { value: "chamfer", label: "Angled Cut" },
];

const IMAGE_FIT_OPTIONS: { value: ImageFitMode; label: string }[] = [
  { value: "cover", label: "Cover (Fill & Crop)" },
  { value: "contain", label: "Contain (Fit Whole)" },
  { value: "fill", label: "Fill (Stretch)" },
  { value: "scale-down", label: "Scale Down" },
  { value: "none", label: "Original Size" },
];

const IMAGE_POSITION_OPTIONS: { value: ImagePositionPreset; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

const BUTTON_HOVER_OPTIONS: { value: ButtonHoverEffect; label: string }[] = [
  { value: "lift", label: "Lift & Shadow" },
  { value: "scale", label: "Gentle Scale" },
  { value: "glow", label: "Brand Glow" },
  { value: "none", label: "No Animation" },
];

const ALL_ICONS = Object.keys(STUDIO_ICON_MAP) as StudioIconName[];

const QUICK_TOKENS = [
  { token: "{{years_experience}}", label: "Years Exp" },
  { token: "{{founding_year}}", label: "Founding Yr" },
  { token: "{{company_slogan}}", label: "Slogan" },
  { token: "{{years_phrase}}", label: "Decades" },
];

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const parsed = Number.parseFloat(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  allowTransparent = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  allowTransparent?: boolean;
}) {
  const isTransparent = !value || value.trim().toLowerCase() === "transparent";
  const pickerColor = /^#[0-9a-f]{6}$/i.test((value || "").trim())
    ? value.trim()
    : "#008080";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {allowTransparent && (
          <button
            type="button"
            onClick={() => onChange(isTransparent ? "#FFFFFF" : "transparent")}
            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
              isTransparent
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300"
                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            {isTransparent ? "Transparent ✓" : "Set Transparent"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {isTransparent ? (
          <div
            title="Transparent"
            className="h-8 w-8 rounded border border-slate-300 dark:border-slate-600 shrink-0"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
        ) : (
          <input
            type="color"
            value={pickerColor}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer shrink-0 p-0.5"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={allowTransparent ? "transparent or #FFFFFF" : "#008080"}
          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
    </div>
  );
}

export default function InspectorPanel({
  breakpoint,
  sectionsCount,
  selectedSection,
  selectedElement,
  pageBgColor,
  onUpdatePageBgColor,
  onUpdateSection,
  onDeleteSection,
  onDuplicateSection,
  onUpdateElement,
  onUpdateElementFrame,
  onMoveElementLayer,
  onDuplicateElement,
  onDeleteElement,
}: {
  breakpoint: Breakpoint;
  sectionsCount: number;
  selectedSection: FreeformSection | null;
  selectedElement: CanvasElement | null;
  pageBgColor: string;
  onUpdatePageBgColor: (color: string) => void;
  onUpdateSection: (
    sectionId: string,
    patch: Partial<FreeformSection>
  ) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onUpdateElement: (
    sectionId: string,
    elementId: string,
    updater: (el: CanvasElement) => CanvasElement
  ) => void;
  onUpdateElementFrame: (
    sectionId: string,
    elementId: string,
    frame: ElementFrame
  ) => void;
  onMoveElementLayer: (
    sectionId: string,
    elementId: string,
    dir: "front" | "back"
  ) => void;
  onDuplicateElement: (sectionId: string, elementId: string) => void;
  onDeleteElement: (sectionId: string, elementId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const stageWidth =
    breakpoint === "desktop" ? DESKTOP_STAGE_WIDTH : MOBILE_STAGE_WIDTH;

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (
      !file ||
      !selectedSection ||
      !selectedElement ||
      selectedElement.type !== "image"
    ) {
      return;
    }

    setUploadingImage(true);
    try {
      const { publicUrl } = await uploadCompressedImage(file, {
        bucket: "post-images",
        dir: "public/about-us",
        prefix: "about",
        maxWidth: 1600,
        quality: 0.85,
        maxSizeMB: 0.3,
      });
      onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
        el.type === "image"
          ? { ...el, props: { ...el.props, src: publicUrl } }
          : el
      );
      toast.success("Image uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ELEMENT INSPECTOR
  if (selectedSection && selectedElement) {
    const frame = selectedElement[breakpoint];

    const patchFrame = (patch: Partial<ElementFrame>) => {
      onUpdateElementFrame(selectedSection.id, selectedElement.id, {
        ...frame,
        ...patch,
      });
    };

    const alignHorizontal = (mode: "left" | "center" | "right") => {
      const nextX =
        mode === "left"
          ? 24
          : mode === "center"
            ? Math.round((stageWidth - frame.w) / 2)
            : Math.round(stageWidth - frame.w - 24);
      patchFrame({ x: nextX });
    };

    return (
      <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-4 space-y-5">
        {/* Element Header */}
        <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {selectedElement.type} · {breakpoint}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => patchFrame({ hidden: !frame.hidden })}
                title={
                  frame.hidden
                    ? `Show on ${breakpoint}`
                    : `Hide on ${breakpoint}`
                }
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                {frame.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(
                    selectedSection.id,
                    selectedElement.id,
                    (el) => ({ ...el, locked: !el.locked })
                  )
                }
                title={selectedElement.locked ? "Unlock" : "Lock"}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                {selectedElement.locked ? (
                  <Lock size={14} className="text-amber-500" />
                ) : (
                  <Unlock size={14} />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  onDuplicateElement(selectedSection.id, selectedElement.id)
                }
                title="Duplicate"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onDeleteElement(selectedSection.id, selectedElement.id)
                }
                title="Delete element"
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={selectedElement.name}
            onChange={(e) =>
              onUpdateElement(selectedSection.id, selectedElement.id, (el) => ({
                ...el,
                name: e.target.value,
              }))
            }
            placeholder="Layer name"
            className="w-full px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Position, Size & Layering */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Position &amp; Size
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => alignHorizontal("left")}
                title="Align left"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <AlignStartHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => alignHorizontal("center")}
                title="Center horizontally"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <AlignCenterHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => alignHorizontal("right")}
                title="Align right"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <AlignEndHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onMoveElementLayer(
                    selectedSection.id,
                    selectedElement.id,
                    "front"
                  )
                }
                title="Bring to top"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ArrowUpToLine size={14} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onMoveElementLayer(
                    selectedSection.id,
                    selectedElement.id,
                    "back"
                  )
                }
                title="Send to bottom"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ArrowDownToLine size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X (px)"
              value={frame.x}
              onChange={(x) => patchFrame({ x })}
            />
            <NumberInput
              label="Y (px)"
              value={frame.y}
              onChange={(y) => patchFrame({ y })}
            />
            <NumberInput
              label="Width (px)"
              value={frame.w}
              min={32}
              onChange={(w) => patchFrame({ w: Math.max(32, w) })}
            />
            <NumberInput
              label="Height (px)"
              value={frame.h}
              min={24}
              onChange={(h) => patchFrame({ h: Math.max(24, h) })}
            />
            <NumberInput
              label="Rotation (°)"
              value={frame.rotation ?? 0}
              min={-180}
              max={180}
              onChange={(rotation) => patchFrame({ rotation })}
            />
            <NumberInput
              label="Opacity (%)"
              value={selectedElement.opacity ?? 100}
              min={10}
              max={100}
              onChange={(opacity) =>
                onUpdateElement(
                  selectedSection.id,
                  selectedElement.id,
                  (el) => ({
                    ...el,
                    opacity: Math.max(10, Math.min(100, opacity)),
                  })
                )
              }
            />
          </div>
        </div>

        {/* TEXT + TYPOGRAPHY SHAPES */}
        {selectedElement.type === "text" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Text &amp; Typography Shape
            </span>

            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Typography Style / Shape
              </span>
              <select
                value={selectedElement.props.textStyle || "plain"}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "text"
                      ? {
                          ...el,
                          props: {
                            ...el.props,
                            textStyle: e.target.value as TextTypographyShape,
                          },
                        }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {TEXT_SHAPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              rows={4}
              value={selectedElement.props.content}
              onChange={(e) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "text"
                    ? { ...el, props: { ...el.props, content: e.target.value } }
                    : el
                )
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">
                Insert dynamic setting token:
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_TOKENS.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() =>
                      onUpdateElement(
                        selectedSection.id,
                        selectedElement.id,
                        (el) =>
                          el.type === "text"
                            ? {
                                ...el,
                                props: {
                                  ...el.props,
                                  content: `${el.props.content}${t.token}`,
                                },
                              }
                            : el
                      )
                    }
                    className="px-2 py-0.5 text-[10px] font-medium rounded bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 cursor-pointer"
                  >
                    + {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  HTML Tag
                </span>
                <select
                  value={selectedElement.props.tag}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "text"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              tag: e.target.value as "h1" | "h2" | "h3" | "p",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="p">Paragraph</option>
                </select>
              </label>

              <NumberInput
                label={breakpoint === "mobile" ? "Mobile Size" : "Font Size"}
                value={
                  breakpoint === "mobile"
                    ? (selectedElement.props.mobileFontSize ??
                      selectedElement.props.fontSize)
                    : selectedElement.props.fontSize
                }
                min={10}
                max={120}
                onChange={(size) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "text"
                      ? {
                          ...el,
                          props:
                            breakpoint === "mobile"
                              ? { ...el.props, mobileFontSize: size }
                              : { ...el.props, fontSize: size },
                        }
                      : el
                  )
                }
              />

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Weight
                </span>
                <select
                  value={selectedElement.props.fontWeight}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "text"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              fontWeight: e.target.value as
                                | "400"
                                | "500"
                                | "600"
                                | "700"
                                | "800",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extrabold</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Alignment
                </span>
                <select
                  value={selectedElement.props.textAlign}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "text"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              textAlign: e.target.value as
                                | "left"
                                | "center"
                                | "right",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Transform
                </span>
                <select
                  value={selectedElement.props.textTransform || "none"}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "text"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              textTransform: e.target.value as
                                | "none"
                                | "uppercase"
                                | "capitalize",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Style
                </span>
                <select
                  value={selectedElement.props.fontStyle || "normal"}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "text"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              fontStyle: e.target.value as "normal" | "italic",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </label>

              <NumberInput
                label="Line Height"
                value={selectedElement.props.lineHeight}
                min={0.9}
                max={3}
                step={0.05}
                onChange={(lineHeight) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "text"
                      ? { ...el, props: { ...el.props, lineHeight } }
                      : el
                  )
                }
              />

              <NumberInput
                label="Padding (px)"
                value={selectedElement.props.padding ?? 0}
                min={0}
                max={64}
                onChange={(padding) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "text"
                      ? { ...el, props: { ...el.props, padding } }
                      : el
                  )
                }
              />
            </div>

            <ColorInput
              label="Text Color"
              value={selectedElement.props.color}
              onChange={(color) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "text"
                    ? { ...el, props: { ...el.props, color } }
                    : el
                )
              }
            />

            <ColorInput
              label="Accent Color (Bar / Gradient / Tag)"
              value={selectedElement.props.accentColor || "#008080"}
              onChange={(accentColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "text"
                    ? { ...el, props: { ...el.props, accentColor } }
                    : el
                )
              }
            />

            <ColorInput
              label="Background Fill"
              value={selectedElement.props.backgroundColor || "transparent"}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "text"
                    ? { ...el, props: { ...el.props, backgroundColor } }
                    : el
                )
              }
            />
          </div>
        )}

        {/* IMAGE (Shapes + 5 Fit Modes + Focal Point) */}
        {selectedElement.type === "image" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Image Source, Shape &amp; Fit
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleUploadImage}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploadingImage ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {uploadingImage ? "Compressing & Uploading..." : "Upload Image"}
            </button>

            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Image URL
              </span>
              <input
                type="text"
                value={selectedElement.props.src}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "image"
                      ? { ...el, props: { ...el.props, src: e.target.value } }
                      : el
                  )
                }
                placeholder="/images/... or https://..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Alt Text
              </span>
              <input
                type="text"
                value={selectedElement.props.alt}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "image"
                      ? { ...el, props: { ...el.props, alt: e.target.value } }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Image Shape
                </span>
                <select
                  value={selectedElement.props.shape || "rounded"}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "image"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              shape: e.target.value as ImageShapePreset,
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {IMAGE_SHAPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Image Fit
                </span>
                <select
                  value={selectedElement.props.objectFit}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "image"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              objectFit: e.target.value as ImageFitMode,
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {IMAGE_FIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Focal Point
                </span>
                <select
                  value={selectedElement.props.objectPosition || "center"}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "image"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              objectPosition: e.target
                                .value as ImagePositionPreset,
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {IMAGE_POSITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Shadow
                </span>
                <select
                  value={selectedElement.props.shadow}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "image"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              shadow: e.target.value as ShadowPreset,
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {SHADOW_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <NumberInput
                label="Radius (px)"
                value={selectedElement.props.borderRadius}
                min={0}
                max={200}
                onChange={(borderRadius) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "image"
                      ? { ...el, props: { ...el.props, borderRadius } }
                      : el
                  )
                }
              />

              <NumberInput
                label="Border (px)"
                value={selectedElement.props.borderWidth}
                min={0}
                max={20}
                onChange={(borderWidth) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "image"
                      ? { ...el, props: { ...el.props, borderWidth } }
                      : el
                  )
                }
              />
            </div>

            <ColorInput
              label="Frame Backdrop"
              value={selectedElement.props.backgroundColor || "transparent"}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "image"
                    ? { ...el, props: { ...el.props, backgroundColor } }
                    : el
                )
              }
            />

            <ColorInput
              label="Border Color"
              value={selectedElement.props.borderColor}
              onChange={(borderColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "image"
                    ? { ...el, props: { ...el.props, borderColor } }
                    : el
                )
              }
            />
          </div>
        )}

        {/* STAT CARD */}
        {selectedElement.type === "stat" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Stat Card
            </span>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Metric Value (supports tokens)
              </span>
              <input
                type="text"
                value={selectedElement.props.value}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "stat"
                      ? { ...el, props: { ...el.props, value: e.target.value } }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Subtitle Label
              </span>
              <input
                type="text"
                value={selectedElement.props.label}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "stat"
                      ? { ...el, props: { ...el.props, label: e.target.value } }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <ColorInput
              label="Value Color"
              value={selectedElement.props.valueColor}
              onChange={(valueColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "stat"
                    ? { ...el, props: { ...el.props, valueColor } }
                    : el
                )
              }
            />
            <ColorInput
              label="Card Background"
              value={selectedElement.props.backgroundColor}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "stat"
                    ? { ...el, props: { ...el.props, backgroundColor } }
                    : el
                )
              }
            />
            <NumberInput
              label="Corner Radius (px)"
              value={selectedElement.props.borderRadius}
              min={0}
              max={60}
              onChange={(borderRadius) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "stat"
                    ? { ...el, props: { ...el.props, borderRadius } }
                    : el
                )
              }
            />
          </div>
        )}

        {/* CALLOUT / AWARD */}
        {selectedElement.type === "callout" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Callout / Pillar Box
            </span>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Icon
              </span>
              <select
                value={selectedElement.props.icon}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "callout"
                      ? {
                          ...el,
                          props: {
                            ...el.props,
                            icon: e.target.value as StudioIconName,
                          },
                        }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {ALL_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Optional Title
              </span>
              <input
                type="text"
                value={selectedElement.props.title || ""}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "callout"
                      ? { ...el, props: { ...el.props, title: e.target.value } }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Body Copy
              </span>
              <textarea
                rows={4}
                value={selectedElement.props.text}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "callout"
                      ? { ...el, props: { ...el.props, text: e.target.value } }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <ColorInput
              label="Icon Accent Color"
              value={selectedElement.props.accentColor}
              onChange={(accentColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "callout"
                    ? { ...el, props: { ...el.props, accentColor } }
                    : el
                )
              }
            />
            <ColorInput
              label="Box Background"
              value={selectedElement.props.backgroundColor}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "callout"
                    ? { ...el, props: { ...el.props, backgroundColor } }
                    : el
                )
              }
            />
            <ColorInput
              label="Text Color"
              value={selectedElement.props.textColor}
              onChange={(textColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "callout"
                    ? { ...el, props: { ...el.props, textColor } }
                    : el
                )
              }
            />
          </div>
        )}

        {/* BUTTON WITH ANIMATION CONTROLS */}
        {selectedElement.type === "button" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Button &amp; Animation
            </span>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Label
              </span>
              <input
                type="text"
                value={selectedElement.props.label}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "button"
                      ? { ...el, props: { ...el.props, label: e.target.value } }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Link URL
              </span>
              <input
                type="text"
                value={selectedElement.props.href}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "button"
                      ? { ...el, props: { ...el.props, href: e.target.value } }
                      : el
                  )
                }
                placeholder="/company/contact-us"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Style
                </span>
                <select
                  value={selectedElement.props.variant}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "button"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              variant: e.target.value as "solid" | "outline",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="solid">Solid</option>
                  <option value="outline">Outline</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Hover Animation
                </span>
                <select
                  value={selectedElement.props.hoverEffect || "lift"}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "button"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              hoverEffect: e.target.value as ButtonHoverEffect,
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {BUTTON_HOVER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <NumberInput
                label="Radius (px)"
                value={selectedElement.props.borderRadius}
                min={0}
                max={999}
                onChange={(borderRadius) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "button"
                      ? { ...el, props: { ...el.props, borderRadius } }
                      : el
                  )
                }
              />

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Shadow
                </span>
                <select
                  value={selectedElement.props.shadow || "none"}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "button"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              shadow: e.target.value as ShadowPreset,
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {SHADOW_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Animated arrow icon</span>
                <input
                  type="checkbox"
                  checked={Boolean(selectedElement.props.showArrow)}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "button"
                        ? {
                            ...el,
                            props: { ...el.props, showArrow: e.target.checked },
                          }
                        : el
                    )
                  }
                  className="h-4 w-4 rounded text-blue-600"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Open link in new tab</span>
                <input
                  type="checkbox"
                  checked={Boolean(selectedElement.props.openInNewTab)}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "button"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              openInNewTab: e.target.checked,
                            },
                          }
                        : el
                    )
                  }
                  className="h-4 w-4 rounded text-blue-600"
                />
              </label>
            </div>

            <ColorInput
              label="Background / Border"
              value={selectedElement.props.backgroundColor}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "button"
                    ? {
                        ...el,
                        props: {
                          ...el.props,
                          backgroundColor,
                          borderColor:
                            backgroundColor === "transparent"
                              ? el.props.borderColor
                              : backgroundColor,
                        },
                      }
                    : el
                )
              }
            />
            <ColorInput
              label="Text Color"
              value={selectedElement.props.textColor}
              onChange={(textColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "button"
                    ? { ...el, props: { ...el.props, textColor } }
                    : el
                )
              }
            />
          </div>
        )}

        {/* BOX / SHAPE / DIVIDER WITH TRANSPARENT SUPPORT */}
        {selectedElement.type === "shape" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Box / Shape
            </span>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Shape Type
              </span>
              <select
                value={selectedElement.props.shapeKind}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "shape"
                      ? {
                          ...el,
                          props: {
                            ...el.props,
                            shapeKind: e.target.value as
                              | "rectangle"
                              | "circle"
                              | "pill"
                              | "divider",
                          },
                        }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="rectangle">Rectangle / Card</option>
                <option value="pill">Pill</option>
                <option value="circle">Circle / Ellipse</option>
                <option value="divider">Divider Line</option>
              </select>
            </label>

            <ColorInput
              label="Fill Color"
              value={selectedElement.props.backgroundColor}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "shape"
                    ? { ...el, props: { ...el.props, backgroundColor } }
                    : el
                )
              }
            />

            <ColorInput
              label="Border Color"
              value={selectedElement.props.borderColor}
              allowTransparent
              onChange={(borderColor) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "shape"
                    ? { ...el, props: { ...el.props, borderColor } }
                    : el
                )
              }
            />

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Border / Thick"
                value={selectedElement.props.borderWidth}
                min={0}
                max={20}
                onChange={(borderWidth) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "shape"
                      ? { ...el, props: { ...el.props, borderWidth } }
                      : el
                  )
                }
              />
              <NumberInput
                label="Radius (px)"
                value={selectedElement.props.borderRadius}
                min={0}
                max={200}
                onChange={(borderRadius) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "shape"
                      ? { ...el, props: { ...el.props, borderRadius } }
                      : el
                  )
                }
              />
            </div>

            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                Shadow
              </span>
              <select
                value={selectedElement.props.shadow}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "shape"
                      ? {
                          ...el,
                          props: {
                            ...el.props,
                            shadow: e.target.value as ShadowPreset,
                          },
                        }
                      : el
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {SHADOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Frosted glass blur</span>
              <input
                type="checkbox"
                checked={Boolean(selectedElement.props.backdropBlur)}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "shape"
                      ? {
                          ...el,
                          props: { ...el.props, backdropBlur: e.target.checked },
                        }
                      : el
                  )
                }
                className="h-4 w-4 rounded text-blue-600"
              />
            </label>
          </div>
        )}

        {/* STANDALONE ICON INSPECTOR */}
        {selectedElement.type === "icon" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Icon Library &amp; Style
            </span>

            <div className="grid grid-cols-6 gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50">
              {ALL_ICONS.map((iconName) => {
                const IconComp = STUDIO_ICON_MAP[iconName];
                const active = selectedElement.props.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    title={iconName}
                    onClick={() =>
                      onUpdateElement(
                        selectedSection.id,
                        selectedElement.id,
                        (el) =>
                          el.type === "icon"
                            ? { ...el, props: { ...el.props, icon: iconName } }
                            : el
                      )
                    }
                    className={`p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComp size={15} />
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Icon Size (px)"
                value={selectedElement.props.iconSize}
                min={14}
                max={120}
                onChange={(iconSize) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "icon"
                      ? { ...el, props: { ...el.props, iconSize } }
                      : el
                  )
                }
              />

              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Container
                </span>
                <select
                  value={selectedElement.props.containerShape}
                  onChange={(e) =>
                    onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                      el.type === "icon"
                        ? {
                            ...el,
                            props: {
                              ...el.props,
                              containerShape: e.target.value as
                                | "none"
                                | "circle"
                                | "rounded"
                                | "square",
                            },
                          }
                        : el
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="none">None (Icon Only)</option>
                  <option value="circle">Circle Badge</option>
                  <option value="rounded">Rounded Badge</option>
                  <option value="square">Square Badge</option>
                </select>
              </label>
            </div>

            <ColorInput
              label="Icon Color"
              value={selectedElement.props.color}
              onChange={(color) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "icon"
                    ? { ...el, props: { ...el.props, color } }
                    : el
                )
              }
            />

            {selectedElement.props.containerShape !== "none" && (
              <>
                <ColorInput
                  label="Badge Fill"
                  value={selectedElement.props.backgroundColor}
                  allowTransparent
                  onChange={(backgroundColor) =>
                    onUpdateElement(
                      selectedSection.id,
                      selectedElement.id,
                      (el) =>
                        el.type === "icon"
                          ? { ...el, props: { ...el.props, backgroundColor } }
                          : el
                    )
                  }
                />
                <ColorInput
                  label="Badge Border"
                  value={selectedElement.props.borderColor}
                  allowTransparent
                  onChange={(borderColor) =>
                    onUpdateElement(
                      selectedSection.id,
                      selectedElement.id,
                      (el) =>
                        el.type === "icon"
                          ? { ...el, props: { ...el.props, borderColor } }
                          : el
                    )
                  }
                />
              </>
            )}
          </div>
        )}

        {/* VIDEO */}
        {selectedElement.type === "video" && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              YouTube Video
            </span>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                YouTube URL
              </span>
              <input
                type="url"
                value={selectedElement.props.url}
                onChange={(e) =>
                  onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                    el.type === "video"
                      ? { ...el, props: { ...el.props, url: e.target.value } }
                      : el
                  )
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </label>
            <NumberInput
              label="Corner Radius (px)"
              value={selectedElement.props.borderRadius}
              min={0}
              max={64}
              onChange={(borderRadius) =>
                onUpdateElement(selectedSection.id, selectedElement.id, (el) =>
                  el.type === "video"
                    ? { ...el, props: { ...el.props, borderRadius } }
                    : el
                )
              }
            />
          </div>
        )}
      </aside>
    );
  }

  // SECTION INSPECTOR
  if (selectedSection) {
    return (
      <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-4 space-y-5">
        <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Section Settings
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDuplicateSection(selectedSection.id)}
                title="Duplicate section"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                disabled={sectionsCount <= 1}
                onClick={() => onDeleteSection(selectedSection.id)}
                title={
                  sectionsCount <= 1
                    ? "At least one section is required"
                    : "Delete section"
                }
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-30 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={selectedSection.name}
            onChange={(e) =>
              onUpdateSection(selectedSection.id, { name: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-3">
          <NumberInput
            label={
              breakpoint === "desktop"
                ? "Desktop Height (px)"
                : "Mobile Height (px)"
            }
            value={
              breakpoint === "desktop"
                ? selectedSection.desktopHeight
                : selectedSection.mobileHeight
            }
            min={140}
            max={2400}
            step={10}
            onChange={(val) =>
              onUpdateSection(
                selectedSection.id,
                breakpoint === "desktop"
                  ? { desktopHeight: Math.max(140, val) }
                  : { mobileHeight: Math.max(140, val) }
              )
            }
          />

          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-500">
              Background Style
            </span>
            <select
              value={selectedSection.backgroundType}
              onChange={(e) =>
                onUpdateSection(selectedSection.id, {
                  backgroundType: e.target.value as "solid" | "gradient",
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
            </select>
          </label>

          {selectedSection.backgroundType === "solid" ? (
            <ColorInput
              label="Section Background Color"
              value={selectedSection.backgroundColor}
              allowTransparent
              onChange={(backgroundColor) =>
                onUpdateSection(selectedSection.id, { backgroundColor })
              }
            />
          ) : (
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-slate-500 block">
                Gradient Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SECTION_GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      onUpdateSection(selectedSection.id, {
                        backgroundGradient: preset.value,
                      })
                    }
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <div
                      className="h-5 w-full rounded mb-1"
                      style={{ backgroundImage: preset.value }}
                    />
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 block truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={selectedSection.backgroundGradient}
                onChange={(e) =>
                  onUpdateSection(selectedSection.id, {
                    backgroundGradient: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          )}

          <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Subtle Grid Pattern Overlay
            </span>
            <input
              type="checkbox"
              checked={selectedSection.showGridPattern}
              onChange={(e) =>
                onUpdateSection(selectedSection.id, {
                  showGridPattern: e.target.checked,
                })
              }
              className="h-4 w-4 rounded text-blue-600"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Page Backdrop
          </span>
          <ColorInput
            label="Default Page Background"
            value={pageBgColor}
            onChange={onUpdatePageBgColor}
          />
        </div>

        {/* Prominent Delete Section Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={sectionsCount <= 1}
            onClick={() => onDeleteSection(selectedSection.id)}
            className="w-full py-2 px-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 size={14} />
            Delete Section &quot;{selectedSection.name}&quot;
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-xs text-slate-500">
      Click any element or section on the canvas to inspect and customize it.
    </aside>
  );
}
