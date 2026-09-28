// src/app/admin/editor/components/block-wrapper.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import React from "react";

interface BlockWrapperProps {
  id: string;
  children: React.ReactNode;
}

export function BlockWrapper({ id, children }: BlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    // Translate (NOT Transform): Transform includes scaleX/scaleY derived
    // from rect deltas, which stretched the dragged block vertically when
    // hovering blocks of a different height. Translate moves it 1:1.
    transform: CSS.Translate.toString(transform),
    transition,
    // Original stays in-flow as a dimmed placeholder while DragOverlay
    // (see step-3-content) renders the floating preview under the cursor.
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 0 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        isDragging ? "rounded-lg outline-2 outline-dashed outline-[#008080]/50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-50 transition-opacity"
      >
        <GripVertical size={20} />
      </div>
      {children}
    </div>
  );
}
