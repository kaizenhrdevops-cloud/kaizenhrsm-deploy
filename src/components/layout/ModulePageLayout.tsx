// ModulePageLayout.tsx
import React from "react";
import Image from "next/image";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Container from "./Container";
import RelatedModulesSection from "../sections/RelatedModulesSection";

// Media types for features
type MediaType = {
  type: "image" | "video" | "icon";
  src?: string;
  alt?: string;
  icon?: string;
};

// Layout options for features
type LayoutType = "center" | "left-media" | "right-media" | "full-width";

// Enhanced CoreFeature type
type CoreFeature = {
  icon?: string;
  title: string;
  description: string;
  bgColor: string;
  media?: MediaType;
  layout?: LayoutType;
  containerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

type RelatedModule = {
  name: string;
  description: string;
  link: string;
};

// Hero frame per saved ratio (kept as literals so Tailwind generates them).
const HERO_ASPECT_CLASS: Record<string, string> = {
  "21:9": "aspect-[21/9]",
  "4:1": "aspect-[4/1]",
  "16:9": "aspect-[16/9]",
  "3:2": "aspect-[3/2]",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-[1/1]",
};

// Hero background tokens from the DB. Flat colors pass through; gradient
// tokens map to fixed classes here (literals keep Tailwind JIT generating
// them even after static pages using the same gradients are deleted).
const HERO_BG_CLASS: Record<string, string> = {
  "bg-white": "bg-white",
  "bg-slate-50": "bg-slate-50",
  "bg-slate-100": "bg-slate-100",
  "bg-blue-50": "bg-blue-50",
  "bg-gray-50": "bg-gray-50",
  "gradient-blue": "bg-gradient-to-br from-blue-50 to-indigo-100",
  // Identity entry: leave-management's static page passes the raw gradient
  // as heroClassName today — keep rendering it until that folder migrates.
  "bg-gradient-to-br from-blue-50 to-indigo-100":
    "bg-gradient-to-br from-blue-50 to-indigo-100",
};

/**
 * next/image only handles local files + configured remote hosts. Pasted
 * online URLs from any other host must use a plain <img> — otherwise SSR
 * throws "Invalid src prop" and the whole page falls back to client render.
 */
function canOptimize(src: string | undefined): src is string {
  if (!src) return false;
  return src.startsWith("/") || src.includes(".supabase.co");
}

/** "1m30s" / "90" → seconds, for YouTube start-time params. */
function parseVideoTime(value: string): number {
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  const m = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/);
  if (!m || (!m[1] && !m[2] && !m[3])) return 0;
  return (
    parseInt(m[1] || "0", 10) * 3600 +
    parseInt(m[2] || "0", 10) * 60 +
    parseInt(m[3] || "0", 10)
  );
}

/**
 * YouTube / Vimeo links → privacy-friendly embed URLs. Anything else
 * (MP4/WebM/…) returns null and plays as a native <video>.
 */
function getVideoEmbed(
  raw: string
): { embedUrl: string; title: string } | null {
  const url = (raw || "").trim();
  if (!url) return null;

  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{6,})/
  );
  if (yt) {
    const t = url.match(/[?&#](?:t|start)=([^&#]+)/);
    const start = t ? parseVideoTime(decodeURIComponent(t[1])) : 0;
    return {
      embedUrl: `https://www.youtube.com/embed/${yt[1]}${start > 0 ? `?start=${start}` : ""}`,
      title: "YouTube video player",
    };
  }

  const vimeo = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeo) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
      title: "Vimeo video player",
    };
  }

  return null;
}

// Component's props interface
interface ModulePageLayoutProps {
  pageTitle: string;
  pageDescription: string;
  coreFeatures: CoreFeature[];
  relatedModules: RelatedModule[];
  heroClassName?: string;
  heroContentClassName?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  heroImageRatio?: string;
  /**
   * Constrain section images to the template look (side 4:3, center 16:9,
   * full-width 21:9) instead of their natural size. CMS pages pass true;
   * static pages leave it false so their hand-tuned rendering is untouched.
   */
  constrainMedia?: boolean;
  children?: React.ReactNode;
}

