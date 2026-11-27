// src/app/admin/about-us/AboutUsStudio.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Award,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Grid,
  Heading,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  Lock,
  Magnet,
  Minus,
  Monitor,
  MousePointerClick,
  Plus,
  Redo2,
  Rocket,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Square,
  Star,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Wand2,
  Youtube,
} from "lucide-react";
import {
  BRAND_HERO_GRADIENT,
  autoLayoutSectionMobile,
  type Breakpoint,
  type CanvasElement,
  type DynamicTokenContext,
  type ElementFrame,
  type FreeformDocument,
  type FreeformSection,
  type PageSeoMetadata,
} from "@/data/about-us-defaults";
import type { PublicSettings } from "@/lib/public-settings";
import type { PublicNavItem } from "@/data/navbar-defaults";
import { SettingsProvider } from "@/components/layout/SettingsProvider";
import { NavProvider } from "@/components/layout/NavProvider";
import {
  publishAboutPage,
  resetAboutDraftToDefault,
  restoreAboutRevisionToDraft,
  saveAboutPageDraft,
  type AboutPageAdminData,
  type AboutPageRevisionSummary,
} from "./actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CanvasStage from "./components/CanvasStage";
import InspectorPanel from "./components/InspectorPanel";
import {
  PreviewModal,
  RevisionsModal,
  SeoModal,
} from "./components/StudioModals";

const MAX_HISTORY = 50;

