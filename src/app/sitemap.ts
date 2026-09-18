import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com";

const STATIC_ROUTES = [
  "/",
  "/company/about-us",
  "/company/contact-us",
  "/company/careers",
  "/company/developments",
  "/resources/blog-articles",
  "/resources/hr-checklist",
  "/resources/labour-law",
];

// HRMS module URLs come from the CMS (published only). Static page files,
// where they still exist, serve the same URLs — see docs/hrms-cms.md.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: posts } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .in("category", ["blog", "development"])
      .limit(500);

    const postEntries: MetadataRoute.Sitemap = (posts || [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE_URL}/resources/blog-articles/${p.slug}`,
        lastModified: p.updated_at
          ? new Date(p.updated_at)
          : p.published_at
            ? new Date(p.published_at)
            : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      }));

    const { data: modules } = await supabase
      .from("hrms_modules")
      .select("slug, updated_at")
      .eq("status", "published")
      .limit(100);

    const moduleEntries: MetadataRoute.Sitemap = (modules || [])
      .filter((m) => m.slug)
      .map((m) => ({
        url: `${SITE_URL}/hrms/${m.slug}`,
        lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [...staticEntries, ...postEntries, ...moduleEntries];
  } catch {
    return staticEntries;
  }
}
