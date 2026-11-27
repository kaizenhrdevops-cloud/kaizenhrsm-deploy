// src/app/admin/about-us/components/CanvasStage.tsx
"use client";

import React, { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
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

const MIN_EL_W = 40;
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
  const xTargets = [0, 40, stageWidth / 2, stageWidth - 40, stageWidth];
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

      // Clamp to sane bounds while allowing negative Y hero-overlap up to -180px
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
    const nextH = Math.max(140, Math.min(2400, Math.round(sess.startHeight + dy)));
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

  const totalHeight = doc.sections.reduce(
    (sum, s) =>
      sum + (breakpoint === "desktop" ? s.desktopHeight : s.mobileHeight),
    0
  );

  return (
    <div
      className="flex-1 overflow-auto bg-slate-200/80 dark:bg-slate-950 p-6 sm:p-10"
      onClick={() => {
        if (editingElementId) onStopEditingText();
      }}
    >
      {/* Scaled Artboard Container */}
      <div
        className="mx-auto shadow-2xl rounded-xl border border-slate-300 dark:border-slate-700 overflow-visible bg-white"
        style={{
          width: `${Math.round(stageWidth * zoom)}px`,
          minHeight: `${Math.round((totalHeight + 64) * zoom)}px`,
        }}
      >
        <div
          style={{
            width: `${stageWidth}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            backgroundColor: doc.pageBgColor,
          }}
        >
          {/* Simulated Public Navbar Bar (visual reference for 80px fixed navbar) */}
          <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between select-none pointer-events-none">
            <span className="text-2xl font-bold text-[#008080] tracking-tight">
              kaizen
            </span>
            <span className="text-xs font-medium text-slate-400">
              Public Navbar Preview ({breakpoint === "desktop" ? "1200px Desktop" : "390px Mobile"})
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-slate-900">
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
                className={`relative select-none transition-shadow ${
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

                {/* Section Label Chip */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSection(section.id);
                  }}
                  className={`absolute top-2 left-2 z-[60] px-2.5 py-0.5 rounded text-[11px] font-semibold shadow-xs transition-opacity cursor-pointer ${
                    selectedSectionId === section.id
                      ? "bg-blue-600 text-white opacity-100"
                      : "bg-slate-900/60 text-white/90 opacity-60 hover:opacity-100"
                  }`}
                >
                  {section.name} · {sectionHeight}px
                </button>

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
                      {/* Actual WYSIWYG Element Content */}
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

                      {/* Hover Outline */}
                      {!isSelected && (
                        <div className="pointer-events-none absolute inset-0 rounded border border-transparent group-hover:border-blue-400/80 transition-colors" />
                      )}

                      {/* Selected Bounding Box + 8 Handles + Floating Action Bar */}
                      {isSelected && (
                        <>
                          <div
                            className={`pointer-events-none absolute inset-0 border-2 ${
                              el.locked
                                ? "border-amber-500 border-dashed"
                                : "border-blue-600"
                            }`}
                          />

                          {/* Floating Quick Toolbar above element */}
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
                                  onMoveElementLayer(section.id, el.id, "forward")
                                }
                                title="Bring forward"
                                className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveElementLayer(section.id, el.id, "backward")
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
                                onClick={() => onDeleteElement(section.id, el.id)}
                                title="Delete (Del)"
                                className="p-1 hover:bg-red-600 text-red-300 hover:text-white rounded cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          {/* Live Coordinate / Size HUD while dragging or resizing */}
                          {hudText && (
                            <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold shadow-md whitespace-nowrap z-[95]">
                              {hudText}
                            </div>
                          )}

                          {/* 8 Corner & Edge Resize Handles */}
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

                {/* Interactive Bottom Section Height Resize Handle */}
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
        </div>
      </div>
    </div>
  );
}
