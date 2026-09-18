// src/lib/image-ratios.ts
//
// Shared ratio presets for the admin image cropper.
// Single source of truth for the admin cropper and the public hero frame
// so the saved choice renders identically on both sides.

export type RatioOption = { value: string; label: string };

// Widest first: 4:1 is wider than 21:9 (4.0 > 2.33).
export const BANNER_RATIOS: RatioOption[] = [
  { value: "4:1", label: "4:1 Banner" },
  { value: "21:9", label: "21:9 Ultra-wide" },
  { value: "16:9", label: "16:9 Standard" },
  { value: "3:2", label: "3:2 Classic" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1 Square" },
];

/** Section image ratios (user-selected subset). */
export const SECTION_RATIOS: RatioOption[] = [
  { value: "4:3", label: "4:3 Landscape" },
  { value: "1:1", label: "1:1 Square" },
  { value: "3:2", label: "3:2 Landscape" },
  { value: "2:3", label: "2:3 Portrait" },
  { value: "3:4", label: "3:4 Portrait" },
];

/** Card thumbnail — single fixed ratio. */
export const CARD_RATIOS: RatioOption[] = [
  { value: "4:3", label: "4:3" },
];

export const DEFAULT_BANNER_RATIO = "4:1";

/**
 * Tab display-text override. Values (and everything downstream: export math,
 * DB CHECK, public frame) are intentionally untouched — only what the buttons
 * and notes show.
 */
export const RATIO_TAB_TEXT: Record<string, string> = {
  "4:1": "21:9",
  "21:9": "4:1",
};

/** Display text for a ratio value (falls back to the value itself). */
export function ratioTabText(value: string): string {
  return RATIO_TAB_TEXT[value] || value;
}

/** "16:9" → 1.777… Falls back to 4:1 for anything unparseable. */
export function parseRatio(value: string | null | undefined): number {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec((value || "").trim());
  if (!m) return 4;
  const h = parseFloat(m[2]);
  if (!(h > 0)) return 4;
  return parseFloat(m[1]) / h;
}

/** Export dimensions (long edge 1600px) for a ratio choice. */
export function exportSizeForRatio(value: string | null | undefined): {
  w: number;
  h: number;
} {
  const r = parseRatio(value);
  return { w: 1600, h: Math.round(1600 / r) };
}

