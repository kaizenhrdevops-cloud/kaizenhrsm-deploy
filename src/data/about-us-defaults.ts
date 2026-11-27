// src/data/about-us-defaults.ts

export const DESKTOP_STAGE_WIDTH = 1200;
export const MOBILE_STAGE_WIDTH = 390;

export type Breakpoint = "desktop" | "mobile";
export type ShadowPreset = "none" | "sm" | "md" | "lg" | "2xl";

export type StudioIconName =
  | "Award"
  | "Users"
  | "Building2"
  | "ShieldCheck"
  | "Sparkles"
  | "Layers"
  | "Briefcase"
  | "BarChart3"
  | "CheckCircle2"
  | "TrendingUp"
  | "Clock"
  | "Calendar"
  | "Calculator"
  | "Smartphone"
  | "Globe"
  | "Zap"
  | "Target"
  | "Compass"
  | "Heart"
  | "Star"
  | "Lightbulb"
  | "Cpu"
  | "Lock"
  | "Rocket";

export type TextTypographyShape =
  | "plain"
  | "pill-badge"
  | "eyebrow"
  | "gradient"
  | "left-accent"
  | "highlight"
  | "outline-tag";

export type ImageShapePreset =
  | "rectangle"
  | "rounded"
  | "circle"
  | "arch"
  | "blob"
  | "hexagon"
  | "chamfer";

export type ImageFitMode = "cover" | "contain" | "fill" | "scale-down" | "none";
export type ImagePositionPreset = "center" | "top" | "bottom" | "left" | "right";

export type ButtonHoverEffect = "lift" | "scale" | "glow" | "none";

export type FontFamilyKey =
  | "geist"
  | "inter"
  | "plus-jakarta"
  | "space-grotesk"
  | "nunito"
  | "playfair"
  | "merriweather"
  | "roboto-slab"
  | "dancing-script"
  | "geist-mono";

export const FONT_FAMILY_OPTIONS: {
  value: FontFamilyKey;
  label: string;
  category: string;
  cssValue: string;
}[] = [
  {
    value: "geist",
    label: "Geist",
    category: "Sans-Serif (Default)",
    cssValue: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  {
    value: "inter",
    label: "Inter",
    category: "Neo-Grotesque Sans",
    cssValue: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  {
    value: "plus-jakarta",
    label: "Plus Jakarta Sans",
    category: "Geometric Sans",
    cssValue: "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    category: "Display / Tech Sans",
    cssValue: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
  },
  {
    value: "nunito",
    label: "Nunito",
    category: "Rounded Sans",
    cssValue: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif",
  },
  {
    value: "playfair",
    label: "Playfair Display",
    category: "Editorial Serif",
    cssValue: "var(--font-playfair), ui-serif, Georgia, serif",
  },
  {
    value: "merriweather",
    label: "Merriweather",
    category: "Classic Serif",
    cssValue: "var(--font-merriweather), ui-serif, Georgia, serif",
  },
  {
    value: "roboto-slab",
    label: "Roboto Slab",
    category: "Slab Serif",
    cssValue: "var(--font-roboto-slab), ui-serif, Georgia, serif",
  },
  {
    value: "dancing-script",
    label: "Dancing Script",
    category: "Script / Handwriting",
    cssValue: "var(--font-dancing-script), cursive",
  },
  {
    value: "geist-mono",
    label: "Geist Mono",
    category: "Monospace",
    cssValue: "var(--font-geist-mono), ui-monospace, monospace",
  },
];

export function resolveFontFamilyCss(key?: FontFamilyKey): string {
  const found = FONT_FAMILY_OPTIONS.find((f) => f.value === key);
  return found ? found.cssValue : FONT_FAMILY_OPTIONS[0].cssValue;
}

export type ElementFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  hidden?: boolean;
};

export type TextElementProps = {
  tag: "h1" | "h2" | "h3" | "p";
  content: string;
  fontFamily?: FontFamilyKey;
  textStyle?: TextTypographyShape;
  fontSize: number;
  mobileFontSize?: number;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  fontStyle?: "normal" | "italic";
  textTransform?: "none" | "uppercase" | "capitalize";
  lineHeight: number;
  letterSpacing?: number;
  textAlign: "left" | "center" | "right";
  color: string;
  accentColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
};

export type ImageElementProps = {
  src: string;
  alt: string;
  shape?: ImageShapePreset;
  objectFit: ImageFitMode;
  objectPosition?: ImagePositionPreset;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor?: string;
  shadow: ShadowPreset;
};

export type StatElementProps = {
  value: string;
  label: string;
  valueColor: string;
  labelColor: string;
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  textAlign: "left" | "center";
  shadow: ShadowPreset;
};

export type CalloutElementProps = {
  icon: StudioIconName;
  title?: string;
  text: string;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderRadius: number;
};

export type ButtonElementProps = {
  label: string;
  href: string;
  openInNewTab?: boolean;
  variant: "solid" | "outline";
  hoverEffect?: ButtonHoverEffect;
  showArrow?: boolean;
  shadow?: ShadowPreset;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  fontSize: number;
};

export type ShapeElementProps = {
  shapeKind: "rectangle" | "circle" | "pill" | "divider";
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backdropBlur?: boolean;
  shadow: ShadowPreset;
};

export type IconElementProps = {
  icon: StudioIconName;
  iconSize: number;
  strokeWidth: number;
  color: string;
  containerShape: "none" | "circle" | "rounded" | "square";
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  shadow: ShadowPreset;
};

export type VideoElementProps = {
  url: string;
  borderRadius: number;
  shadow: ShadowPreset;
};

type BaseElement = {
  id: string;
  name: string;
  desktop: ElementFrame;
  mobile: ElementFrame;
  zIndex: number;
  locked?: boolean;
  opacity?: number;
};

export type TextElement = BaseElement & { type: "text"; props: TextElementProps };
export type ImageElement = BaseElement & { type: "image"; props: ImageElementProps };
export type StatElement = BaseElement & { type: "stat"; props: StatElementProps };
export type CalloutElement = BaseElement & { type: "callout"; props: CalloutElementProps };
export type ButtonElement = BaseElement & { type: "button"; props: ButtonElementProps };
export type ShapeElement = BaseElement & { type: "shape"; props: ShapeElementProps };
export type IconElement = BaseElement & { type: "icon"; props: IconElementProps };
export type VideoElement = BaseElement & { type: "video"; props: VideoElementProps };

export type CanvasElement =
  | TextElement
  | ImageElement
  | StatElement
  | CalloutElement
  | ButtonElement
  | ShapeElement
  | IconElement
  | VideoElement;

export type CanvasElementType = CanvasElement["type"];

export type FreeformSection = {
  id: string;
  name: string;
  backgroundType: "solid" | "gradient";
  backgroundColor: string;
  backgroundGradient: string;
  showGridPattern: boolean;
  desktopHeight: number;
  mobileHeight: number;
  elements: CanvasElement[];
};

export type FreeformDocument = {
  version: 1;
  pageBgColor: string;
  sections: FreeformSection[];
};

export type PageSeoMetadata = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
};

