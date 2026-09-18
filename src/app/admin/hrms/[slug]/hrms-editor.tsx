"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteStorageObjectByUrl } from "@/lib/storage-upload";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import BannerImageEditor from "@/components/admin/BannerImageEditor";
import { CARD_RATIOS, SECTION_RATIOS } from "@/lib/image-ratios";
import {
  HRMS_ICON_NAMES,
  resolveHrmsIcon,
} from "@/lib/hrms-icons";
import { Field } from "../../settings/SettingsField";
import {
  saveHrmsModule,
  type HrmsFeatureInput,
  type HrmsModuleInput,
} from "../actions";
import type { Database } from "@/types/supabase";

type HrmsModule = Database["public"]["Tables"]["hrms_modules"]["Row"];
type HrmsFeature = Database["public"]["Tables"]["hrms_features"]["Row"];

const LAYOUTS = ["center", "left-media", "right-media", "full-width"];
const LAYOUT_LABELS: Record<string, string> = {
  center: "Center — text centered",
  "left-media": "Left media — image left, text right",
  "right-media": "Right media — image right, text left",
  "full-width": "Full width — text centered",
};
const MEDIA_TYPES = ["none", "image", "video"];
// Tailwind-safe: these classes already exist in the codebase, so the
// JIT compiler generates them. Do NOT add new ones here.
const BG_COLORS = ["bg-white", "bg-slate-50", "bg-blue-50", "bg-gray-50"];
// Hero-only extras (mapped to real classes in ModulePageLayout).
const HERO_BG_OPTIONS = [
  ...BG_COLORS.map((b) => ({ value: b, label: b })),
  { value: "bg-slate-100", label: "bg-slate-100" },
  { value: "gradient-blue", label: "gradient-blue (blue fade)" },
];

/** Live preview of the typed lucide icon name (falls back to grid). */
function NavIconPreview({ name }: { name: string }) {
  const Icon = resolveHrmsIcon(name);
  return <Icon size={18} />;
}

const emptyFeature = (): HrmsFeatureInput => ({
  title: "",
  description: "",
  layout: "center",
  media_type: "none",
  media_src: "",
  media_alt: "",
  bg_color: "bg-white",
});

