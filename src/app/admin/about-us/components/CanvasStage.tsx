// src/app/admin/about-us/components/CanvasStage.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  GripHorizontal,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  DESKTOP_STAGE_WIDTH,
  MOBILE_STAGE_WIDTH,
  type Breakpoint,
  type CanvasElement,
  type DynamicTokenContext,
  type ElementFrame,
  type FreeformDocument,
  type FreeformSection,
} from "@/data/about-us-defaults";
import CanvasElementContent from "@/components/page-builder/CanvasElementContent";
import Footer from "@/components/layout/Footer";
import { useSettings } from "@/components/layout/SettingsProvider";
import { useNavItems } from "@/components/layout/NavProvider";
import { useHrmsSubmenus } from "@/components/layout/navbar/useHrmsSubmenus";
import { resourcesSubmenus, companySubmenus } from "@/data/submenus";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type SnapGuide = {
  sectionId: string;
  orientation: "vertical" | "horizontal";
  pos: number;
};

type DragSession = {
  kind: "move" | "resize";
  handle?: ResizeHandle;
  sectionId: string;
  elementId: string;
  startClientX: number;
  startClientY: number;
  startFrame: ElementFrame;
  moved: boolean;
};

type SectionResizeSession = {
  sectionId: string;
  startClientY: number;
  startHeight: number;
  moved: boolean;
};

const MIN_EL_W = 32;
const MIN_EL_H = 24;
const SNAP_THRESHOLD = 6;
const GRID_STEP = 10;

const HANDLE_STYLES: Record<ResizeHandle, string> = {
  nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
  n: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
  ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
  e: "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize",
  se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
  s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
  sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
  w: "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize",
};

const ALL_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

/**
 * Compact 1-column mobile footer preview used inside the 390px Mobile Studio
 * canvas (since the desktop browser viewport triggers Footer's md: media queries).
 */