type NewElementKind =
  | "heading"
  | "paragraph"
  | "image"
  | "stat"
  | "callout"
  | "button"
  | "shape"
  | "divider"
  | "icon"
  | "video";

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function createNewElement(kind: NewElementKind, nextZ: number): CanvasElement {
  const id = makeId("el");
  switch (kind) {
    case "heading":
      return {
        id,
        name: "Heading",
        type: "text",
        zIndex: nextZ,
        desktop: { x: 120, y: 60, w: 520, h: 64 },
        mobile: { x: 20, y: 40, w: 350, h: 52 },
        props: {
          tag: "h2",
          fontFamily: "geist",
          textStyle: "plain",
          content: "New Section Heading",
          fontSize: 34,
          mobileFontSize: 26,
          fontWeight: "700",
          lineHeight: 1.2,
          textAlign: "left",
          color: "#111827",
        },
      };
    case "paragraph":
      return {
        id,
        name: "Paragraph",
        type: "text",
        zIndex: nextZ,
        desktop: { x: 120, y: 140, w: 560, h: 110 },
        mobile: { x: 20, y: 100, w: 350, h: 130 },
        props: {
          tag: "p",
          fontFamily: "geist",
          textStyle: "plain",
          content:
            "Double-click directly on this text box to edit it on the canvas, or pick from 10 font families in the right panel.",
          fontSize: 16,
          mobileFontSize: 15,
          fontWeight: "400",
          lineHeight: 1.7,
          textAlign: "left",
          color: "#374151",
        },
      };
    case "image":
      return {
        id,
        name: "Image",
        type: "image",
        zIndex: nextZ,
        desktop: { x: 160, y: 80, w: 460, h: 300 },
        mobile: { x: 20, y: 60, w: 350, h: 220 },
        props: {
          src: "",
          alt: "About Us visual",
          shape: "rounded",
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: 16,
          borderWidth: 0,
          borderColor: "#FFFFFF",
          backgroundColor: "transparent",
          shadow: "md",
        },
      };
    case "stat":
      return {
        id,
        name: "Stat Card",
        type: "stat",
        zIndex: nextZ,
        desktop: { x: 140, y: 100, w: 300, h: 120 },
        mobile: { x: 20, y: 80, w: 350, h: 116 },
        props: {
          value: "20+",
          label: "integrated HRMS modules",
          valueColor: "#008080",
          labelColor: "#4B5563",
          backgroundColor: "#FFFFFF",
          borderColor: "#E5EDF5",
          borderRadius: 16,
          textAlign: "left",
          shadow: "sm",
        },
      };
    case "callout":
      return {
        id,
        name: "Award / Pillar Box",
        type: "callout",
        zIndex: nextZ,
        desktop: { x: 140, y: 100, w: 560, h: 140 },
        mobile: { x: 20, y: 80, w: 350, h: 170 },
        props: {
          icon: "Award",
          title: "Highlight Title",
          text: "Share a milestone, award, or modular HRMS capability here.",
          accentColor: "#008080",
          backgroundColor: "rgba(0, 128, 128, 0.06)",
          borderColor: "rgba(0, 128, 128, 0.22)",
          textColor: "#111827",
          borderRadius: 16,
        },
      };
    case "button":
      return {
        id,
        name: "CTA Button",
        type: "button",
        zIndex: nextZ,
        desktop: { x: 160, y: 120, w: 204, h: 48 },
        mobile: { x: 93, y: 100, w: 204, h: 48 },
        props: {
          label: "Contact Us",
          href: "/company/contact-us",
          openInNewTab: false,
          variant: "solid",
          hoverEffect: "lift",
          showArrow: true,
          shadow: "md",
          backgroundColor: "#008080",
          textColor: "#FFFFFF",
          borderColor: "#008080",
          borderRadius: 999,
          fontSize: 15,
        },
      };
    case "shape":
      return {
        id,
        name: "Box / Shape",
        type: "shape",
        zIndex: Math.max(1, nextZ - 1),
        desktop: { x: 140, y: 90, w: 360, h: 200 },
        mobile: { x: 20, y: 80, w: 350, h: 160 },
        props: {
          shapeKind: "rectangle",
          backgroundColor: "#FFFFFF",
          borderColor: "#CBD5E1",
          borderWidth: 1,
          borderRadius: 20,
          backdropBlur: false,
          shadow: "sm",
        },
      };
    case "divider":
      return {
        id,
        name: "Divider Line",
        type: "shape",
        zIndex: nextZ,
        desktop: { x: 70, y: 120, w: 1060, h: 24 },
        mobile: { x: 20, y: 100, w: 350, h: 24 },
        props: {
          shapeKind: "divider",
          backgroundColor: "#CBD5E1",
          borderColor: "#CBD5E1",
          borderWidth: 2,
          borderRadius: 4,
          shadow: "none",
        },
      };
    case "icon":
      return {
        id,
        name: "Icon Badge",
        type: "icon",
        zIndex: nextZ,
        desktop: { x: 180, y: 100, w: 56, h: 56 },
        mobile: { x: 20, y: 80, w: 52, h: 52 },
        props: {
          icon: "Sparkles",
          iconSize: 26,
          strokeWidth: 2,
          color: "#008080",
          containerShape: "circle",
          backgroundColor: "rgba(0,128,128,0.1)",
          borderColor: "transparent",
          borderWidth: 0,
          shadow: "none",
        },
      };
    case "video":
      return {
        id,
        name: "YouTube Video",
        type: "video",
        zIndex: nextZ,
        desktop: { x: 240, y: 80, w: 640, h: 360 },
        mobile: { x: 20, y: 60, w: 350, h: 200 },
        props: {
          url: "",
          borderRadius: 16,
          shadow: "lg",
        },
      };
  }
}