export default function HrmsEditor({
  initialModule,
  initialFeatures,
}: {
  initialModule: HrmsModule;
  initialFeatures: HrmsFeature[];
}) {
  const router = useRouter();
  const [module, setModule] = useState<HrmsModuleInput>({
    slug: initialModule.slug,
    name: initialModule.name,
    tagline: initialModule.tagline,
    image_src: initialModule.image_src,
    card_image_src: (initialModule as { card_image_src?: string }).card_image_src ?? "",
    // ?? guards pre-migration rows where the column doesn't exist yet.
    image_ratio: initialModule.image_ratio ?? "4:1",
    hero_bg: initialModule.hero_bg ?? "bg-white",
    nav_description: initialModule.nav_description ?? "",
    icon_name: initialModule.icon_name ?? "",
    outro_text: initialModule.outro_text || "",
    status: initialModule.status,
  });
  const [features, setFeatures] = useState<HrmsFeatureInput[]>(
    initialFeatures.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      layout: f.layout,
      media_type: f.media_type,
      media_src: f.media_src,
      media_alt: f.media_alt,
      bg_color: f.bg_color,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  // Last image URL confirmed saved in the DB. Replaced storage files are
  // deleted only after a successful save (never on field change), so leaving
  // the page without saving can't orphan the live image.
  const lastSavedImageRef = useRef(initialModule.image_src);

  const set = (key: keyof HrmsModuleInput, value: string) =>
    setModule((prev) => ({ ...prev, [key]: value }));

  const setFeature = (index: number, key: keyof HrmsFeatureInput, value: string) =>
    setFeatures((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );

  const moveFeature = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= features.length) return;
    setFeatures((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveHrmsModule(initialModule.slug, module, features);
    if (result.success) {
      toast.success("Module saved.");
      if (lastSavedImageRef.current !== module.image_src) {
        void deleteStorageObjectByUrl(lastSavedImageRef.current);
        lastSavedImageRef.current = module.image_src;
      }
      if (result.slug && result.slug !== initialModule.slug) {
        router.push(`/admin/hrms/${result.slug}`);
      }
      router.refresh();
    } else {
      toast.error(result.message || "Failed to save.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {initialModule.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Public URL:{" "}
            <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              /hrms/{module.slug}
            </code>
            {module.status === "draft" && " (draft — returns 404 publicly)"}
          </p>
        </div>
        <div className="flex gap-2">
          {module.status === "published" && (
            <a
              href={`/hrms/${module.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink size={16} /> View live
            </a>
          )}
          <Button variant="primary" onClick={handleSave} loading={isSaving}>
            Save changes
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          Page settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Display name"
            value={module.name}
            onChange={(v) => set("name", v)}
          />
          <Field
            label="Slug (URL)"
            value={module.slug}
            onChange={(v) => set("slug", v)}
            hint="Lowercase letters, numbers, hyphens. Renaming keeps sections (cascade)."
          />
        </div>
        <Field
          label="Hero subtitle (tagline)"
          textarea
          rows={2}
          value={module.tagline}
          onChange={(v) => set("tagline", v)}
          hint="Shown under the title and used as the page meta description."
        />
        <Field
          label="Hero background"
          select
          value={module.hero_bg}
          onChange={(v) => set("hero_bg", v)}
          options={HERO_BG_OPTIONS}
          hint="Background of the top hero band (title, subtitle, banner)."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Navbar description (short)"
            textarea
            rows={2}
            value={module.nav_description}
            onChange={(v) => set("nav_description", v)}
            placeholder="e.g. Manage apps, roles and access in one place"
            hint="1–2 lines under the name in the HRMS menu. Empty = tagline, truncated."
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Navbar icon (lucide name)
            </label>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 shrink-0">
                <NavIconPreview name={module.icon_name} />
              </span>
              <input
                type="text"
                value={module.icon_name}
                onChange={(e) => set("icon_name", e.target.value)}
                placeholder="e.g. Sparkles"
                list="hrms-icon-names"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              />
            </div>
            <datalist id="hrms-icon-names">
              {HRMS_ICON_NAMES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500">
              Type a Lucide name as used in this project — suggestions appear
              as you type. Unknown names fall back to a grid icon.
            </p>
          </div>
        </div>
        <BannerImageEditor
          label="Hero banner image (optional)"
          value={module.image_src}
          onChange={(url) => set("image_src", url)}
          ratio={module.image_ratio}
          onRatioChange={(r) => set("image_ratio", r)}
          hint="Shown at the top of this page. Leave empty to show no hero image. Pick a ratio, upload, drag to reposition, zoom, then Save banner."
        />
        <BannerImageEditor
          label="Card thumbnail image (optional)"
          value={module.card_image_src}
          onChange={(url) => set("card_image_src", url)}
          ratios={CARD_RATIOS}
          resolutionHint="Recommended: min 800×600, 4:3 aspect ratio for best results on desktop, tablet and mobile."
          hint="Used in the 'Related Modules' cards on other pages. Falls back to hero banner image if empty."
        />
        <Field
          label="Closing paragraph (optional)"
          textarea
          rows={3}
          value={module.outro_text}
          onChange={(v) => set("outro_text", v)}
          hint="Rendered as the final shaded block. Leave empty to omit."
        />
        <Field
          label="Status"
          select
          value={module.status}
          onChange={(v) => set("status", v)}
          options={[
            { value: "draft", label: "Draft (hidden, 404)" },
            { value: "published", label: "Published" },
          ]}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Content sections ({features.length})
          </h3>
          <Button onClick={() => setFeatures((prev) => [...prev, emptyFeature()])}>
            <Plus size={16} /> Add section
          </Button>
        </div>

        {features.map((f, i) => (
          <div
            key={f.id || `new-${i}`}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                Section {i + 1}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveFeature(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveFeature(i, 1)}
                  disabled={i === features.length - 1}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() =>
                    setFeatures((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Delete section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <Field
              label="Heading"
              value={f.title}
              onChange={(v) => setFeature(i, "title", v)}
            />
            <Field
              label="Text"
              textarea
              rows={4}
              value={f.description}
              onChange={(v) => setFeature(i, "description", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Layout"
                select
                value={f.layout}
                onChange={(v) => setFeature(i, "layout", v)}
                options={LAYOUTS.map((l) => ({
                  value: l,
                  label: LAYOUT_LABELS[l] || l,
                }))}
                hint="Side layouts need Media set to image/video. With Media = none, left aligns the text block left and right aligns it right."
              />
              <Field
                label="Background"
                select
                value={f.bg_color}
                onChange={(v) => setFeature(i, "bg_color", v)}
                options={BG_COLORS.map((b) => ({ value: b, label: b }))}
              />
              <Field
                label="Media"
                select
                value={f.media_type}
                onChange={(v) => setFeature(i, "media_type", v)}
                options={MEDIA_TYPES.map((m) => ({ value: m, label: m }))}
              />
            </div>
            {f.media_type === "image" && (
              <BannerImageEditor
                label="Section image"
                value={f.media_src}
                onChange={(v) => setFeature(i, "media_src", v)}
                ratios={SECTION_RATIOS}
                defaultRatio="4:3"
                hint="Choose a ratio that suits the layout. Upload, drag to reposition, zoom, rotate, then Save banner."
              />
            )}
            {f.media_type !== "none" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label={
                    f.media_type === "video"
                      ? "Video URL (MP4 file or YouTube / Vimeo link)"
                      : "Image URL (direct link — overrides the cropper above)"
                  }
                  value={f.media_src}
                  onChange={(v) => setFeature(i, "media_src", v)}
                  placeholder={
                    f.media_type === "video"
                      ? "https://www.youtube.com/watch?v=… or /videos/demo.mp4"
                      : "https://… or /images/….jpg"
                  }
                  hint={
                    f.media_type === "video"
                      ? "YouTube and Vimeo links play as embedded players; direct MP4/WebM files play natively."
                      : "Used as-is (no crop). Useful for GIFs and hotlinked images."
                  }
                />
                <Field
                  label={f.media_type === "video" ? "Poster image URL" : "Alt text"}
                  value={f.media_alt}
                  onChange={(v) => setFeature(i, "media_alt", v)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} loading={isSaving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