function MobileFooterPreview() {
  const settings = useSettings();
  const navItems = useNavItems();
  const hrmsSubmenus = useHrmsSubmenus();

  const hrmsNav = navItems.find((i) => i.footer_section === "hrms");
  const secondary = navItems.filter(
    (i) => i.footer_section === "resources" || i.footer_section === "company"
  );

  return (
    <div className="bg-[#008080] text-white px-6 py-10 space-y-7 text-xs">
      <div className="space-y-2">
        <p className="text-xl font-bold">Kaizen</p>
        <p className="text-teal-100/85">
          {settings.company_slogan ||
            "Malaysia's Tier 1 Enterprise HR Solution"}
        </p>
      </div>

      {hrmsNav && (
        <div>
          <p className="font-semibold uppercase tracking-wider mb-2.5">
            {hrmsNav.label}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-teal-100/80">
            {hrmsSubmenus.slice(0, 8).map((item, i) => (
              <span key={i} className="truncate">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {secondary.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {secondary.map((sec) => {
            const list =
              sec.footer_section === "resources"
                ? resourcesSubmenus
                : companySubmenus;
            return (
              <div key={sec.key}>
                <p className="font-semibold uppercase tracking-wider mb-2">
                  {sec.label}
                </p>
                <div className="space-y-1.5 text-teal-100/80">
                  {list.map((l, idx) => (
                    <p key={idx} className="truncate">
                      {l.name}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-white/15 text-center text-teal-100/70">
        {settings.footer_copyright_text ||
          "© KaiZenHR Sdn Bhd 2025. All Rights Reserved."}
      </div>
    </div>
  );
}

function computeSnapPosition(
  rawX: number,
  rawY: number,
  w: number,
  h: number,
  stageWidth: number,
  sectionHeight: number,
  siblings: CanvasElement[],
  breakpoint: Breakpoint,
  snapToGrid: boolean
): { x: number; y: number; guides: Omit<SnapGuide, "sectionId">[] } {
  const xTargets = [
    0,
    40,
    70,
    stageWidth / 2,
    stageWidth - 70,
    stageWidth - 40,
    stageWidth,
  ];
  const yTargets = [0, sectionHeight / 2, sectionHeight];

  for (const sib of siblings) {
    const f = sib[breakpoint];
    if (f.hidden) continue;
    xTargets.push(f.x, f.x + f.w / 2, f.x + f.w);
    yTargets.push(f.y, f.y + f.h / 2, f.y + f.h);
  }

  let bestX = rawX;
  let bestXDist = SNAP_THRESHOLD + 1;
  let snappedXGuide: number | null = null;

  for (const target of xTargets) {
    const candidates = [
      { edge: rawX, next: target },
      { edge: rawX + w / 2, next: target - w / 2 },
      { edge: rawX + w, next: target - w },
    ];
    for (const c of candidates) {
      const dist = Math.abs(c.edge - target);
      if (dist < bestXDist) {
        bestXDist = dist;
        bestX = Math.round(c.next);
        snappedXGuide = target;
      }
    }
  }

  let bestY = rawY;
  let bestYDist = SNAP_THRESHOLD + 1;
  let snappedYGuide: number | null = null;

  for (const target of yTargets) {
    const candidates = [
      { edge: rawY, next: target },
      { edge: rawY + h / 2, next: target - h / 2 },
      { edge: rawY + h, next: target - h },
    ];
    for (const c of candidates) {
      const dist = Math.abs(c.edge - target);
      if (dist < bestYDist) {
        bestYDist = dist;
        bestY = Math.round(c.next);
        snappedYGuide = target;
      }
    }
  }

  const guides: Omit<SnapGuide, "sectionId">[] = [];
  if (snappedXGuide !== null) {
    guides.push({ orientation: "vertical", pos: snappedXGuide });
  } else if (snapToGrid) {
    bestX = Math.round(rawX / GRID_STEP) * GRID_STEP;
  }

  if (snappedYGuide !== null) {
    guides.push({ orientation: "horizontal", pos: snappedYGuide });
  } else if (snapToGrid) {
    bestY = Math.round(rawY / GRID_STEP) * GRID_STEP;
  }

  return { x: bestX, y: bestY, guides };
}

export default function CanvasStage({
  doc,
  breakpoint,
  zoom,
  showGrid,
  snapEnabled,
  tokenCtx,
  selectedSectionId,
  selectedElementId,
  editingElementId,
  onSelectSection,
  onSelectElement,
  onStartEditingText,
  onStopEditingText,
  onUpdateElementFrame,
  onCommitInteraction,
  onUpdateElementText,
  onResizeSectionHeight,
  onReorderSection,
  onDuplicateSection,
  onDeleteSection,
  onDuplicateElement,
  onDeleteElement,
  onMoveElementLayer,
  onToggleLockElement,
}: {
  doc: FreeformDocument;
  breakpoint: Breakpoint;
  zoom: number;
  showGrid: boolean;
  snapEnabled: boolean;
  tokenCtx: DynamicTokenContext;
  selectedSectionId: string | null;
  selectedElementId: string | null;
  editingElementId: string | null;
  onSelectSection: (sectionId: string) => void;
  onSelectElement: (sectionId: string, elementId: string) => void;
  onStartEditingText: (elementId: string) => void;
  onStopEditingText: () => void;
  onUpdateElementFrame: (
    sectionId: string,
    elementId: string,
    frame: ElementFrame
  ) => void;
  onCommitInteraction: () => void;
  onUpdateElementText: (
    sectionId: string,
    elementId: string,
    nextContent: string
  ) => void;
  onResizeSectionHeight: (sectionId: string, nextHeight: number) => void;
  onReorderSection: (sectionId: string, dir: -1 | 1) => void;
  onDuplicateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateElement: (sectionId: string, elementId: string) => void;
  onDeleteElement: (sectionId: string, elementId: string) => void;
  onMoveElementLayer: (
    sectionId: string,
    elementId: string,
    dir: "forward" | "backward"
  ) => void;
  onToggleLockElement: (sectionId: string, elementId: string) => void;
}) {
  const stageWidth =
    breakpoint === "desktop" ? DESKTOP_STAGE_WIDTH : MOBILE_STAGE_WIDTH;
  const navItems = useNavItems();

  const innerArtboardRef = useRef<HTMLDivElement>(null);
  const [innerHeight, setInnerHeight] = useState(1400);

  // Measure actual scaled artboard height (sections + real Footer) so the
  // outer scaled container NEVER has dead white space underneath!
  useEffect(() => {
    const el = innerArtboardRef.current;
    if (!el) return;
    const measure = () => {
      if (el.scrollHeight > 0) setInnerHeight(el.scrollHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc, breakpoint]);

  const dragRef = useRef<DragSession | null>(null);
  const sectionResizeRef = useRef<SectionResizeSession | null>(null);
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [hudText, setHudText] = useState<string | null>(null);

  const startElementPointer = (
    e: React.PointerEvent,
    section: FreeformSection,
    el: CanvasElement,
    kind: "move" | "resize",
    handle?: ResizeHandle
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (editingElementId && editingElementId !== el.id) {
      onStopEditingText();
    }

    onSelectElement(section.id, el.id);

    if (el.locked || editingElementId === el.id) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const frame = el[breakpoint];
    dragRef.current = {
      kind,
      handle,
      sectionId: section.id,
      elementId: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startFrame: { ...frame },
      moved: false,
    };
  };

  const handleElementPointerMove = (
    e: React.PointerEvent,
    section: FreeformSection,
    el: CanvasElement
  ) => {
    const session = dragRef.current;
    if (!session || session.elementId !== el.id) return;

    const dx = (e.clientX - session.startClientX) / zoom;
    const dy = (e.clientY - session.startClientY) / zoom;
    if (!session.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    session.moved = true;

    const sf = session.startFrame;
    const sectionHeight =
      breakpoint === "desktop" ? section.desktopHeight : section.mobileHeight;

    if (session.kind === "move") {
      let nextX = Math.round(sf.x + dx);
      let nextY = Math.round(sf.y + dy);

      if (snapEnabled && !e.altKey) {
        const siblings = section.elements.filter((s) => s.id !== el.id);
        const snapped = computeSnapPosition(
          nextX,
          nextY,
          sf.w,
          sf.h,
          stageWidth,
          sectionHeight,
          siblings,
          breakpoint,
          showGrid
        );
        nextX = snapped.x;
        nextY = snapped.y;
        setGuides(
          snapped.guides.map((g) => ({ ...g, sectionId: section.id }))
        );
      } else {
        setGuides([]);
      }

      nextX = Math.max(-240, Math.min(stageWidth + 120, nextX));
      nextY = Math.max(-180, Math.min(sectionHeight + 120, nextY));

      onUpdateElementFrame(section.id, el.id, { ...sf, x: nextX, y: nextY });
      setHudText(`X: ${nextX}  Y: ${nextY}`);
    } else if (session.kind === "resize" && session.handle) {
      let x = sf.x;
      let y = sf.y;
      let w = sf.w;
      let h = sf.h;
      const handle = session.handle;

      if (handle.includes("e")) {
        w = Math.max(MIN_EL_W, Math.round(sf.w + dx));
      }
      if (handle.includes("w")) {
        const nextW = Math.max(MIN_EL_W, Math.round(sf.w - dx));
        x = Math.round(sf.x + (sf.w - nextW));
        w = nextW;
      }
      if (handle.includes("s")) {
        h = Math.max(MIN_EL_H, Math.round(sf.h + dy));
      }
      if (handle.includes("n")) {
        const nextH = Math.max(MIN_EL_H, Math.round(sf.h - dy));
        y = Math.round(sf.y + (sf.h - nextH));
        h = nextH;
      }

      if (showGrid && snapEnabled && !e.altKey) {
        w = Math.max(MIN_EL_W, Math.round(w / GRID_STEP) * GRID_STEP);
        h = Math.max(MIN_EL_H, Math.round(h / GRID_STEP) * GRID_STEP);
      }

      setGuides([]);
      onUpdateElementFrame(section.id, el.id, { ...sf, x, y, w, h });
      setHudText(`${w} × ${h} px`);
    }
  };

  const endElementPointer = (e: React.PointerEvent) => {
    const session = dragRef.current;
    if (!session) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const didMove = session.moved;
    dragRef.current = null;
    setGuides([]);
    setHudText(null);
    if (didMove) {
      onCommitInteraction();
    }
  };

  const startSectionResize = (
    e: React.PointerEvent,
    section: FreeformSection
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const currentH =
      breakpoint === "desktop" ? section.desktopHeight : section.mobileHeight;
    sectionResizeRef.current = {
      sectionId: section.id,
      startClientY: e.clientY,
      startHeight: currentH,
      moved: false,
    };
  };

  const moveSectionResize = (e: React.PointerEvent, section: FreeformSection) => {
    const sess = sectionResizeRef.current;
    if (!sess || sess.sectionId !== section.id) return;
    const dy = (e.clientY - sess.startClientY) / zoom;
    if (Math.abs(dy) < 2) return;
    sess.moved = true;
    const nextH = Math.max(
      140,
      Math.min(2400, Math.round(sess.startHeight + dy))
    );
    onResizeSectionHeight(section.id, nextH);
  };

  const endSectionResize = (e: React.PointerEvent) => {
    const sess = sectionResizeRef.current;
    if (!sess) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const didMove = sess.moved;
    sectionResizeRef.current = null;
    if (didMove) {
      onCommitInteraction();
    }
  };

  return (
    <div
      className="flex-1 overflow-auto bg-slate-200/80 dark:bg-slate-950 p-6 sm:p-8"
      onClick={() => {
        if (editingElementId) onStopEditingText();
      }}
    >
      {/* Scaled Artboard Shell — height tightly matches innerHeight * zoom so zero white gap */}
      <div
        className="mx-auto shadow-2xl rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-white"
        style={{
          width: `${Math.round(stageWidth * zoom)}px`,
          height: `${Math.round(innerHeight * zoom)}px`,
        }}
      >
        <div
          ref={innerArtboardRef}
          style={{
            width: `${stageWidth}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            backgroundColor: doc.pageBgColor,
          }}
        >
          {/* Simulated Public Navbar synced with live NavProvider items */}
          <div className="h-20 px-8 bg-white border-b border-slate-100 flex items-center justify-between select-none pointer-events-none">
            <span className="text-3xl font-bold text-[#008080] tracking-tight">
              kaizen
            </span>
            {breakpoint === "desktop" && (
              <div className="flex items-center gap-6 text-sm font-semibold text-slate-700">
                {navItems.map((item) => (
                  <span key={item.key}>{item.label}</span>
                ))}
              </div>
            )}
            <span className="px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 shadow-sm">
              Contact Us
            </span>
          </div>

          {/* Freeform Sections */}
          {doc.sections.map((section, idx) => {
            const sectionHeight =
              breakpoint === "desktop"
                ? section.desktopHeight
                : section.mobileHeight;
            const isSectionSelected =
              selectedSectionId === section.id && !selectedElementId;
            const sectionGuides = guides.filter(
              (g) => g.sectionId === section.id
            );

            const bgStyle: React.CSSProperties =
              section.backgroundType === "gradient"
                ? { backgroundImage: section.backgroundGradient }
                : { backgroundColor: section.backgroundColor };

            const visibleElements = section.elements
              .filter((el) => !el[breakpoint].hidden)
              .sort((a, b) => a.zIndex - b.zIndex);

            return (
              <div
                key={section.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingElementId) onStopEditingText();
                  onSelectSection(section.id);
                }}
                className={`relative select-none group/sec transition-shadow ${
                  isSectionSelected ? "ring-2 ring-inset ring-blue-500" : ""
                }`}
                style={{
                  width: `${stageWidth}px`,
                  height: `${sectionHeight}px`,
                  zIndex: idx + 1,
                }}
              >
                {/* Section Background Layer */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={bgStyle}
                >
                  {section.showGridPattern && (
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                  )}
                  {showGrid && (
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(59,130,246,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.28) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  )}
                </div>

                {/* Section Controls Chip (Top-Left + Top-Right Delete/Move!) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-2 left-2 right-2 z-[60] flex items-center justify-between pointer-events-none transition-opacity ${
                    selectedSectionId === section.id
                      ? "opacity-100"
                      : "opacity-0 group-hover/sec:opacity-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSection(section.id)}
                    className={`pointer-events-auto px-2.5 py-0.5 rounded text-[11px] font-semibold shadow-xs cursor-pointer ${
                      selectedSectionId === section.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900/75 text-white"
                    }`}
                  >
                    {section.name} · {sectionHeight}px
                  </button>

                  <div className="pointer-events-auto flex items-center gap-0.5 bg-slate-900/85 text-white px-1 py-0.5 rounded-lg shadow-sm">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onReorderSection(section.id, -1)}
                      title="Move section up"
                      className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === doc.sections.length - 1}
                      onClick={() => onReorderSection(section.id, 1)}
                      title="Move section down"
                      className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateSection(section.id)}
                      title="Duplicate section"
                      className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={doc.sections.length <= 1}
                      onClick={() => onDeleteSection(section.id)}
                      title={
                        doc.sections.length <= 1
                          ? "At least one section is required"
                          : "Delete section"
                      }
                      className="p-1 text-red-300 hover:bg-red-600 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Magnetic Smart Snap Guides */}
                {sectionGuides.map((g, gi) =>
                  g.orientation === "vertical" ? (
                    <div
                      key={`vg-${gi}`}
                      className="pointer-events-none absolute top-0 bottom-0 w-px bg-pink-500 z-[90]"
                      style={{ left: `${g.pos}px` }}
                    />
                  ) : (
                    <div
                      key={`hg-${gi}`}
                      className="pointer-events-none absolute left-0 right-0 h-px bg-pink-500 z-[90]"
                      style={{ top: `${g.pos}px` }}
                    />
                  )
                )}

                {/* Freeform Elements */}
                {visibleElements.map((el) => {
                  const frame = el[breakpoint];
                  const isSelected = selectedElementId === el.id;
                  const isEditing = editingElementId === el.id;

                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) =>
                        startElementPointer(e, section, el, "move")
                      }
                      onPointerMove={(e) =>
                        handleElementPointerMove(e, section, el)
                      }
                      onPointerUp={endElementPointer}
                      onPointerCancel={endElementPointer}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (el.type === "text" && !el.locked) {
                          onSelectElement(section.id, el.id);
                          onStartEditingText(el.id);
                        }
                      }}
                      style={{
                        position: "absolute",
                        left: `${frame.x}px`,
                        top: `${frame.y}px`,
                        width: `${frame.w}px`,
                        height: `${frame.h}px`,
                        zIndex: isSelected ? el.zIndex + 30 : el.zIndex,
                        transform: frame.rotation
                          ? `rotate(${frame.rotation}deg)`
                          : undefined,
                        touchAction: "none",
                      }}
                      className={`group ${
                        el.locked
                          ? "cursor-default"
                          : isEditing
                            ? "cursor-text"
                            : "cursor-move"
                      }`}
                    >
                      <CanvasElementContent
                        element={el}
                        breakpoint={breakpoint}
                        tokenCtx={tokenCtx}
                        interactive={false}
                        isEditingInline={isEditing}
                        onInlineTextChange={(text) =>
                          onUpdateElementText(section.id, el.id, text)
                        }
                        onInlineTextBlur={() => {
                          onStopEditingText();
                          onCommitInteraction();
                        }}
                      />

                      {!isSelected && (
                        <div className="pointer-events-none absolute inset-0 rounded border border-transparent group-hover:border-blue-400/80 transition-colors" />
                      )}

                      {isSelected && (
                        <>
                          <div
                            className={`pointer-events-none absolute inset-0 border-2 ${
                              el.locked
                                ? "border-amber-500 border-dashed"
                                : "border-blue-600"
                            }`}
                          />

                          {!isEditing && (
                            <div
                              onPointerDown={(e) => e.stopPropagation()}
                              className="absolute -top-9 left-0 flex items-center gap-0.5 bg-slate-900 text-white px-1.5 py-1 rounded-lg shadow-lg text-[11px] whitespace-nowrap z-[80]"
                            >
                              <span className="px-1.5 font-semibold text-blue-300 max-w-[130px] truncate">
                                {el.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveElementLayer(
                                    section.id,
                                    el.id,
                                    "forward"
                                  )
                                }
                                title="Bring forward"
                                className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveElementLayer(
                                    section.id,
                                    el.id,
                                    "backward"
                                  )
                                }
                                title="Send backward"
                                className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDuplicateElement(section.id, el.id)
                                }
                                title="Duplicate (Ctrl+D)"
                                className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleLockElement(section.id, el.id)
                                }
                                title={el.locked ? "Unlock" : "Lock"}
                                className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                              >
                                {el.locked ? (
                                  <Lock size={12} className="text-amber-400" />
                                ) : (
                                  <Unlock size={12} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteElement(section.id, el.id)
                                }
                                title="Delete (Del)"
                                className="p-1 hover:bg-red-600 text-red-300 hover:text-white rounded cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          {hudText && (
                            <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold shadow-md whitespace-nowrap z-[95]">
                              {hudText}
                            </div>
                          )}

                          {!el.locked &&
                            !isEditing &&
                            ALL_HANDLES.map((h) => (
                              <div
                                key={h}
                                onPointerDown={(e) =>
                                  startElementPointer(
                                    e,
                                    section,
                                    el,
                                    "resize",
                                    h
                                  )
                                }
                                onPointerMove={(e) =>
                                  handleElementPointerMove(e, section, el)
                                }
                                onPointerUp={endElementPointer}
                                onPointerCancel={endElementPointer}
                                className={`absolute w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow-xs z-[85] ${HANDLE_STYLES[h]}`}
                                style={{ touchAction: "none" }}
                              />
                            ))}
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Bottom Section Height Resize Handle */}
                <div
                  onPointerDown={(e) => startSectionResize(e, section)}
                  onPointerMove={(e) => moveSectionResize(e, section)}
                  onPointerUp={endSectionResize}
                  onPointerCancel={endSectionResize}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag vertically to resize section height"
                  className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-[55] group/resizer flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                  style={{ touchAction: "none" }}
                >
                  <div className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center gap-1 opacity-0 group-hover/resizer:opacity-100 shadow transition-opacity">
                    <GripHorizontal size={11} />
                    Resize height ({sectionHeight}px)
                  </div>
                </div>
              </div>
            );
          })}

          {/* REAL LIVE PUBLIC FOOTER (non-interactive preview so links don't navigate away) */}
          <div className="relative pointer-events-none select-none">
            {breakpoint === "desktop" ? <Footer /> : <MobileFooterPreview />}
          </div>
        </div>
      </div>
    </div>
  );
}
