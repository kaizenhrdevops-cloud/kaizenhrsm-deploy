// src/components/admin/BannerImageEditor.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Check,
  Pencil,
  Link2,
  Move,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { uploadCompressedImage } from "@/lib/storage-upload";
import {
  BANNER_RATIOS,
  DEFAULT_BANNER_RATIO,
  parseRatio,
  exportSizeForRatio,
  ratioTabText,
} from "@/lib/image-ratios";
import type { RatioOption } from "@/lib/image-ratios";

interface BannerImageEditorProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucketName?: string;
  hint?: string;
  /** Selected frame ratio, e.g. "16:9". Defaults to "4:1". */
  ratio?: string;
  /** Called when the user picks a different ratio preset. */
  onRatioChange?: (ratio: string) => void;
  /**
   * Initial ratio when uncontrolled (no `ratio` prop), e.g. "4:3" for
   * section images. Ignored when `ratio` is provided.
   */
  defaultRatio?: string;
  /** Custom ratio list. When provided, replaces BANNER_RATIOS. Single item hides the selector. */
  ratios?: RatioOption[];
  /** Shown below the editor, e.g. "Recommended: min 800×600, 4:3 aspect ratio". */
  resolutionHint?: string;
  /** Max height of the editor frame on desktop screens (defaults to 340px). Frame width scales to keep height comfortable. */
  desktopMaxHeight?: number;
}

const ZOOM_MAX = 3;

interface Draft {
  /** Previewable, canvas-clean image source (object URL). */
  src: string;
  revoke: boolean;
  naturalW: number;
  naturalH: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function loadImageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      img.naturalWidth > 0 && img.naturalHeight > 0
        ? resolve({ w: img.naturalWidth, h: img.naturalHeight })
        : reject(new Error("empty image"));
    img.onerror = () => reject(new Error("unreadable image"));
    img.src = src;
  });
}

/**
 * Compute the minimum CSS width (as a multiple of frameW) so the image,
 * rotated by `totalDeg`, fully covers the frame. Derivation: every corner of
 * the axis-aligned frame must lie inside the rotated image rectangle.
 */
function computeFitScale(
  ratioNum: number,
  naturalW: number,
  naturalH: number,
  totalDeg: number
): number {
  const rad = ((totalDeg % 360) * Math.PI) / 180;
  const cosA = Math.abs(Math.cos(rad));
  const sinA = Math.abs(Math.sin(rad));
  const r = naturalH / naturalW; // image h/w ratio
  return Math.max(cosA + sinA / ratioNum, (sinA + cosA / ratioNum) / r);
}

/**
 * Image editor with crop, zoom, rotate, grid overlay, and multi-gesture support.
 * On save the visible crop (with rotation baked in) is compressed to WebP and
 * uploaded — so stored files stay tiny and the public page shows pixel-identical
 * output.
 */