const ModulePageLayout = ({
  pageTitle,
  pageDescription,
  coreFeatures,
  relatedModules,
  heroClassName = "bg-white",
  heroContentClassName = "py-20 text-center",
  heroImageSrc,
  heroImageAlt,
  heroImageRatio = "4:1",
  constrainMedia = false,
  children,
}: ModulePageLayoutProps) => {
  // Function to render media content. When `framed`, the image fills its
  // parent frame (caller provides relative + aspect + overflow-hidden) so
  // any source aspect renders as a neat uniform block.
  const renderMedia = (media: MediaType, framed = false, framedSizes?: string) => {
    switch (media.type) {
      case "image": {
        const src = media.src || "/images/hrsm-modules/personnel_hub.png";
        const alt = media.alt || "Feature image";
        if (framed) {
          const cls = "absolute inset-0 h-full w-full object-cover";
          if (!canOptimize(src)) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={src} alt={alt} loading="lazy" className={cls} />;
          }
          return (
            <Image
              src={src}
              alt={alt}
              fill
              sizes={framedSizes || "(max-width: 1024px) 100vw, 50vw"}
              loading="lazy"
              className="object-cover"
            />
          );
        }
        const cls = "w-full h-auto rounded-lg shadow-lg";
        if (!canOptimize(src)) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img src={src} alt={alt} loading="lazy" className={cls} />;
        }
        return (
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
            className={cls}
          />
        );
      }
      case "video": {
        const src = (media.src || "").trim();
        const embed = getVideoEmbed(src);
        if (embed) {
          return (
            <div className="w-full aspect-video overflow-hidden rounded-lg shadow-lg bg-black">
              <iframe
                src={embed.embedUrl}
                title={media.alt || embed.title}
                className="w-full h-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          );
        }
        return (
          <video
            src={src}
            controls
            className="w-full h-auto rounded-lg shadow-lg"
            poster={media.alt} // Use alt as poster if provided
          />
        );
      }
      case "icon":
        return <div className="text-5xl mb-5">{media.icon || media.src}</div>;
      default:
        return null;
    }
  };

  // Function to render feature section based on layout
  const renderFeatureSection = (feature: CoreFeature, index: number) => {
    const layout = feature.layout || "center";
    const hasMedia = !!feature.media;
    // Centered layouts must ALSO center the width-constrained paragraph:
    // without mx-auto the max-w-3xl text sticks to the left on wide screens
    // (it only *looks* centered on mobile, where the container is narrower
    // than max-w-3xl). Matches the static pages (personnel-hub, etc.).
    const centered = layout === "center" || layout === "full-width";

    const content = (
      <div
        className={
          feature.contentClassName ||
          (centered ? "flex flex-col items-center" : "")
        }
      >
        {!feature.media && feature.icon && (
          <div className="text-5xl mb-5">{feature.icon}</div>
        )}
        <h2
          className={`text-3xl font-bold text-gray-800 mb-4 ${
            feature.titleClassName || ""
          }`}
        >
          {feature.title}
        </h2>
        <p
          className={`max-w-3xl text-lg text-gray-600 leading-relaxed ${
            centered ? "mx-auto" : ""
          } ${feature.descriptionClassName || ""}`}
        >
          {feature.description}
        </p>
      </div>
    );

    const mediaElement = feature.media ? (
      <div className="flex-1">{renderMedia(feature.media)}</div>
    ) : null;

    // Template frames for constrained (CMS) images: uniform aspects per
    // layout like the leave-management reference page, whatever the source
    // file's natural size is. Videos keep their own rendering.
    const frameImage = (kind: "side" | "center" | "full") => {
      if (!constrainMedia || feature.media?.type !== "image") return null;
      const sizes =
        kind === "side"
          ? "(max-width: 1024px) 100vw, 50vw"
          : kind === "center"
            ? "(max-width: 896px) 100vw, 896px"
            : "100vw";
      const inner = renderMedia(feature.media, true, sizes);
      if (kind === "side") {
        return (
          <div className="flex-1 min-w-0">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg shadow-lg bg-slate-100">
              {inner}
            </div>
          </div>
        );
      }
      if (kind === "center") {
        return (
          <div className="w-full max-w-4xl mx-auto">
            <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg bg-slate-100">
              {inner}
            </div>
          </div>
        );
      }
      return (
        <div className="relative w-full aspect-[21/9] overflow-hidden rounded-lg shadow-lg bg-slate-100">
          {inner}
        </div>
      );
    };
    const sideMedia = frameImage("side") ?? mediaElement;
    const centerMedia = frameImage("center") ?? mediaElement;
    const fullMedia = frameImage("full") ?? mediaElement;

    switch (layout) {
      case "left-media":
        // No media: side-by-side is impossible, so honor the choice as a
        // left-aligned text block (distinct from centered).
        if (!hasMedia) {
          return (
            <div key={index} className={feature.bgColor}>
              <Container className={feature.containerClassName || "py-20"}>
                <div className="max-w-3xl">{content}</div>
              </Container>
            </div>
          );
        }
        return (
          <div key={index} className={feature.bgColor}>
            <Container className={feature.containerClassName || "py-20"}>
              <div className="flex flex-col lg:flex-row items-center gap-12">
                {sideMedia}
                <div className="flex-1">{content}</div>
              </div>
            </Container>
          </div>
        );

      case "right-media":
        // No media: mirror of left — push the text block to the right so
        // the two choices are visibly different instead of both left.
        if (!hasMedia) {
          return (
            <div key={index} className={feature.bgColor}>
              <Container className={feature.containerClassName || "py-20"}>
                <div className="max-w-3xl ml-auto">{content}</div>
              </Container>
            </div>
          );
        }
        return (
          <div key={index} className={feature.bgColor}>
            <Container className={feature.containerClassName || "py-20"}>
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                {sideMedia}
                <div className="flex-1">{content}</div>
              </div>
            </Container>
          </div>
        );

      case "full-width":
        return (
          <div key={index} className={feature.bgColor}>
            <div className={feature.containerClassName || "py-20"}>
              {fullMedia}
              <Container className="pt-12">
                <div className="text-center">{content}</div>
              </Container>
            </div>
          </div>
        );

      case "center":
      default:
        return (
          <div key={index} className={feature.bgColor}>
            <Container
              className={feature.containerClassName || "py-20 text-center"}
            >
              {centerMedia}
              {content}
            </Container>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* === Hero Section === */}
        <div className={`pt-16 ${HERO_BG_CLASS[heroClassName] || "bg-white"}`}>
          <Container className={heroContentClassName}>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              {pageTitle}
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
              {pageDescription}
            </p>
            {heroImageSrc ? (
              <div
                className={`max-w-6xl mx-auto mt-10 overflow-hidden rounded-2xl shadow-lg relative bg-slate-100 ${HERO_ASPECT_CLASS[heroImageRatio] || HERO_ASPECT_CLASS["4:1"]}`}
              >
                {canOptimize(heroImageSrc) ? (
                  <Image
                    src={heroImageSrc}
                    alt={heroImageAlt || `${pageTitle} image`}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1152px"
                    className="object-cover object-center"
                    priority
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImageSrc}
                    alt={heroImageAlt || `${pageTitle} image`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                )}
              </div>
            ) : null}
          </Container>
        </div>

        {/* === Core Features Section === */}
        <div>
          {coreFeatures.map((feature, index) =>
            renderFeatureSection(feature, index)
          )}
        </div>

        {/* === Custom Content Slot === */}
        {children}

        {/* === Related Modules Section === */}
        <RelatedModulesSection modules={relatedModules} />
      </main>

      <Footer />
    </div>
  );
};

export default ModulePageLayout;