export type DynamicTokenContext = {
  foundingYear: number;
  yearsExperience: number;
  companySlogan: string;
};

export const BRAND_HERO_GRADIENT =
  "radial-gradient(60% 90% at 90% 0%, rgba(24,83,233,0.42) 0%, transparent 60%), linear-gradient(135deg, #004f4f 0%, #008080 55%, #0e9e9b 100%)";

export const SECTION_GRADIENT_PRESETS = [
  {
    name: "Kaizen Teal Hero",
    value: BRAND_HERO_GRADIENT,
  },
  {
    name: "Deep Slate Teal",
    value: "linear-gradient(135deg, #0b1f24 0%, #0f3d3e 100%)",
  },
  {
    name: "Soft Ice",
    value: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
  },
  {
    name: "Ocean Blue",
    value: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)",
  },
];

export const DEFAULT_ABOUT_SEO: PageSeoMetadata = {
  metaTitle: "About Us",
  metaDescription:
    "Established in 1997, Kaizen HRMS delivers 20+ modular, integrated enterprise HR applications tailored to Malaysian organizations.",
  ogImage: "/images/hrsm-modules/mobile_app.png",
};

export function buildTokenContext(settings: {
  company_founding_year?: string;
  company_slogan?: string;
}): DynamicTokenContext {
  const foundingYear =
    Number.parseInt(settings.company_founding_year || "1997", 10) || 1997;
  const currentYear = new Date().getFullYear();
  const yearsExperience = Math.max(1, currentYear - foundingYear);
  const companySlogan =
    settings.company_slogan?.trim() ||
    "Malaysia\u2019s Tier 1 Enterprise HR Solution";

  return { foundingYear, yearsExperience, companySlogan };
}

export function resolveDynamicTokens(
  text: string,
  ctx: DynamicTokenContext
): string {
  if (!text) return "";
  const yearsPhrase =
    ctx.yearsExperience > 25
      ? "three decades"
      : `${ctx.yearsExperience} years`;

  return text
    .replace(/\{\{\s*years_experience\s*\}\}/gi, String(ctx.yearsExperience))
    .replace(/\{\{\s*founding_year\s*\}\}/gi, String(ctx.foundingYear))
    .replace(/\{\{\s*company_slogan\s*\}\}/gi, ctx.companySlogan)
    .replace(/\{\{\s*years_phrase\s*\}\}/gi, yearsPhrase);
}

