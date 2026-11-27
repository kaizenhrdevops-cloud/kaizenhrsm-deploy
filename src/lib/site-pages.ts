// src/lib/site-pages.ts
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/supabase-admin";
import { PUBLIC_PAGES_TAG } from "@/lib/cache-tags";
import {
  DEFAULT_ABOUT_SEO,
  DEFAULT_ABOUT_US_DOC,
  normalizeFreeformDocument,
  type FreeformDocument,
  type PageSeoMetadata,
} from "@/data/about-us-defaults";

export type PublishedSitePage = {
  slug: string;
  title: string;
  doc: FreeformDocument;
  seo: PageSeoMetadata;
  updatedAt: string | null;
};

const fetchPublishedSitePage = unstable_cache(
  async (slug: string): Promise<PublishedSitePage | null> => {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("site_pages")
      .select(
        "slug, title, status, published_doc, seo_meta_title, seo_meta_description, seo_og_image, updated_at"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      slug: data.slug,
      title: data.title,
      doc: normalizeFreeformDocument(data.published_doc),
      seo: {
        metaTitle: data.seo_meta_title || DEFAULT_ABOUT_SEO.metaTitle,
        metaDescription:
          data.seo_meta_description || DEFAULT_ABOUT_SEO.metaDescription,
        ogImage: data.seo_og_image || DEFAULT_ABOUT_SEO.ogImage,
      },
      updatedAt: data.updated_at,
    };
  },
  ["public-site-page"],
  { revalidate: 3600, tags: [PUBLIC_PAGES_TAG] }
);

/**
 * Request-memoized published page loader. Safely falls back to the built-in
 * About Us canvas template before the migration is run or if no row exists yet.
 */
export const getPublishedAboutPage = cache(
  async function getPublishedAboutPage(): Promise<PublishedSitePage> {
    try {
      const page = await fetchPublishedSitePage("about-us");
      if (page) return page;
    } catch (err) {
      console.error(
        "Failed to load site_pages['about-us'], falling back to default:",
        err
      );
    }

    return {
      slug: "about-us",
      title: "About Us",
      doc: DEFAULT_ABOUT_US_DOC,
      seo: DEFAULT_ABOUT_SEO,
      updatedAt: null,
    };
  }
);