export default function BannerImageEditor({
  label,
  value,
  onChange,
  bucketName = "post-images",
  hint,
  ratio: ratioProp,
  onRatioChange,
  defaultRatio,
  ratios: ratiosProp,
  resolutionHint,
  desktopMaxHeight = 340,
}: BannerImageEditorProps) {
  // --- Ratio ---
  const ratioList = ratiosProp || BANNER_RATIOS;
  const hideRatioSelector = ratioList.length <= 1;
  const [internalRatio, setInternalRatio] = useState(
    defaultRatio || ratioList[0]?.value || DEFAULT_BANNER_RATIO
  );
  const ratio = ratioProp ?? internalRatio;
  const ratioNum = parseRatio(ratio);
  const exportSize = exportSizeForRatio(ratio);

  // Desktop frame sizing: adapts width according to aspect ratio so vertical height
  // remains comfortable (≤ ~340px) on desktop viewports. Wide banners (21:9, 4:1) get up to 720px width;
  // square/portrait (1:1, 4:3, 2:3) stay compact instead of towering.
  // On mobile (< 640px), min(100%, ...) gracefully takes full container width.
  const maxFrameW = Math.round(
    Math.min(720, Math.max(280, desktopMaxHeight * ratioNum))
  );
  const controlsMaxW = Math.max(540, maxFrameW);

  // --- Draft (active crop session) ---
  const [draft, setDraft] = useState<Draft | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [frameW, setFrameW] = useState(0);
  const [needCenter, setNeedCenter] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [uploadingOriginal, setUploadingOriginal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // --- Rotation ---
  const [baseRotation, setBaseRotation] = useState(0); // 0,90,180,270
  const [fineTune, setFineTune] = useState(0); // -45..+45
  const totalRotation = baseRotation + fineTune;

  // --- Refs ---
  const frameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );
  const lastPinchDistRef = useRef(0);
  const lastSavedImageRef = useRef(value);

  // --- Computed geometry ---
  const frameH = frameW / ratioNum;
  const fitScale = draft
    ? computeFitScale(ratioNum, draft.naturalW, draft.naturalH, totalRotation)
    : 1;
  const absScale = fitScale * zoom;
  const dispW = draft ? frameW * absScale : 0;
  const dispH = draft ? dispW * (draft.naturalH / draft.naturalW) : 0;

  // Clamp helpers. Use bounding box so panning range is correct for rotated images.
  const rotRad = (totalRotation * Math.PI) / 180;
  const cA = Math.abs(Math.cos(rotRad));
  const sA = Math.abs(Math.sin(rotRad));
  const visualW = dispW * cA + dispH * sA;
  const visualH = dispW * sA + dispH * cA;
  // At rotation, the image's top-left shifts. Offset range accounts for the
  // bounding box being wider/taller than the CSS element.
  const bbPadX = (visualW - dispW) / 2;
  const bbPadY = (visualH - dispH) / 2;
  const clampOffsetX = useCallback(
    (v: number) =>
      clamp(v, Math.min(0, frameW - dispW) - bbPadX, Math.max(0, bbPadX)),
    [frameW, dispW, bbPadX]
  );
  const clampOffsetY = useCallback(
    (v: number) =>
      clamp(v, Math.min(0, frameH - dispH) - bbPadY, Math.max(0, bbPadY)),
    [frameH, dispH, bbPadY]
  );

  // --- Effects ---

  // Measure the crop frame.
  useEffect(() => {
    if (!draft) return;
    const el = frameRef.current;
    if (!el) return;
    const update = () => setFrameW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [draft, ratio]);

  // Center when draft loads / resets / ratio or rotation changes.
  useEffect(() => {
    if (draft && needCenter && frameW > 0) {
      setOffsetX(clampOffsetX((frameW - dispW) / 2));
      setOffsetY(clampOffsetY((frameH - dispH) / 2));
      setNeedCenter(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, needCenter, frameW]);

  // Re-center on rotation change.
  useEffect(() => {
    if (draft) setNeedCenter(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRotation]);

  // Scroll-to-zoom (Cmd+scroll / trackpad pinch which fires ctrlKey wheel events).
  useEffect(() => {
    const el = frameRef.current;
    if (!el || !draft) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((prev) => clamp(prev - e.deltaY * 0.005, 1, ZOOM_MAX));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [draft]);

  // --- Draft lifecycle ---

  const closeDraft = () => {
    setDraft((d) => {
      if (d?.revoke) URL.revokeObjectURL(d.src);
      return null;
    });
    setBaseRotation(0);
    setFineTune(0);
  };

  const openDraft = (d: Draft) => {
    closeDraft();
    setDraft(d);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setBaseRotation(0);
    setFineTune(0);
    setNeedCenter(true);
  };

  /** Upload a file as-is (compressed) — used for GIFs and un-previewable files. */
  const uploadOriginalFile = async (file: File) => {
    setUploadingOriginal(true);
    try {
      const { publicUrl, size } = await uploadCompressedImage(file, {
        bucket: bucketName,
        dir: "public/hrms-banners",
        prefix: "hrms-banner",
        maxWidth: 1600,
        quality: 0.8,
      });
      onChange(publicUrl);
      toast.success(
        `Image saved (${(size / 1024).toFixed(0)} KB, compressed).`
      );
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingOriginal(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    // Animated GIFs can't survive a canvas crop — keep them intact.
    if (file.type === "image/gif") {
      await uploadOriginalFile(file);
      return;
    }
    const objUrl = URL.createObjectURL(file);
    try {
      const { w, h } = await loadImageSize(objUrl);
      openDraft({ src: objUrl, revoke: true, naturalW: w, naturalH: h });
    } catch {
      URL.revokeObjectURL(objUrl);
      toast("No preview available — uploading compressed original instead.");
      await uploadOriginalFile(file);
    }
  };

  /** Load a URL (pasted, or the saved image for repositioning) into the cropper. */
  const handleLoadUrl = async (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return;
    if (/\.gif(\?|#|$)/i.test(url)) {
      onChange(url);
      return;
    }
    setLoadingDraft(true);
    let objUrl: string | null = null;
    try {
      let src = url;
      if (/^https?:\/\//i.test(url)) {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) throw new Error("not an image");
        if (blob.type === "image/gif") {
          onChange(url);
          return;
        }
        objUrl = URL.createObjectURL(blob);
        src = objUrl;
      }
      const { w, h } = await loadImageSize(src);
      openDraft({ src, revoke: objUrl !== null, naturalW: w, naturalH: h });
      setUrlInput("");
    } catch {
      if (objUrl) URL.revokeObjectURL(objUrl);
      toast.error(
        "Couldn't load that image for cropping (remote host blocked it). Upload the file directly instead."
      );
    } finally {
      setLoadingDraft(false);
    }
  };

  // --- Drag-to-reposition (mouse + touch via Pointer Events) ---
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const map = pointersRef.current;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (map.size === 1) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: offsetX,
        startOffsetY: offsetY,
      };
    } else if (map.size >= 2) {
      // Two fingers → pinch zoom, cancel drag
      dragRef.current = null;
      const pts = [...map.values()];
      lastPinchDistRef.current = Math.hypot(
        pts[1].x - pts[0].x,
        pts[1].y - pts[0].y
      );
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const map = pointersRef.current;
    if (!map.has(e.pointerId)) return;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (map.size >= 2 && lastPinchDistRef.current > 0) {
      // Pinch-to-zoom
      const pts = [...map.values()];
      const dist = Math.hypot(
        pts[1].x - pts[0].x,
        pts[1].y - pts[0].y
      );
      const scale = dist / lastPinchDistRef.current;
      handleZoom(zoom * scale);
      lastPinchDistRef.current = dist;
    } else if (map.size === 1 && dragRef.current) {
      const drag = dragRef.current;
      setOffsetX(clampOffsetX(drag.startOffsetX + (e.clientX - drag.startX)));
      setOffsetY(clampOffsetY(drag.startOffsetY + (e.clientY - drag.startY)));
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const map = pointersRef.current;
    map.delete(e.pointerId);
    if (map.size < 2) lastPinchDistRef.current = 0;
    if (map.size === 0) dragRef.current = null;
  };

  // --- Zoom (keeps view anchor while scaling) ---
  const handleZoom = (next: number) => {
    const clamped = clamp(next, 1, ZOOM_MAX);
    if (!draft || frameW <= 0) {
      setZoom(clamped);
      return;
    }
    const sizeAt = (z: number) => {
      const w = frameW * fitScale * z;
      return { w, h: w * (draft.naturalH / draft.naturalW) };
    };
    const oldSize = sizeAt(zoom);
    const newSize = sizeAt(clamped);
    const oldRangeX = Math.max(0, oldSize.w - frameW);
    const oldRangeY = Math.max(0, oldSize.h - frameH);
    const fracX = oldRangeX === 0 ? 0.5 : -offsetX / oldRangeX;
    const fracY = oldRangeY === 0 ? 0.5 : -offsetY / oldRangeY;
    setZoom(clamped);
    setOffsetX(
      clamp(
        -fracX * Math.max(0, newSize.w - frameW),
        Math.min(0, frameW - newSize.w),
        0
      )
    );
    setOffsetY(
      clamp(
        -fracY * Math.max(0, newSize.h - frameH),
        Math.min(0, frameH - newSize.h),
        0
      )
    );
  };

  const handleReset = () => {
    setZoom(1);
    setBaseRotation(0);
    setFineTune(0);
    setNeedCenter(true);
  };

  const handleRatioChange = (next: string) => {
    if (onRatioChange) onRatioChange(next);
    else setInternalRatio(next);
    if (!draft) return;
    setNeedCenter(true);
  };

  // --- Rotation ---
  const handleQuickRotate = () => {
    setBaseRotation((prev) => (prev + 90) % 360);
    setNeedCenter(true);
  };

  const handleFineTuneChange = (val: number) => {
    setFineTune(Math.abs(val) < 0.5 ? 0 : val);
  };

  // --- Export the exact visible crop (with rotation baked in) ---
  const handleSave = async () => {
    if (!draft || frameW <= 0) return;
    setSaving(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("decode failed"));
        img.src = draft.src;
      });

      const canvas = document.createElement("canvas");
      canvas.width = exportSize.w;
      canvas.height = exportSize.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");

      const nw = draft.naturalW;
      const nh = draft.naturalH;
      const totalRot = baseRotation + fineTune;

      if (Math.abs(totalRot % 360) < 0.01) {
        // Non-rotated: pixel-exact source-rect export (fastest, sharpest).
        const dispWNow = frameW * absScale;
        const k = nw / dispWNow;
        const sw = Math.min(nw, frameW * k);
        const sh = Math.min(nh, frameH * k);
        const sx = clamp(-offsetX * k, 0, nw - sw);
        const sy = clamp(-offsetY * k, 0, nh - sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, exportSize.w, exportSize.h);
      } else {
        // Rotated: replay the full transform pipeline onto the canvas.
        const scaleToCanvas = exportSize.w / frameW;
        ctx.save();
        ctx.scale(scaleToCanvas, scaleToCanvas);
        const imgCX = offsetX + dispW / 2;
        const imgCY = offsetY + dispH / 2;
        ctx.translate(imgCX, imgCY);
        ctx.rotate((totalRot * Math.PI) / 180);
        ctx.translate(-imgCX, -imgCY);
        ctx.drawImage(img, 0, 0, nw, nh, offsetX, offsetY, dispW, dispH);
        ctx.restore();
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9)
      );
      if (!blob) throw new Error("export failed");
      const bannerFile = new File([blob], "banner.webp", {
        type: "image/webp",
      });
      const { publicUrl, size } = await uploadCompressedImage(bannerFile, {
        bucket: bucketName,
        dir: "public/hrms-banners",
        prefix: "hrms-banner",
        maxWidth: exportSize.w,
        quality: 0.85,
        maxSizeMB: 0.25,
      });
      // NOTE: the replaced storage file is cleaned up by the editor after
      // the module itself saves — never here, so leaving this page without
      // saving can't orphan the live image.
      onChange(publicUrl);
      closeDraft();
      toast.success(
        `Banner saved — ${exportSize.w}×${exportSize.h} WebP, ${(size / 1024).toFixed(0)} KB.`
      );
    } catch {
      toast.error("Couldn't save the banner. Try a different image.");
    } finally {
      setSaving(false);
    }
  };

  // ─── RENDER ───

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Ratio presets */}
      {!hideRatioSelector && (
        <div style={{ maxWidth: `min(100%, ${controlsMaxW}px)` }}>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
            Image ratio
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {ratioList.map((r) => {
              const active = ratio === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRatioChange(r.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  title={r.label}
                >
                  {ratioTabText(r.value)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single-ratio label (when selector is hidden) */}
      {hideRatioSelector && ratioList[0] && (
        <p
          className="text-xs font-medium text-gray-600 dark:text-gray-300"
          style={{ maxWidth: `min(100%, ${controlsMaxW}px)` }}
        >
          Fixed aspect ratio: {ratioTabText(ratioList[0].value)}
        </p>
      )}

      {draft ? (
        <div className="space-y-3">
          {/* Crop frame wrapper — constrained on desktop so it doesn't take over the screen */}
          <div
            className="w-full"
            style={{ maxWidth: `min(100%, ${maxFrameW}px)` }}
          >
            {/* Crop frame — drag to reposition, pinch/scroll to zoom */}
            <div
              ref={frameRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-grab active:cursor-grabbing touch-none select-none shadow-sm"
              style={{ aspectRatio: String(ratioNum) }}
              title="Drag to reposition · Cmd+Scroll to zoom · Pinch to zoom"
            >
              {frameW > 0 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.src}
                  alt="Banner crop preview"
                  draggable={false}
                  className="absolute left-0 top-0 pointer-events-none"
                  style={{
                    width: dispW,
                    height: dispH,
                    maxWidth: "none",
                    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${totalRotation}deg)`,
                  }}
                />
              )}

              {/* 3×3 rule-of-thirds grid */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/30" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/30" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/30" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/30" />
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 text-white text-xs pointer-events-none whitespace-nowrap z-20 backdrop-blur-xs">
                <Move size={12} />
                Drag to reposition
              </div>
            </div>
          </div>

          {/* Controls section (zoom, rotate, buttons) */}
          <div
            className="space-y-3"
            style={{ maxWidth: `min(100%, ${controlsMaxW}px)` }}
          >
            {/* Zoom controls */}
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-gray-500 shrink-0" />
              <input
                type="range"
                min={1}
                max={ZOOM_MAX}
                step={0.01}
                value={zoom}
                onChange={(e) => handleZoom(Number(e.target.value))}
                className="flex-1 accent-blue-600"
                aria-label="Banner zoom"
              />
              <ZoomIn size={16} className="text-gray-500 shrink-0" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-11 text-right tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotation controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums shrink-0">
                  {fineTune > 0 ? "+" : ""}
                  {fineTune.toFixed(1)}°
                </span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={fineTune}
                  onChange={(e) => handleFineTuneChange(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                  aria-label="Fine rotation"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  ±45°
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickRotate}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Rotate 90° clockwise"
                >
                  <RotateCw size={13} /> 90°
                </button>
                {baseRotation !== 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    Base: {baseRotation}°
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 ml-auto"
                  title="Reset position, zoom & rotation"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Exports exactly {exportSize.w} × {exportSize.h} WebP (
                {ratioTabText(ratio)}).
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={closeDraft}>
                  <X size={15} /> Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                >
                  <Check size={15} /> Save banner
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Saved banner preview (selected ratio, matching the public page) */}
          {value && (
            <div
              className="w-full"
              style={{ maxWidth: `min(100%, ${maxFrameW}px)` }}
            >
              <div
                className="relative w-full rounded-lg overflow-hidden group border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 shadow-sm"
                style={{ aspectRatio: String(ratioNum) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt={`${label} Preview`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onChange("")}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                  type="button"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/gif, image/heif, image/webp"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div
            className="space-y-3"
            style={{ maxWidth: `min(100%, ${controlsMaxW}px)` }}
          >
            <div className="flex gap-2 items-center flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingOriginal || loadingDraft}
              >
                <Upload size={15} /> {value ? "Replace image" : "Upload image"}
              </Button>
              {value && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleLoadUrl(value)}
                  loading={loadingDraft}
                  title="Adjust the crop of the current image"
                >
                  <Pencil size={15} /> Reposition
                </Button>
              )}
            </div>

            {/* Paste-a-URL path */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleLoadUrl(urlInput);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none dark:text-white transition-all"
                  placeholder="…or paste an image URL, then load it"
                />
                <Link2
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleLoadUrl(urlInput)}
                loading={loadingDraft}
                disabled={!urlInput.trim()}
              >
                Load
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className="space-y-1"
        style={{ maxWidth: `min(100%, ${controlsMaxW}px)` }}
      >
        {hint ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        ) : null}
        {resolutionHint ? (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {resolutionHint}
          </p>
        ) : null}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          JPG, PNG, GIF, HEIF, WebP. Uploads are auto-compressed to WebP and the
          previous banner file is removed on save, to save storage.
        </p>
      </div>
    </div>
  );
}