export function extractYouTubeEmbedUrl(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function sanitizeLinkHref(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "#";
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "#";
  return trimmed;
}

/**
 * Auto-arranges a section's mobile layout cleanly from its desktop elements.
 */
export function autoLayoutSectionMobile(
  section: FreeformSection
): FreeformSection {
  const paddingX = 20;
  const innerWidth = MOBILE_STAGE_WIDTH - paddingX * 2;
  const gap = 14;
  let cursorY = section.showGridPattern ? 96 : 24;

  const sorted = [...section.elements].sort((a, b) => {
    if (Math.abs(a.desktop.y - b.desktop.y) > 28) {
      return a.desktop.y - b.desktop.y;
    }
    return a.desktop.x - b.desktop.x;
  });

  const mobileMap = new Map<string, ElementFrame>();
  for (const el of sorted) {
    if (el.desktop.hidden) {
      mobileMap.set(el.id, { ...el.mobile, hidden: true });
      continue;
    }

    let targetW = innerWidth;
    let targetX = paddingX;
    let targetH = el.desktop.h;

    if (el.type === "icon") {
      targetW = Math.min(72, Math.max(44, el.desktop.w));
      targetH = targetW;
      targetX = paddingX;
    } else if (el.type === "button") {
      targetW = Math.min(innerWidth, Math.max(190, el.desktop.w));
      targetX = Math.round((MOBILE_STAGE_WIDTH - targetW) / 2);
      targetH = Math.max(44, Math.min(54, el.desktop.h));
    } else if (el.type === "shape" && el.props.shapeKind === "divider") {
      targetH = Math.max(6, el.desktop.h);
    } else if (el.type === "shape") {
      // Background container shapes are skipped from stacking unless visible standalone
      targetH = Math.min(260, Math.max(80, Math.round(el.desktop.h * 0.7)));
    } else if (el.type === "image" || el.type === "video") {
      targetH = Math.max(180, Math.min(260, Math.round(el.desktop.h * 0.75)));
    } else if (el.type === "stat") {
      targetH = 118;
    } else if (el.type === "callout") {
      targetH = Math.max(150, Math.round(el.desktop.h * 1.2));
    } else if (el.type === "text") {
      const charFactor = Math.ceil((el.props.content.length || 20) / 36);
      const font = el.props.mobileFontSize ?? Math.min(el.props.fontSize, 30);
      targetH = Math.max(
        40,
        Math.round(charFactor * font * (el.props.lineHeight || 1.45) + 22)
      );
    }

    mobileMap.set(el.id, {
      x: targetX,
      y: cursorY,
      w: targetW,
      h: targetH,
      rotation: 0,
      hidden: false,
    });

    cursorY += targetH + gap;
  }

  return {
    ...section,
    mobileHeight: Math.max(260, cursorY + 24),
    elements: section.elements.map((el) => ({
      ...el,
      mobile: mobileMap.get(el.id) ?? el.mobile,
    })),
  };
}

/**
 * Completely redesigned 5-section corporate About Us default template tailored
 * to Kaizen's modular pick-and-choose enterprise HRMS software business.
 */
export const DEFAULT_ABOUT_US_DOC: FreeformDocument = {
  version: 1,
  pageBgColor: "#F8FAFB",
  sections: [
    // =========================================================================
    // SECTION 1: ASYMMETRIC BRAND TEAL HERO
    // =========================================================================
    {
      id: "sec-hero",
      name: "Hero Banner",
      backgroundType: "gradient",
      backgroundColor: "#008080",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: true,
      desktopHeight: 540,
      mobileHeight: 710,
      elements: [
        {
          id: "el-hero-pill",
          name: "Hero Eyebrow Badge",
          type: "text",
          zIndex: 3,
          desktop: { x: 70, y: 112, w: 390, h: 34 },
          mobile: { x: 20, y: 98, w: 350, h: 32 },
          props: {
            tag: "p",
            textStyle: "pill-badge",
            content: "EST. {{founding_year}} · ENTERPRISE HRMS SOFTWARE",
            fontSize: 12,
            mobileFontSize: 11,
            fontWeight: "700",
            textTransform: "uppercase",
            lineHeight: 1.2,
            letterSpacing: 0.08,
            textAlign: "center",
            color: "#CCFBF1",
            backgroundColor: "rgba(255,255,255,0.12)",
            borderColor: "rgba(255,255,255,0.24)",
            borderRadius: 999,
            padding: 8,
          },
        },
        {
          id: "el-hero-title",
          name: "Hero Title",
          type: "text",
          zIndex: 4,
          desktop: { x: 70, y: 162, w: 580, h: 120 },
          mobile: { x: 20, y: 142, w: 350, h: 98 },
          props: {
            tag: "h1",
            textStyle: "plain",
            content: "Built to grow with every stage of your workforce.",
            fontSize: 44,
            mobileFontSize: 30,
            fontWeight: "800",
            lineHeight: 1.15,
            letterSpacing: -0.025,
            textAlign: "left",
            color: "#FFFFFF",
          },
        },
        {
          id: "el-hero-subtitle",
          name: "Hero Subtitle",
          type: "text",
          zIndex: 4,
          desktop: { x: 70, y: 294, w: 560, h: 96 },
          mobile: { x: 20, y: 248, w: 350, h: 108 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "From foundational Payroll and Leave to 20+ integrated HR modules — choose only the modules your organization needs, backed by {{years_experience}}+ years of Malaysian HR expertise.",
            fontSize: 17,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.65,
            textAlign: "left",
            color: "rgba(255,255,255,0.88)",
          },
        },
        {
          id: "el-hero-cta-primary",
          name: "Button: Talk to Sales",
          type: "button",
          zIndex: 5,
          desktop: { x: 70, y: 416, w: 196, h: 48 },
          mobile: { x: 20, y: 372, w: 168, h: 46 },
          props: {
            label: "Request a Demo",
            href: "/company/contact-us",
            openInNewTab: false,
            variant: "solid",
            hoverEffect: "lift",
            showArrow: true,
            shadow: "md",
            backgroundColor: "#FACC15",
            textColor: "#0F172A",
            borderColor: "#FACC15",
            borderRadius: 999,
            fontSize: 14,
          },
        },
        {
          id: "el-hero-cta-secondary",
          name: "Button: Explore Modules",
          type: "button",
          zIndex: 5,
          desktop: { x: 282, y: 416, w: 204, h: 48 },
          mobile: { x: 202, y: 372, w: 168, h: 46 },
          props: {
            label: "Explore HRMS",
            href: "/hrms/personnel-hub",
            openInNewTab: false,
            variant: "outline",
            hoverEffect: "scale",
            showArrow: false,
            shadow: "none",
            backgroundColor: "transparent",
            textColor: "#FFFFFF",
            borderColor: "rgba(255,255,255,0.45)",
            borderRadius: 999,
            fontSize: 14,
          },
        },
        // Right Showcase Card — cleanly frames the image on matching white so
        // there are zero white sidebars!
        {
          id: "el-hero-card-bg",
          name: "Showcase Card Frame",
          type: "shape",
          zIndex: 2,
          desktop: { x: 686, y: 112, w: 444, h: 356 },
          mobile: { x: 20, y: 438, w: 350, h: 242 },
          props: {
            shapeKind: "rectangle",
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(255,255,255,0.6)",
            borderWidth: 1,
            borderRadius: 24,
            shadow: "2xl",
          },
        },
        {
          id: "el-hero-image",
          name: "Hero Showcase Image",
          type: "image",
          zIndex: 4,
          desktop: { x: 702, y: 128, w: 412, h: 246 },
          mobile: { x: 32, y: 450, w: 326, h: 158 },
          props: {
            src: "/images/hrsm-modules/mobile_app.png",
            alt: "Kaizen HRMS Enterprise Platform",
            shape: "rounded",
            objectFit: "contain",
            objectPosition: "center",
            borderRadius: 16,
            borderWidth: 0,
            borderColor: "#FFFFFF",
            backgroundColor: "#FFFFFF",
            shadow: "none",
          },
        },
        {
          id: "el-hero-card-tag",
          name: "Showcase Card Tag",
          type: "text",
          zIndex: 5,
          desktop: { x: 710, y: 388, w: 396, h: 22 },
          mobile: { x: 36, y: 616, w: 318, h: 20 },
          props: {
            tag: "p",
            textStyle: "eyebrow",
            content: "PICK-AND-CHOOSE ARCHITECTURE",
            fontSize: 11,
            mobileFontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            lineHeight: 1.2,
            letterSpacing: 0.08,
            textAlign: "left",
            color: "#008080",
            accentColor: "#008080",
          },
        },
        {
          id: "el-hero-card-caption",
          name: "Showcase Card Caption",
          type: "text",
          zIndex: 5,
          desktop: { x: 710, y: 414, w: 396, h: 42 },
          mobile: { x: 36, y: 638, w: 318, h: 34 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "Select only the HRMS modules your company requires and add more anytime as your team grows.",
            fontSize: 13,
            mobileFontSize: 12,
            fontWeight: "500",
            lineHeight: 1.45,
            textAlign: "left",
            color: "#475569",
          },
        },
      ],
    },

    // =========================================================================
    // SECTION 2: VERIFIED METRICS BAND
    // =========================================================================
    {
      id: "sec-metrics",
      name: "Key Metrics Strip",
      backgroundType: "solid",
      backgroundColor: "#FFFFFF",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: false,
      desktopHeight: 192,
      mobileHeight: 438,
      elements: [
        {
          id: "el-stat-years",
          name: "Stat: Years Experience",
          type: "stat",
          zIndex: 2,
          desktop: { x: 70, y: 36, w: 332, h: 120 },
          mobile: { x: 20, y: 24, w: 350, h: 118 },
          props: {
            value: "{{years_experience}}+",
            label: "Years in Malaysian HR technology (est. {{founding_year}})",
            valueColor: "#008080",
            labelColor: "#475569",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            borderRadius: 16,
            textAlign: "left",
            shadow: "none",
          },
        },
        {
          id: "el-stat-modules",
          name: "Stat: Modular Suite",
          type: "stat",
          zIndex: 3,
          desktop: { x: 434, y: 36, w: 332, h: 120 },
          mobile: { x: 20, y: 158, w: 350, h: 118 },
          props: {
            value: "20+",
            label: "Integrated HRMS modules — choose what fits your business",
            valueColor: "#008080",
            labelColor: "#475569",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            borderRadius: 16,
            textAlign: "left",
            shadow: "none",
          },
        },
        {
          id: "el-stat-award",
          name: "Stat: MSC-APICTA",
          type: "stat",
          zIndex: 4,
          desktop: { x: 798, y: 36, w: 332, h: 120 },
          mobile: { x: 20, y: 292, w: 350, h: 122 },
          props: {
            value: "MSC-APICTA",
            label: "Best Software Applications national award winner",
            valueColor: "#008080",
            labelColor: "#475569",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            borderRadius: 16,
            textAlign: "left",
            shadow: "none",
          },
        },
      ],
    },

    // =========================================================================
    // SECTION 3: OUR STORY + MILESTONES RAIL (Eliminates empty left void)
    // =========================================================================
    {
      id: "sec-story",
      name: "Our Story & Milestones",
      backgroundType: "solid",
      backgroundColor: "#F8FAFB",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: false,
      desktopHeight: 676,
      mobileHeight: 1380,
      elements: [
        {
          id: "el-story-eyebrow",
          name: "Story Eyebrow",
          type: "text",
          zIndex: 3,
          desktop: { x: 70, y: 56, w: 220, h: 26 },
          mobile: { x: 20, y: 32, w: 220, h: 26 },
          props: {
            tag: "p",
            textStyle: "eyebrow",
            content: "OUR STORY",
            fontSize: 12,
            mobileFontSize: 12,
            fontWeight: "700",
            textTransform: "uppercase",
            lineHeight: 1.2,
            letterSpacing: 0.1,
            textAlign: "left",
            color: "#008080",
            accentColor: "#008080",
          },
        },
        {
          id: "el-story-heading",
          name: "Heading: Our Story",
          type: "text",
          zIndex: 3,
          desktop: { x: 70, y: 90, w: 366, h: 90 },
          mobile: { x: 20, y: 66, w: 350, h: 74 },
          props: {
            tag: "h2",
            textStyle: "plain",
            content: "Nearly {{years_phrase}} of enterprise HR excellence.",
            fontSize: 32,
            mobileFontSize: 26,
            fontWeight: "800",
            lineHeight: 1.2,
            letterSpacing: -0.02,
            textAlign: "left",
            color: "#0F172A",
          },
        },
        {
          id: "el-journey-card",
          name: "Milestones Card Frame",
          type: "shape",
          zIndex: 1,
          desktop: { x: 70, y: 200, w: 366, h: 420 },
          mobile: { x: 20, y: 970, w: 350, h: 374 },
          props: {
            shapeKind: "rectangle",
            backgroundColor: "#FFFFFF",
            borderColor: "#E2E8F0",
            borderWidth: 1,
            borderRadius: 20,
            shadow: "sm",
          },
        },
        {
          id: "el-journey-icon",
          name: "Milestones Icon",
          type: "icon",
          zIndex: 3,
          desktop: { x: 96, y: 224, w: 42, h: 42 },
          mobile: { x: 42, y: 992, w: 40, h: 40 },
          props: {
            icon: "Compass",
            iconSize: 20,
            strokeWidth: 2,
            color: "#008080",
            containerShape: "rounded",
            backgroundColor: "rgba(0,128,128,0.1)",
            borderColor: "transparent",
            borderWidth: 0,
            shadow: "none",
          },
        },
        {
          id: "el-journey-title",
          name: "Milestones Title",
          type: "text",
          zIndex: 3,
          desktop: { x: 150, y: 233, w: 260, h: 28 },
          mobile: { x: 94, y: 1000, w: 250, h: 26 },
          props: {
            tag: "h3",
            textStyle: "plain",
            content: "Kaizen HR Journey",
            fontSize: 16,
            mobileFontSize: 16,
            fontWeight: "700",
            lineHeight: 1.3,
            textAlign: "left",
            color: "#0F172A",
          },
        },
        {
          id: "el-journey-list",
          name: "Milestones List",
          type: "text",
          zIndex: 3,
          desktop: { x: 96, y: 282, w: 314, h: 316 },
          mobile: { x: 42, y: 1046, w: 306, h: 284 },
          props: {
            tag: "p",
            textStyle: "left-accent",
            content:
              "{{founding_year}} — Founded\nLaunched with core Payroll, Personnel, Leave & Claims.\n\nModular Expansion\nGrew into 20+ integrated HR modules organizations can mix & match.\n\nMSC-APICTA Winner\nNominated twice consecutively & named Best Software Applications winner.\n\nToday\nTrusted as {{company_slogan}}.",
            fontSize: 13.5,
            mobileFontSize: 13,
            fontWeight: "500",
            lineHeight: 1.55,
            textAlign: "left",
            color: "#334155",
            accentColor: "#008080",
            padding: 12,
          },
        },
        // Right Narrative Column
        {
          id: "el-story-p1",
          name: "Story Paragraph 1",
          type: "text",
          zIndex: 3,
          desktop: { x: 476, y: 56, w: 654, h: 158 },
          mobile: { x: 20, y: 154, w: 350, h: 248 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "Established in {{founding_year}}, Kaizen HRMS has been a trusted name in HR technology for over {{years_experience}} years, embedding proven best practices into every module we deliver. We began with a clear mission: to simplify HR with a foundational suite of Payroll, Personnel, Leave, and Claims modules — engineered for precision, compliance, and ease of use so HR teams can focus on people, not paperwork.",
            fontSize: 16,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.75,
            textAlign: "left",
            color: "#334155",
          },
        },
        {
          id: "el-story-p2",
          name: "Story Paragraph 2",
          type: "text",
          zIndex: 3,
          desktop: { x: 476, y: 226, w: 654, h: 122 },
          mobile: { x: 20, y: 414, w: 350, h: 186 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "Today, our vision has grown into a comprehensive platform of more than 20 fully integrated modules spanning Core HR, Compensation & Benefits, Strategic HR Management, and Business Analytics. Companies choose the exact modules that match their workflows today and scale seamlessly tomorrow.",
            fontSize: 16,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.75,
            textAlign: "left",
            color: "#334155",
          },
        },
        {
          id: "el-award-callout",
          name: "MSC-APICTA Award Spotlight",
          type: "callout",
          zIndex: 4,
          desktop: { x: 476, y: 368, w: 654, h: 156 },
          mobile: { x: 20, y: 614, w: 350, h: 218 },
          props: {
            icon: "Award",
            title: "MSC-APICTA Award — Best Software Applications",
            text: "Kaizen HRMS is proud to be the only Malaysian HR solution nominated twice consecutively and ultimately winning the prestigious MSC-APICTA Award for Best Software Applications, recognizing our product strength, innovation, and industry relevance.",
            accentColor: "#008080",
            backgroundColor: "rgba(0, 128, 128, 0.07)",
            borderColor: "rgba(0, 128, 128, 0.25)",
            textColor: "#0F172A",
            borderRadius: 16,
          },
        },
        {
          id: "el-story-closing",
          name: "Closing Paragraph",
          type: "text",
          zIndex: 3,
          desktop: { x: 476, y: 544, w: 654, h: 88 },
          mobile: { x: 20, y: 846, w: 350, h: 108 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "With nearly {{years_phrase}} of proven excellence, Kaizen HRMS is widely recognized as {{company_slogan}}, helping organizations across industries build smarter, more productive, and engaged workforces.",
            fontSize: 16,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.75,
            textAlign: "left",
            color: "#334155",
          },
        },
      ],
    },

    // =========================================================================
    // SECTION 4: MODULAR HRMS ARCHITECTURE (Pick-and-Choose Business Model)
    // =========================================================================
    {
      id: "sec-modules",
      name: "Modular HRMS Pillars",
      backgroundType: "solid",
      backgroundColor: "#FFFFFF",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: false,
      desktopHeight: 564,
      mobileHeight: 970,
      elements: [
        {
          id: "el-mod-pill",
          name: "Modular Pill Badge",
          type: "text",
          zIndex: 2,
          desktop: { x: 480, y: 52, w: 240, h: 32 },
          mobile: { x: 75, y: 36, w: 240, h: 30 },
          props: {
            tag: "p",
            textStyle: "pill-badge",
            content: "MODULAR BY DESIGN",
            fontSize: 11,
            mobileFontSize: 11,
            fontWeight: "700",
            textTransform: "uppercase",
            lineHeight: 1.2,
            letterSpacing: 0.1,
            textAlign: "center",
            color: "#006666",
            backgroundColor: "rgba(0,128,128,0.09)",
            borderColor: "rgba(0,128,128,0.22)",
            borderRadius: 999,
            padding: 6,
          },
        },
        {
          id: "el-mod-heading",
          name: "Modular Heading",
          type: "text",
          zIndex: 3,
          desktop: { x: 170, y: 96, w: 860, h: 48 },
          mobile: { x: 20, y: 78, w: 350, h: 68 },
          props: {
            tag: "h2",
            textStyle: "plain",
            content: "Choose the exact HR modules your company needs",
            fontSize: 34,
            mobileFontSize: 24,
            fontWeight: "800",
            lineHeight: 1.2,
            letterSpacing: -0.02,
            textAlign: "center",
            color: "#0F172A",
          },
        },
        {
          id: "el-mod-sub",
          name: "Modular Subtitle",
          type: "text",
          zIndex: 3,
          desktop: { x: 220, y: 150, w: 760, h: 52 },
          mobile: { x: 20, y: 154, w: 350, h: 80 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "Start with core operational essentials and activate any combination from our 20+ HRMS modules — all connected through one unified employee platform.",
            fontSize: 16,
            mobileFontSize: 14,
            fontWeight: "400",
            lineHeight: 1.6,
            textAlign: "center",
            color: "#475569",
          },
        },
        {
          id: "el-pillar-core",
          name: "Pillar 1: Core HR",
          type: "callout",
          zIndex: 3,
          desktop: { x: 70, y: 228, w: 518, h: 138 },
          mobile: { x: 20, y: 252, w: 350, h: 160 },
          props: {
            icon: "Users",
            title: "Core HR & Operations",
            text: "Personnel Hub, Payroll Management, Leave, Claims, and Time & Attendance — engineered for accuracy and Malaysian statutory compliance.",
            accentColor: "#008080",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            textColor: "#1E293B",
            borderRadius: 16,
          },
        },
        {
          id: "el-pillar-comp",
          name: "Pillar 2: Compensation & Benefits",
          type: "callout",
          zIndex: 3,
          desktop: { x: 612, y: 228, w: 518, h: 138 },
          mobile: { x: 20, y: 428, w: 350, h: 160 },
          props: {
            icon: "ShieldCheck",
            title: "Compensation & Benefits",
            text: "Administer Loan Management, Interest Subsidies, GIS & GHS insurance, ESOS, ESPP, and Leave Passage entitlements in one place.",
            accentColor: "#0284C7",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            textColor: "#1E293B",
            borderRadius: 16,
          },
        },
        {
          id: "el-pillar-talent",
          name: "Pillar 3: Strategic Talent",
          type: "callout",
          zIndex: 3,
          desktop: { x: 70, y: 384, w: 518, h: 138 },
          mobile: { x: 20, y: 604, w: 350, h: 160 },
          props: {
            icon: "TrendingUp",
            title: "Strategic HR & Talent Growth",
            text: "Drive Recruitment, Performance Management, Competency Assessments, Training Management, and Training Needs Analysis.",
            accentColor: "#0F766E",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            textColor: "#1E293B",
            borderRadius: 16,
          },
        },
        {
          id: "el-pillar-analytics",
          name: "Pillar 4: Self-Service & Analytics",
          type: "callout",
          zIndex: 3,
          desktop: { x: 612, y: 384, w: 518, h: 138 },
          mobile: { x: 20, y: 780, w: 350, h: 160 },
          props: {
            icon: "BarChart3",
            title: "Self-Service, Mobile & Analytics",
            text: "Empower teams with Employee Self Service, Mobile App access, BI Dashboard Analytics, and our custom Module Configurator.",
            accentColor: "#1D4ED8",
            backgroundColor: "#F8FAFB",
            borderColor: "#E2E8F0",
            textColor: "#1E293B",
            borderRadius: 16,
          },
        },
      ],
    },

    // =========================================================================
    // SECTION 5: CLOSING CONVERSION CTA CARD
    // =========================================================================
    {
      id: "sec-cta",
      name: "Closing CTA Banner",
      backgroundType: "solid",
      backgroundColor: "#F8FAFB",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: false,
      desktopHeight: 332,
      mobileHeight: 400,
      elements: [
        {
          id: "el-cta-card",
          name: "CTA Card Backdrop",
          type: "shape",
          zIndex: 1,
          desktop: { x: 70, y: 36, w: 1060, h: 256 },
          mobile: { x: 20, y: 24, w: 350, h: 344 },
          props: {
            shapeKind: "rectangle",
            backgroundColor: "#0F292E",
            borderColor: "#1D4B52",
            borderWidth: 1,
            borderRadius: 24,
            shadow: "lg",
          },
        },
        {
          id: "el-cta-pill",
          name: "CTA Eyebrow",
          type: "text",
          zIndex: 3,
          desktop: { x: 455, y: 66, w: 290, h: 30 },
          mobile: { x: 55, y: 48, w: 280, h: 28 },
          props: {
            tag: "p",
            textStyle: "pill-badge",
            content: "TAILORED TO YOUR WORKFORCE",
            fontSize: 11,
            mobileFontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            lineHeight: 1.2,
            letterSpacing: 0.08,
            textAlign: "center",
            color: "#5EEAD4",
            backgroundColor: "rgba(94,234,212,0.12)",
            borderColor: "rgba(94,234,212,0.28)",
            borderRadius: 999,
            padding: 6,
          },
        },
        {
          id: "el-cta-title",
          name: "CTA Headline",
          type: "text",
          zIndex: 3,
          desktop: { x: 160, y: 108, w: 880, h: 44 },
          mobile: { x: 38, y: 90, w: 314, h: 64 },
          props: {
            tag: "h2",
            textStyle: "plain",
            content: "Ready to configure your ideal HRMS suite?",
            fontSize: 32,
            mobileFontSize: 22,
            fontWeight: "800",
            lineHeight: 1.2,
            letterSpacing: -0.02,
            textAlign: "center",
            color: "#FFFFFF",
          },
        },
        {
          id: "el-cta-sub",
          name: "CTA Subtitle",
          type: "text",
          zIndex: 3,
          desktop: { x: 230, y: 158, w: 740, h: 42 },
          mobile: { x: 38, y: 162, w: 314, h: 66 },
          props: {
            tag: "p",
            textStyle: "plain",
            content:
              "Tell us which HR modules matter most to your business. No commitments — just a tailored walkthrough with our specialists.",
            fontSize: 15,
            mobileFontSize: 14,
            fontWeight: "400",
            lineHeight: 1.55,
            textAlign: "center",
            color: "rgba(255,255,255,0.8)",
          },
        },
        {
          id: "el-cta-btn-primary",
          name: "CTA Button: Contact Us",
          type: "button",
          zIndex: 4,
          desktop: { x: 384, y: 214, w: 204, h: 48 },
          mobile: { x: 55, y: 244, w: 280, h: 46 },
          props: {
            label: "Contact Our Team",
            href: "/company/contact-us",
            openInNewTab: false,
            variant: "solid",
            hoverEffect: "lift",
            showArrow: true,
            shadow: "md",
            backgroundColor: "#FACC15",
            textColor: "#0F172A",
            borderColor: "#FACC15",
            borderRadius: 999,
            fontSize: 14,
          },
        },
        {
          id: "el-cta-btn-secondary",
          name: "CTA Button: Brochure",
          type: "button",
          zIndex: 4,
          desktop: { x: 606, y: 214, w: 210, h: 48 },
          mobile: { x: 55, y: 302, w: 280, h: 46 },
          props: {
            label: "Download Brochure",
            href: "/kaizen-hrms-modules-brochure.pdf",
            openInNewTab: true,
            variant: "outline",
            hoverEffect: "scale",
            showArrow: false,
            shadow: "none",
            backgroundColor: "transparent",
            textColor: "#FFFFFF",
            borderColor: "rgba(255,255,255,0.35)",
            borderRadius: 999,
            fontSize: 14,
          },
        },
      ],
    },
  ],
};

/** Safe runtime validator so malformed DB JSON never breaks the page. */
export function normalizeFreeformDocument(raw: unknown): FreeformDocument {
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as FreeformDocument).sections)
  ) {
    const doc = raw as FreeformDocument;
    return {
      version: 1,
      pageBgColor:
        typeof doc.pageBgColor === "string" && doc.pageBgColor
          ? doc.pageBgColor
          : "#F8FAFB",
      sections: doc.sections.map((sec, idx) => ({
        id: sec.id || `sec-${idx}`,
        name: sec.name || `Section ${idx + 1}`,
        backgroundType:
          sec.backgroundType === "gradient" ? "gradient" : "solid",
        backgroundColor: sec.backgroundColor || "#FFFFFF",
        backgroundGradient: sec.backgroundGradient || BRAND_HERO_GRADIENT,
        showGridPattern: Boolean(sec.showGridPattern),
        desktopHeight: Math.max(120, Number(sec.desktopHeight) || 400),
        mobileHeight: Math.max(120, Number(sec.mobileHeight) || 400),
        elements: Array.isArray(sec.elements) ? sec.elements : [],
      })),
    };
  }
  return structuredClone(DEFAULT_ABOUT_US_DOC);
}