export default function AboutUsStudio({
  initialData,
  tokenCtx,
  publicSettings,
  publicNavItems,
}: {
  initialData: AboutPageAdminData;
  tokenCtx: DynamicTokenContext;
  publicSettings: PublicSettings;
  publicNavItems: PublicNavItem[];
}) {
  const [doc, setDoc] = useState<FreeformDocument>(initialData.draftDoc);
  const [seo, setSeo] = useState<PageSeoMetadata>(initialData.draftSeo);
  const [revisions, setRevisions] = useState<AboutPageRevisionSummary[]>(
    initialData.revisions
  );
  const [hasUnpublished, setHasUnpublished] = useState(
    initialData.hasUnpublishedChanges
  );
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isPublishing, setIsPublishing] = useState(false);

  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [zoom, setZoom] = useState(0.75);
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [leftTab, setLeftTab] = useState<"elements" | "layers">("elements");

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialData.draftDoc.sections[0]?.id ?? null
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isWorkingModal, setIsWorkingModal] = useState(false);

  const historyRef = useRef<FreeformDocument[]>([
    structuredClone(initialData.draftDoc),
  ]);
  const historyIndexRef = useRef(0);
  const [, setHistoryTick] = useState(0);

  const docRef = useRef(doc);
  const seoRef = useRef(seo);
  docRef.current = doc;
  seoRef.current = seo;

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMountRef = useRef(true);

  const pushHistory = useCallback((snapshot: FreeformDocument) => {
    const sliced = historyRef.current.slice(0, historyIndexRef.current + 1);
    sliced.push(structuredClone(snapshot));
    if (sliced.length > MAX_HISTORY) sliced.shift();
    historyRef.current = sliced;
    historyIndexRef.current = sliced.length - 1;
    setHistoryTick((t) => t + 1);
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setDoc(structuredClone(historyRef.current[historyIndexRef.current]));
    setEditingElementId(null);
    setHistoryTick((t) => t + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setDoc(structuredClone(historyRef.current[historyIndexRef.current]));
    setEditingElementId(null);
    setHistoryTick((t) => t + 1);
  }, []);

  const handleSwitchBreakpoint = (next: Breakpoint) => {
    setBreakpoint(next);
    setEditingElementId(null);
    setZoom(next === "mobile" ? 1 : 0.75);
  };

  const flushDraftSave = useCallback(async (): Promise<boolean> => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSaveState("saving");
    const res = await saveAboutPageDraft(docRef.current, seoRef.current);
    if (res.success) {
      setSaveState("saved");
      setHasUnpublished(true);
      return true;
    }
    setSaveState("error");
    return false;
  }, []);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    setHasUnpublished(true);
    setSaveState("idle");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void flushDraftSave();
    }, 1500);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [doc, seo, flushDraftSave]);

  const selectedSection = useMemo(
    () =>
      doc.sections.find((s) => s.id === selectedSectionId) ??
      doc.sections[0] ??
      null,
    [doc.sections, selectedSectionId]
  );

  const selectedElement = useMemo(() => {
    if (!selectedElementId || !selectedSection) return null;
    return (
      selectedSection.elements.find((el) => el.id === selectedElementId) ?? null
    );
  }, [selectedSection, selectedElementId]);

  const commitCurrentDoc = useCallback(() => {
    pushHistory(docRef.current);
  }, [pushHistory]);

  const mutateDoc = useCallback(
    (
      updater: (prev: FreeformDocument) => FreeformDocument,
      recordHistory = true
    ) => {
      setDoc((prev) => {
        const next = updater(prev);
        if (recordHistory) pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const handleUpdateElementFrame = useCallback(
    (
      sectionId: string,
      elementId: string,
      frame: ElementFrame,
      recordHistory = false
    ) => {
      mutateDoc(
        (prev) => ({
          ...prev,
          sections: prev.sections.map((sec) =>
            sec.id !== sectionId
              ? sec
              : {
                  ...sec,
                  elements: sec.elements.map((el) =>
                    el.id !== elementId
                      ? el
                      : { ...el, [breakpoint]: frame }
                  ),
                }
          ),
        }),
        recordHistory
      );
    },
    [breakpoint, mutateDoc]
  );

  const handleUpdateElement = useCallback(
    (
      sectionId: string,
      elementId: string,
      updater: (el: CanvasElement) => CanvasElement
    ) => {
      mutateDoc(
        (prev) => ({
          ...prev,
          sections: prev.sections.map((sec) =>
            sec.id !== sectionId
              ? sec
              : {
                  ...sec,
                  elements: sec.elements.map((el) =>
                    el.id === elementId ? updater(el) : el
                  ),
                }
          ),
        }),
        true
      );
    },
    [mutateDoc]
  );

  const handleAddElement = (kind: NewElementKind) => {
    const targetSec = selectedSection ?? doc.sections[0];
    if (!targetSec) {
      toast.error("Add a section first.");
      return;
    }
    const maxZ = targetSec.elements.reduce((m, e) => Math.max(m, e.zIndex), 1);
    const el = createNewElement(kind, maxZ + 1);
    mutateDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === targetSec.id
          ? { ...sec, elements: [...sec.elements, el] }
          : sec
      ),
    }));
    setSelectedSectionId(targetSec.id);
    setSelectedElementId(el.id);
    toast.success(`Added ${el.name} to "${targetSec.name}"`);
  };

  const handleDuplicateElement = useCallback(
    (sectionId: string, elementId: string) => {
      let clonedId: string | null = null;
      mutateDoc((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const src = sec.elements.find((e) => e.id === elementId);
          if (!src) return sec;
          const maxZ = sec.elements.reduce((m, e) => Math.max(m, e.zIndex), 1);
          const copy: CanvasElement = {
            ...structuredClone(src),
            id: makeId("el"),
            name: `${src.name} Copy`,
            zIndex: maxZ + 1,
            locked: false,
            desktop: {
              ...src.desktop,
              x: src.desktop.x + 24,
              y: src.desktop.y + 24,
            },
            mobile: {
              ...src.mobile,
              x: Math.min(20, src.mobile.x),
              y: src.mobile.y + 24,
            },
          };
          clonedId = copy.id;
          return { ...sec, elements: [...sec.elements, copy] };
        }),
      }));
      if (clonedId) setSelectedElementId(clonedId);
    },
    [mutateDoc]
  );

  const handleDeleteElement = useCallback(
    (sectionId: string, elementId: string) => {
      mutateDoc((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                elements: sec.elements.filter((el) => el.id !== elementId),
              }
            : sec
        ),
      }));
      if (selectedElementId === elementId) setSelectedElementId(null);
      if (editingElementId === elementId) setEditingElementId(null);
    },
    [mutateDoc, selectedElementId, editingElementId]
  );

  const handleMoveElementLayer = useCallback(
    (
      sectionId: string,
      elementId: string,
      dir: "forward" | "backward" | "front" | "back"
    ) => {
      mutateDoc((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const sorted = [...sec.elements].sort((a, b) => a.zIndex - b.zIndex);
          const idx = sorted.findIndex((e) => e.id === elementId);
          if (idx === -1) return sec;

          const [item] = sorted.splice(idx, 1);
          if (dir === "front") sorted.push(item);
          else if (dir === "back") sorted.unshift(item);
          else if (dir === "forward")
            sorted.splice(Math.min(sorted.length, idx + 1), 0, item);
          else sorted.splice(Math.max(0, idx - 1), 0, item);

          const zMap = new Map(sorted.map((e, i) => [e.id, i + 1]));
          return {
            ...sec,
            elements: sec.elements.map((e) => ({
              ...e,
              zIndex: zMap.get(e.id) ?? e.zIndex,
            })),
          };
        }),
      }));
    },
    [mutateDoc]
  );

  const handleAddSection = (preset: "blank" | "teal-hero") => {
    const newSec: FreeformSection = {
      id: makeId("sec"),
      name:
        preset === "teal-hero"
          ? `Teal Band ${doc.sections.length + 1}`
          : `Section ${doc.sections.length + 1}`,
      backgroundType: preset === "teal-hero" ? "gradient" : "solid",
      backgroundColor: preset === "teal-hero" ? "#008080" : "#FFFFFF",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: preset === "teal-hero",
      desktopHeight: 380,
      mobileHeight: 360,
      elements: [],
    };
    mutateDoc((prev) => ({ ...prev, sections: [...prev.sections, newSec] }));
    setSelectedSectionId(newSec.id);
    setSelectedElementId(null);
    toast.success(`Added "${newSec.name}"`);
  };

  const handleReorderSection = (sectionId: string, dir: -1 | 1) => {
    mutateDoc((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === sectionId);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= prev.sections.length) {
        return prev;
      }
      const next = [...prev.sections];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return { ...prev, sections: next };
    });
  };

  const handleDuplicateSection = (sectionId: string) => {
    const src = doc.sections.find((s) => s.id === sectionId);
    if (!src) return;
    const copy: FreeformSection = {
      ...structuredClone(src),
      id: makeId("sec"),
      name: `${src.name} Copy`,
      elements: src.elements.map((el) => ({ ...el, id: makeId("el") })),
    };
    mutateDoc((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === sectionId);
      const next = [...prev.sections];
      next.splice(idx + 1, 0, copy);
      return { ...prev, sections: next };
    });
    setSelectedSectionId(copy.id);
    setSelectedElementId(null);
  };

  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      const current = docRef.current.sections;
      if (current.length <= 1) {
        toast.error("At least one section is required.");
        return;
      }
      const idx = current.findIndex((s) => s.id === sectionId);
      if (idx === -1) return;
      const name = current[idx].name;
      const fallback = current[idx - 1] ?? current[idx + 1];

      mutateDoc((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));

      if (selectedSectionId === sectionId) {
        setSelectedSectionId(fallback?.id ?? null);
        setSelectedElementId(null);
        setEditingElementId(null);
      }
      toast.success(`Deleted "${name}" (Ctrl+Z to undo)`);
    },
    [mutateDoc, selectedSectionId]
  );

  const handleAutoFitMobile = () => {
    mutateDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => autoLayoutSectionMobile(sec)),
    }));
    toast.success("Mobile canvas auto-arranged from Desktop layout.");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        editingElementId !== null ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (isTyping) return;
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        if (isTyping) return;
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isTyping || !selectedSection || !selectedElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateElement(selectedSection.id, selectedElement.id);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selectedElement.locked) {
          e.preventDefault();
          handleDeleteElement(selectedSection.id, selectedElement.id);
        }
        return;
      }
      if (
        !selectedElement.locked &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const f = selectedElement[breakpoint];
        handleUpdateElementFrame(
          selectedSection.id,
          selectedElement.id,
          {
            ...f,
            x:
              e.key === "ArrowLeft"
                ? f.x - step
                : e.key === "ArrowRight"
                  ? f.x + step
                  : f.x,
            y:
              e.key === "ArrowUp"
                ? f.y - step
                : e.key === "ArrowDown"
                  ? f.y + step
                  : f.y,
          },
          true
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    editingElementId,
    selectedSection,
    selectedElement,
    breakpoint,
    handleUndo,
    handleRedo,
    handleDuplicateElement,
    handleDeleteElement,
    handleUpdateElementFrame,
  ]);

  const handlePublish = async () => {
    if (isPublishing) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setIsPublishing(true);
    try {
      const res = await publishAboutPage(docRef.current, seoRef.current);
      if (!res.success) {
        toast.error(res.message || "Failed to publish.");
        return;
      }
      setHasUnpublished(false);
      setSaveState("saved");
      if (res.revisions) setRevisions(res.revisions);
      toast.success(res.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRestoreRevision = async (revisionId: string) => {
    setIsWorkingModal(true);
    try {
      const res = await restoreAboutRevisionToDraft(revisionId);
      if (!res.success || !res.doc) {
        toast.error(res.message);
        return;
      }
      setDoc(res.doc);
      if (res.seo) setSeo(res.seo);
      pushHistory(res.doc);
      setSelectedSectionId(res.doc.sections[0]?.id ?? null);
      setSelectedElementId(null);
      setHasUnpublished(true);
      setShowRevisions(false);
      toast.success(res.message);
    } finally {
      setIsWorkingModal(false);
    }
  };

  const handleResetDefault = async () => {
    setIsWorkingModal(true);
    try {
      const res = await resetAboutDraftToDefault();
      if (!res.success || !res.doc) {
        toast.error(res.message);
        return;
      }
      setDoc(res.doc);
      if (res.seo) setSeo(res.seo);
      pushHistory(res.doc);
      setSelectedSectionId(res.doc.sections[0]?.id ?? null);
      setSelectedElementId(null);
      setHasUnpublished(true);
      setShowResetConfirm(false);
      toast.success(res.message);
    } finally {
      setIsWorkingModal(false);
    }
  };

  return (
    <SettingsProvider value={publicSettings}>
      <NavProvider value={publicNavItems}>
        <div className="-m-4 md:-m-6 h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
          {/* TOP STUDIO BAR */}
          <header className="h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                About Us Studio
              </span>
              <a
                href="/company/about-us"
                target="_blank"
                rel="noopener noreferrer"
                title="Open live About Us page"
                className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink size={14} />
              </a>
              <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap">
                {saveState === "saving" ? (
                  <span className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </span>
                ) : hasUnpublished ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Unpublished
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check size={13} /> Published
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleSwitchBreakpoint("desktop")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    breakpoint === "desktop"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Monitor size={13} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchBreakpoint("mobile")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    breakpoint === "mobile"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Smartphone size={13} /> Mobile
                </button>
              </div>

              {breakpoint === "mobile" && (
                <button
                  type="button"
                  onClick={handleAutoFitMobile}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 cursor-pointer"
                >
                  <Wand2 size={13} /> Auto-fit
                </button>
              )}

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer"
                >
                  <Undo2 size={15} />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-35 cursor-pointer"
                >
                  <Redo2 size={15} />
                </button>
              </div>

              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Canvas zoom"
                className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value={0.5}>50%</option>
                <option value={0.65}>65%</option>
                <option value={0.75}>75%</option>
                <option value={0.9}>90%</option>
                <option value={1}>100%</option>
              </select>

              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                title="Toggle 20px visual grid"
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  showGrid
                    ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Grid size={15} />
              </button>

              <button
                type="button"
                onClick={() => setSnapEnabled((v) => !v)}
                title="Toggle magnetic smart snap guides"
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  snapEnabled
                    ? "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/30 dark:border-pink-800"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Magnet size={15} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSeo(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Search size={13} /> SEO
              </button>
              <button
                type="button"
                onClick={() => setShowRevisions(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <History size={13} /> History
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                title="Load new default About Us template into draft"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white cursor-pointer"
              >
                <Eye size={14} /> Preview
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-[#008080] hover:bg-[#006b6b] text-white shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Rocket size={14} />
                )}
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </header>

          {/* 3-PANE WORKSPACE */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* LEFT PANEL (Wider w-72 for full Layer controls) */}
            <aside className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
              <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 p-1.5 gap-1">
                <button
                  type="button"
                  onClick={() => setLeftTab("elements")}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    leftTab === "elements"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Plus size={14} /> Add
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab("layers")}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    leftTab === "layers"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Layers size={14} /> Layers
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {leftTab === "elements" ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Freeform Elements
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Click to drop into{" "}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {selectedSection?.name}
                        </strong>
                        .
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { kind: "heading", label: "Heading", icon: Heading },
                            { kind: "paragraph", label: "Text", icon: Type },
                            { kind: "image", label: "Image", icon: ImageIcon },
                            { kind: "icon", label: "Icon", icon: Star },
                            { kind: "stat", label: "Stat Card", icon: BarChart3 },
                            { kind: "callout", label: "Award Box", icon: Award },
                            {
                              kind: "button",
                              label: "Button",
                              icon: MousePointerClick,
                            },
                            { kind: "shape", label: "Box / Shape", icon: Square },
                            { kind: "divider", label: "Divider", icon: Minus },
                            { kind: "video", label: "YouTube", icon: Youtube },
                          ] as const
                        ).map(({ kind, label, icon: Icon }) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => handleAddElement(kind)}
                            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Icon size={18} className="text-[#008080]" />
                            <span className="text-[11px] font-semibold">
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Add Full-Width Section
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddSection("blank")}
                        className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Blank White Section
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSection("teal-hero")}
                        className="w-full py-2 px-3 rounded-lg border border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 text-xs font-semibold text-teal-700 dark:text-teal-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={14} /> Brand Teal Gradient Band
                      </button>
                    </div>
                  </>
                ) : (
                  /* UPGRADED LAYERS TREE WITH FULL REORDER, TOP/BOTTOM & DELETE */
                  <div className="space-y-3">
                    {doc.sections.map((sec, sIdx) => {
                      const isSecActive = selectedSectionId === sec.id;
                      const sortedEls = [...sec.elements].sort(
                        (a, b) => b.zIndex - a.zIndex
                      );

                      return (
                        <div
                          key={sec.id}
                          className={`rounded-xl border overflow-hidden ${
                            isSecActive
                              ? "border-blue-400 dark:border-blue-600"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {/* Section Header with Reorder, Duplicate & Delete */}
                          <div
                            onClick={() => {
                              setSelectedSectionId(sec.id);
                              setSelectedElementId(null);
                            }}
                            className={`px-2.5 py-2 flex items-center justify-between gap-1 cursor-pointer ${
                              isSecActive
                                ? "bg-blue-50/90 dark:bg-blue-950/50"
                                : "bg-slate-50 dark:bg-slate-800/70"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {sec.name}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={sIdx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReorderSection(sec.id, -1);
                                }}
                                title="Move section up"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={sIdx === doc.sections.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReorderSection(sec.id, 1);
                                }}
                                title="Move section down"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateSection(sec.id);
                                }}
                                title="Duplicate section"
                                className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={doc.sections.length <= 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSection(sec.id);
                                }}
                                title={
                                  doc.sections.length <= 1
                                    ? "At least one section is required"
                                    : "Delete section"
                                }
                                className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Layer Rows with Full Z-Order, Hide, Lock, Duplicate & Delete */}
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedEls.length === 0 ? (
                              <p className="px-3 py-2 text-[11px] italic text-slate-400">
                                Empty section
                              </p>
                            ) : (
                              sortedEls.map((el, eIdx) => {
                                const frame = el[breakpoint];
                                const isElActive = selectedElementId === el.id;
                                const isTop = eIdx === 0;
                                const isBottom = eIdx === sortedEls.length - 1;

                                return (
                                  <div
                                    key={el.id}
                                    onClick={() => {
                                      setSelectedSectionId(sec.id);
                                      setSelectedElementId(el.id);
                                    }}
                                    className={`px-2.5 py-2 space-y-1.5 text-xs cursor-pointer transition-colors ${
                                      isElActive
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span
                                        className={`truncate font-medium ${
                                          frame.hidden
                                            ? "opacity-50 line-through"
                                            : ""
                                        }`}
                                      >
                                        {el.name}
                                      </span>

                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateElement(
                                              sec.id,
                                              el.id,
                                              (item) => ({
                                                ...item,
                                                locked: !item.locked,
                                              })
                                            );
                                          }}
                                          title={el.locked ? "Unlock" : "Lock"}
                                          className="p-1 rounded hover:bg-black/10 cursor-pointer"
                                        >
                                          {el.locked ? (
                                            <Lock
                                              size={12}
                                              className={
                                                isElActive
                                                  ? "text-amber-200"
                                                  : "text-amber-500"
                                              }
                                            />
                                          ) : (
                                            <Unlock
                                              size={12}
                                              className="opacity-55"
                                            />
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateElementFrame(
                                              sec.id,
                                              el.id,
                                              { ...frame, hidden: !frame.hidden },
                                              true
                                            );
                                          }}
                                          title={
                                            frame.hidden
                                              ? `Show on ${breakpoint}`
                                              : `Hide on ${breakpoint}`
                                          }
                                          className="p-1 rounded hover:bg-black/10 cursor-pointer"
                                        >
                                          {frame.hidden ? (
                                            <EyeOff size={12} />
                                          ) : (
                                            <Eye size={12} />
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElement(sec.id, el.id);
                                          }}
                                          title="Delete element"
                                          className={`p-1 rounded cursor-pointer ${
                                            isElActive
                                              ? "hover:bg-red-500 text-red-100"
                                              : "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                                          }`}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Z-Index & Duplicate Controls on Selected Layer */}
                                    {isElActive && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center justify-between pt-1 border-t border-white/15 text-[10px]"
                                      >
                                        <div className="flex items-center gap-0.5">
                                          <button
                                            type="button"
                                            disabled={isTop}
                                            onClick={() =>
                                              handleMoveElementLayer(
                                                sec.id,
                                                el.id,
                                                "front"
                                              )
                                            }
                                            title="Bring to Top"
                                            className="p-1 rounded hover:bg-white/15 disabled:opacity-35 cursor-pointer"
                                          >
                                            <ArrowUpToLine size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isTop}
                                            onClick={() =>
                                              handleMoveElementLayer(
                                                sec.id,
                                                el.id,
                                                "forward"
                                              )
                                            }
                                            title="Bring Forward"
                                            className="p-1 rounded hover:bg-white/15 disabled:opacity-35 cursor-pointer"
                                          >
                                            <ArrowUp size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isBottom}
                                            onClick={() =>
                                              handleMoveElementLayer(
                                                sec.id,
                                                el.id,
                                                "backward"
                                              )
                                            }
                                            title="Send Backward"
                                            className="p-1 rounded hover:bg-white/15 disabled:opacity-35 cursor-pointer"
                                          >
                                            <ArrowDown size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isBottom}
                                            onClick={() =>
                                              handleMoveElementLayer(
                                                sec.id,
                                                el.id,
                                                "back"
                                              )
                                            }
                                            title="Send to Bottom"
                                            className="p-1 rounded hover:bg-white/15 disabled:opacity-35 cursor-pointer"
                                          >
                                            <ArrowDownToLine size={12} />
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDuplicateElement(sec.id, el.id)
                                          }
                                          title="Duplicate element"
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 cursor-pointer"
                                        >
                                          <Copy size={11} /> Copy
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            {/* CENTER CANVAS WITH REAL LIVE FOOTER */}
            <CanvasStage
              doc={doc}
              breakpoint={breakpoint}
              zoom={zoom}
              showGrid={showGrid}
              snapEnabled={snapEnabled}
              tokenCtx={tokenCtx}
              selectedSectionId={selectedSection?.id ?? null}
              selectedElementId={selectedElementId}
              editingElementId={editingElementId}
              onSelectSection={(secId) => {
                setSelectedSectionId(secId);
                setSelectedElementId(null);
              }}
              onSelectElement={(secId, elId) => {
                setSelectedSectionId(secId);
                setSelectedElementId(elId);
              }}
              onStartEditingText={(elId) => setEditingElementId(elId)}
              onStopEditingText={() => setEditingElementId(null)}
              onUpdateElementFrame={(secId, elId, frame) =>
                handleUpdateElementFrame(secId, elId, frame, false)
              }
              onCommitInteraction={commitCurrentDoc}
              onUpdateElementText={(secId, elId, nextContent) =>
                mutateDoc(
                  (prev) => ({
                    ...prev,
                    sections: prev.sections.map((s) =>
                      s.id !== secId
                        ? s
                        : {
                            ...s,
                            elements: s.elements.map((e) =>
                              e.id === elId && e.type === "text"
                                ? {
                                    ...e,
                                    props: { ...e.props, content: nextContent },
                                  }
                                : e
                            ),
                          }
                    ),
                  }),
                  false
                )
              }
              onResizeSectionHeight={(secId, nextH) =>
                mutateDoc(
                  (prev) => ({
                    ...prev,
                    sections: prev.sections.map((s) =>
                      s.id !== secId
                        ? s
                        : breakpoint === "desktop"
                          ? { ...s, desktopHeight: nextH }
                          : { ...s, mobileHeight: nextH }
                    ),
                  }),
                  false
                )
              }
              onReorderSection={handleReorderSection}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
              onDuplicateElement={handleDuplicateElement}
              onDeleteElement={handleDeleteElement}
              onMoveElementLayer={handleMoveElementLayer}
              onToggleLockElement={(secId, elId) =>
                handleUpdateElement(secId, elId, (el) => ({
                  ...el,
                  locked: !el.locked,
                }))
              }
            />

            {/* RIGHT INSPECTOR PANEL */}
            <InspectorPanel
              breakpoint={breakpoint}
              sectionsCount={doc.sections.length}
              selectedSection={selectedSection}
              selectedElement={selectedElement}
              pageBgColor={doc.pageBgColor}
              onUpdatePageBgColor={(pageBgColor) =>
                mutateDoc((prev) => ({ ...prev, pageBgColor }))
              }
              onUpdateSection={(sectionId, patch) =>
                mutateDoc((prev) => ({
                  ...prev,
                  sections: prev.sections.map((s) =>
                    s.id === sectionId ? { ...s, ...patch } : s
                  ),
                }))
              }
              onDeleteSection={handleDeleteSection}
              onDuplicateSection={handleDuplicateSection}
              onUpdateElement={handleUpdateElement}
              onUpdateElementFrame={(secId, elId, frame) =>
                handleUpdateElementFrame(secId, elId, frame, true)
              }
              onMoveElementLayer={handleMoveElementLayer}
              onDuplicateElement={handleDuplicateElement}
              onDeleteElement={handleDeleteElement}
            />
          </div>

          {/* MODALS */}
          <PreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            doc={doc}
            tokenCtx={tokenCtx}
          />

          <SeoModal
            isOpen={showSeo}
            onClose={() => setShowSeo(false)}
            seo={seo}
            onChange={setSeo}
          />

          <RevisionsModal
            isOpen={showRevisions}
            onClose={() => setShowRevisions(false)}
            revisions={revisions}
            isRestoring={isWorkingModal}
            onRestore={handleRestoreRevision}
          />

          <ConfirmModal
            isOpen={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleResetDefault}
            title="Load redesigned About Us default template?"
            message="This replaces your current draft with the 5-section modular HRMS About Us template. Your live website will not change until you click Publish, and previous published versions remain saved in History."
            confirmLabel="Load Template into Draft"
            variant="danger"
            isBusy={isWorkingModal}
          />
        </div>
      </NavProvider>
    </SettingsProvider>
  );
}
