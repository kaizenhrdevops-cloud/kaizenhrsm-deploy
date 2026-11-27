// src/components/page-builder/FreeformPageRenderer.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DESKTOP_STAGE_WIDTH,
  MOBILE_STAGE_WIDTH,
  type Breakpoint,
  type DynamicTokenContext,
  type FreeformDocument,
  type FreeformSection,
} from "@/data/about-us-defaults";
import CanvasElementContent from "./CanvasElementContent";

function ScaledStageSection({
  section,
  breakpoint,
  stageWidth,
  sectionIndex,
  tokenCtx,
  suppressH1,
}: {
  section: FreeformSection;
  breakpoint: Breakpoint;
  stageWidth: number;
  sectionIndex: number;
  tokenCtx: DynamicTokenContext;
  suppressH1: boolean;
}) {
  const outerRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const updateScale = () => {
      const available = el.clientWidth;
      if (available <= 0) return;
      if (breakpoint === "desktop") {
        setScale(available < stageWidth ? available / stageWidth : 1);
      } else {
        // On phones, scale cleanly from 320px up to 440px max
        const capped = Math.min(available, 440);
        setScale(capped / stageWidth);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [breakpoint, stageWidth]);

  const rawHeight =
    breakpoint === "desktop" ? section.desktopHeight : section.mobileHeight;
  const scaledHeight = Math.round(rawHeight * scale);
  const scaledWidth = Math.round(stageWidth * scale);

  const visibleElements = section.elements
    .filter((el) => !el[breakpoint].hidden)
    .sort((a, b) => a.zIndex - b.zIndex);

  const backgroundStyle: React.CSSProperties =
    section.backgroundType === "gradient"
      ? { backgroundImage: section.backgroundGradient }
      : { backgroundColor: section.backgroundColor };

  return (
    <section
      ref={outerRef}
      className="relative w-full"
      style={{
        height: `${scaledHeight}px`,
        zIndex: sectionIndex + 1,
      }}
    >
      {/* Full-bleed background clipped independently so overlapping elements
          (e.g. Hero image at negative Y) can still extend cleanly above. */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={backgroundStyle}
      >
        {section.showGridPattern && (
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        )}
      </div>

      {/* Centered, proportionally scaled design stage */}
      <div
        className="relative mx-auto"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        <div
          style={{
            width: `${stageWidth}px`,
            height: `${rawHeight}px`,
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
          }}
        >
          {visibleElements.map((el) => {
            const frame = el[breakpoint];
            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: `${frame.x}px`,
                  top: `${frame.y}px`,
                  width: `${frame.w}px`,
                  height: `${frame.h}px`,
                  zIndex: el.zIndex,
                  transform: frame.rotation
                    ? `rotate(${frame.rotation}deg)`
                    : undefined,
                }}
              >
                <CanvasElementContent
                  element={el}
                  breakpoint={breakpoint}
                  tokenCtx={tokenCtx}
                  interactive={true}
                  suppressH1={suppressH1}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Public renderer for FreeformDocument pages.
 * Renders Desktop (1200px scaled) at md+ and Mobile (390px scaled) below md
 * so SSR paints immediately for both screen classes with zero layout flash.
 */
export default function FreeformPageRenderer({
  doc,
  tokenCtx,
  forcedBreakpoint,
}: {
  doc: FreeformDocument;
  tokenCtx: DynamicTokenContext;
  /** Used inside the Admin Preview modal to force Desktop or Mobile view. */
  forcedBreakpoint?: Breakpoint;
}) {
  if (forcedBreakpoint) {
    const stageWidth =
      forcedBreakpoint === "desktop" ? DESKTOP_STAGE_WIDTH : MOBILE_STAGE_WIDTH;

    return (
      <div
        className="w-full overflow-x-clip"
        style={{ backgroundColor: doc.pageBgColor }}
      >
        {doc.sections.map((section, idx) => (
          <ScaledStageSection
            key={section.id}
            section={section}
            breakpoint={forcedBreakpoint}
            stageWidth={stageWidth}
            sectionIndex={idx}
            tokenCtx={tokenCtx}
            suppressH1={false}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-x-clip"
      style={{ backgroundColor: doc.pageBgColor }}
    >
      {/* Desktop & Tablet Freeform Stage (>= 768px) */}
      <div className="hidden md:block">
        {doc.sections.map((section, idx) => (
          <ScaledStageSection
            key={`d-${section.id}`}
            section={section}
            breakpoint="desktop"
            stageWidth={DESKTOP_STAGE_WIDTH}
            sectionIndex={idx}
            tokenCtx={tokenCtx}
            suppressH1={false}
          />
        ))}
      </div>

      {/* Mobile Freeform Stage (< 768px) */}
      <div className="block md:hidden">
        {doc.sections.map((section, idx) => (
          <ScaledStageSection
            key={`m-${section.id}`}
            section={section}
            breakpoint="mobile"
            stageWidth={MOBILE_STAGE_WIDTH}
            sectionIndex={idx}
            tokenCtx={tokenCtx}
            suppressH1={true}
          />
        ))}
      </div>
    </div>
  );
}
