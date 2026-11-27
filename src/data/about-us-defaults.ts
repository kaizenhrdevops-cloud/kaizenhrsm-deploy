// src/data/about-us-defaults.ts

export const DESKTOP_STAGE_WIDTH = 1200;
export const MOBILE_STAGE_WIDTH = 390;

export type Breakpoint = "desktop" | "mobile";

export type ShadowPreset = "none" | "sm" | "md" | "lg" | "2xl";

export type CalloutIconName =
  | "Award"
  | "Sparkles"
  | "ShieldCheck"
  | "Star"
  | "Heart"
  | "Lightbulb"
  | "Building2"
  | "Users"
  | "CheckCircle2";

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
  fontSize: number;
  mobileFontSize?: number;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  lineHeight: number;
  letterSpacing?: number;
  textAlign: "left" | "center" | "right";
  color: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
};

export type ImageElementProps = {
  src: string;
  alt: string;
  objectFit: "cover" | "contain";
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
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
  icon: CalloutIconName;
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
export type VideoElement = BaseElement & { type: "video"; props: VideoElementProps };

export type CanvasElement =
  | TextElement
  | ImageElement
  | StatElement
  | CalloutElement
  | ButtonElement
  | ShapeElement
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
  "radial-gradient(60% 90% at 90% 0%, rgba(24,83,233,0.45) 0%, transparent 60%), linear-gradient(135deg, #005c5c 0%, #008080 55%, #12a3a0 100%)";

export const SECTION_GRADIENT_PRESETS = [
  {
    name: "Kaizen Teal Hero",
    value: BRAND_HERO_GRADIENT,
  },
  {
    name: "Deep Slate",
    value: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
    "From a pioneering idea to Malaysia's most comprehensive HR solution.",
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

/**
 * Resolves live General Settings placeholders inside canvas copy so
 * stats & founding-year text continue updating automatically each year.
 */
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
 * Auto-arranges a section's mobile layout cleanly from its desktop elements
 * (reading order top-to-bottom, left-to-right), preserving custom edits if needed.
 */
export function autoLayoutSectionMobile(
  section: FreeformSection
): FreeformSection {
  const paddingX = 16;
  const innerWidth = MOBILE_STAGE_WIDTH - paddingX * 2;
  const gap = 16;
  let cursorY = section.showGridPattern ? 104 : 24;

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

    const scaleRatio = innerWidth / Math.max(el.desktop.w, 1);
    let targetW = innerWidth;
    let targetX = paddingX;
    let targetH = el.desktop.h;

    if (el.type === "button") {
      targetW = Math.min(innerWidth, Math.max(180, el.desktop.w));
      targetX = Math.round((MOBILE_STAGE_WIDTH - targetW) / 2);
      targetH = Math.max(44, Math.min(60, el.desktop.h));
    } else if (el.type === "shape" && el.props.shapeKind === "divider") {
      targetH = Math.max(4, el.desktop.h);
    } else if (el.type === "image" || el.type === "video") {
      targetH = Math.max(
        180,
        Math.min(320, Math.round(el.desktop.h * Math.min(1, scaleRatio * 1.4)))
      );
    } else if (el.type === "stat") {
      targetH = 118;
    } else if (el.type === "callout") {
      targetH = Math.max(160, Math.round(el.desktop.h * 1.35));
    } else if (el.type === "text") {
      const charFactor = Math.ceil((el.props.content.length || 20) / 38);
      const font = el.props.mobileFontSize ?? Math.min(el.props.fontSize, 32);
      targetH = Math.max(
        48,
        Math.round(charFactor * font * (el.props.lineHeight || 1.5) + 20)
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
 * Recreates the exact original Kaizen About Us page as freely draggable,
 * resizable elements across 3 full-bleed sections (Desktop 1200px & Mobile 390px).
 */
export const DEFAULT_ABOUT_US_DOC: FreeformDocument = {
  version: 1,
  pageBgColor: "#F8FAFB",
  sections: [
    {
      id: "sec-hero",
      name: "Hero Banner",
      backgroundType: "gradient",
      backgroundColor: "#008080",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: true,
      desktopHeight: 380,
      mobileHeight: 320,
      elements: [
        {
          id: "el-hero-title",
          name: "Hero Title",
          type: "text",
          zIndex: 2,
          desktop: { x: 200, y: 124, w: 800, h: 68 },
          mobile: { x: 20, y: 108, w: 350, h: 52 },
          props: {
            tag: "h1",
            content: "About Us",
            fontSize: 48,
            mobileFontSize: 34,
            fontWeight: "800",
            lineHeight: 1.12,
            letterSpacing: -0.025,
            textAlign: "center",
            color: "#FFFFFF",
          },
        },
        {
          id: "el-hero-subtitle",
          name: "Hero Subtitle",
          type: "text",
          zIndex: 3,
          desktop: { x: 220, y: 204, w: 760, h: 68 },
          mobile: { x: 24, y: 168, w: 342, h: 72 },
          props: {
            tag: "p",
            content:
              "From a pioneering idea to Malaysia\u2019s most comprehensive HR solution.",
            fontSize: 18,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.6,
            textAlign: "center",
            color: "rgba(255,255,255,0.88)",
          },
        },
      ],
    },
    {
      id: "sec-showcase",
      name: "Team Image & Stats",
      backgroundType: "solid",
      backgroundColor: "#F8FAFB",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: false,
      desktopHeight: 500,
      mobileHeight: 600,
      elements: [
        {
          id: "el-hero-image",
          name: "Team Collaboration Image",
          type: "image",
          zIndex: 5,
          desktop: { x: 90, y: -96, w: 1020, h: 416 },
          mobile: { x: 16, y: -64, w: 358, h: 220 },
          props: {
            src: "/images/hrsm-modules/mobile_app.png",
            alt: "Kaizen HRMS Team collaborating",
            objectFit: "cover",
            borderRadius: 24,
            borderWidth: 4,
            borderColor: "#FFFFFF",
            shadow: "2xl",
          },
        },
        {
          id: "el-stat-years",
          name: "Stat: Years Experience",
          type: "stat",
          zIndex: 2,
          desktop: { x: 90, y: 348, w: 326, h: 120 },
          mobile: { x: 16, y: 176, w: 358, h: 118 },
          props: {
            value: "{{years_experience}}+",
            label: "years in HR technology",
            valueColor: "#008080",
            labelColor: "#4B5563",
            backgroundColor: "#FFFFFF",
            borderColor: "#E5EDF5",
            borderRadius: 16,
            textAlign: "left",
            shadow: "sm",
          },
        },
        {
          id: "el-stat-modules",
          name: "Stat: Integrated Modules",
          type: "stat",
          zIndex: 3,
          desktop: { x: 437, y: 348, w: 326, h: 120 },
          mobile: { x: 16, y: 310, w: 358, h: 118 },
          props: {
            value: "20+",
            label: "fully integrated modules",
            valueColor: "#008080",
            labelColor: "#4B5563",
            backgroundColor: "#FFFFFF",
            borderColor: "#E5EDF5",
            borderRadius: 16,
            textAlign: "left",
            shadow: "sm",
          },
        },
        {
          id: "el-stat-award",
          name: "Stat: MSC-APICTA",
          type: "stat",
          zIndex: 4,
          desktop: { x: 784, y: 348, w: 326, h: 120 },
          mobile: { x: 16, y: 444, w: 358, h: 124 },
          props: {
            value: "MSC-APICTA",
            label: "Best Software Applications award winner",
            valueColor: "#008080",
            labelColor: "#4B5563",
            backgroundColor: "#FFFFFF",
            borderColor: "#E5EDF5",
            borderRadius: 16,
            textAlign: "left",
            shadow: "sm",
          },
        },
      ],
    },
    {
      id: "sec-story",
      name: "Our Story & Award",
      backgroundType: "solid",
      backgroundColor: "#F8FAFB",
      backgroundGradient: BRAND_HERO_GRADIENT,
      showGridPattern: false,
      desktopHeight: 700,
      mobileHeight: 1020,
      elements: [
        {
          id: "el-story-heading",
          name: "Heading: Our story",
          type: "text",
          zIndex: 2,
          desktop: { x: 90, y: 48, w: 280, h: 52 },
          mobile: { x: 20, y: 20, w: 350, h: 44 },
          props: {
            tag: "h2",
            content: "Our story",
            fontSize: 30,
            mobileFontSize: 26,
            fontWeight: "700",
            lineHeight: 1.2,
            letterSpacing: -0.02,
            textAlign: "left",
            color: "#111827",
          },
        },
        {
          id: "el-story-p1",
          name: "Story Paragraph 1",
          type: "text",
          zIndex: 3,
          desktop: { x: 430, y: 48, w: 680, h: 162 },
          mobile: { x: 20, y: 76, w: 350, h: 256 },
          props: {
            tag: "p",
            content:
              "Established in {{founding_year}}, kaizen HRMS has been a trusted name in HR technology for over {{years_experience}} years, embedding best practices into every module we deliver. We began with a clear mission: to simplify HR with a foundational suite of Payroll, Personnel, Leave, and Claims modules. From the outset, we understood the importance of precision, compliance, and user-friendly design, empowering HR professionals to focus on people, not paperwork.",
            fontSize: 16,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.75,
            textAlign: "left",
            color: "#374151",
          },
        },
        {
          id: "el-story-p2",
          name: "Story Paragraph 2",
          type: "text",
          zIndex: 4,
          desktop: { x: 430, y: 224, w: 680, h: 122 },
          mobile: { x: 20, y: 344, w: 350, h: 196 },
          props: {
            tag: "p",
            content:
              "Today, our vision has grown into a comprehensive platform of more than 20 fully integrated modules, spanning Core HR, Compensation & Benefits, Strategic HR Management, and advanced innovations like Business Analytics. This expansion reflects our commitment to keeping pace with evolving business needs while shaping the future of HR.",
            fontSize: 16,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.75,
            textAlign: "left",
            color: "#374151",
          },
        },
        {
          id: "el-award-callout",
          name: "MSC-APICTA Award Callout",
          type: "callout",
          zIndex: 5,
          desktop: { x: 430, y: 368, w: 680, h: 156 },
          mobile: { x: 20, y: 556, w: 350, h: 254 },
          props: {
            icon: "Award",
            text: "Kaizen HRMS is proud to be the only Malaysian HR solution nominated twice consecutively and ultimately winning the prestigious MSC-APICTA Award for Best Software Applications, a recognition that underscores our product strength, innovation, and industry relevance.",
            accentColor: "#008080",
            backgroundColor: "rgba(0, 128, 128, 0.06)",
            borderColor: "rgba(0, 128, 128, 0.22)",
            textColor: "#111827",
            borderRadius: 16,
          },
        },
        {
          id: "el-story-closing",
          name: "Closing Paragraph",
          type: "text",
          zIndex: 6,
          desktop: { x: 430, y: 548, w: 680, h: 112 },
          mobile: { x: 20, y: 828, w: 350, h: 168 },
          props: {
            tag: "p",
            content:
              "With nearly {{years_phrase}} of proven excellence, kaizen HRMS is widely recognized as {{company_slogan}}, helping leading organizations across industries build smarter, more productive, and engaged workforces.",
            fontSize: 16,
            mobileFontSize: 15,
            fontWeight: "400",
            lineHeight: 1.75,
            textAlign: "left",
            color: "#374151",
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
