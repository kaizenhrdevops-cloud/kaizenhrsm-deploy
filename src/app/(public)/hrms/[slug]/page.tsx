// src/app/(public)/hrms/[slug]/page.tsx
//
// CMS-driven HRMS module pages. Reads hrms_modules + hrms_features
// (published only, via RLS) and renders through ModulePageLayout.
//
// All static page folders have been removed — every /hrms/* route is now
// served by this dynamic route from the Supabase CMS database.

import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import ModulePageLayout from "@/components/layout/ModulePageLayout";
import Container from "@/components/layout/Container";

export const revalidate = 3600;

/** Module shape used by RelatedModulesSection. */
type RelatedModule = {
  name: string;
  description: string;
  link: string;
  imageSrc: string;
};

let cachedPublicClient: ReturnType<typeof createClient<Database>> | null = null;
function publicClient() {
  if (!cachedPublicClient) {
    cachedPublicClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return cachedPublicClient;
}

/**
 * Cached published module fetcher (deduplicated per-request via React cache).
 * Prevents generateMetadata and the page render from executing duplicate DB queries.
 */
const getPublishedModule = cache(async (slug: string) => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("hrms_modules")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
});

type FeatureRow = {
  title: string;
  description: string;
  layout: string;
  media_type: string;
  media_src: string;
  media_alt: string;
  bg_color: string;
  order_index: number;
};

export async function generateStaticParams() {
  try {
    const supabase = publicClient();
    const { data } = await supabase
      .from("hrms_modules")
      .select("slug")
      .eq("status", "published");
    return ((data || []) as { slug: string }[]).map((m) => ({ slug: m.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hrmsModule = await getPublishedModule(slug);

  if (!hrmsModule) return { title: "HRMS Module | KaizenHR" };
  return {
    title: `${hrmsModule.name} | KaizenHR`,
    description: hrmsModule.tagline || undefined,
  };
}

/** Preserved CTA banner from the old static leave-management page. */
function LeaveManagementCTA() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-8">
            Ready to Transform Your Leave Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies that have streamlined their HR processes
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Request Demo
          </button>
        </div>
      </div>
    </div>
  );
}

export default async function HrmsModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hrmsModule = await getPublishedModule(slug);

  // Unknown slug or draft -> 404 (drafts preview via /admin/hrms instead).
  if (!hrmsModule) notFound();

  const supabase = publicClient();
  const { data: features } = await supabase
    .from("hrms_features")
    .select(
      "title, description, layout, media_type, media_src, media_alt, bg_color, order_index"
    )
    .eq("module_slug", slug)
    .order("order_index", { ascending: true });

  const { data: allModules } = await supabase
    .from("hrms_modules")
    .select("slug, name, tagline, image_src")
    .eq("status", "published")
    .order("slug", { ascending: true });

  const coreFeatures = ((features || []) as FeatureRow[]).map((f) => ({
    title: f.title,
    description: f.description,
    bgColor: f.bg_color || "bg-white",
    layout: (f.layout || "center") as
      | "center"
      | "left-media"
      | "right-media"
      | "full-width",
    ...(f.media_type === "image"
      ? { media: { type: "image" as const, src: f.media_src, alt: f.media_alt } }
      : {}),
    ...(f.media_type === "video"
      ? { media: { type: "video" as const, src: f.media_src, alt: f.media_alt } }
      : {}),
  }));

  const relatedPool: RelatedModule[] = (allModules || []).map((m) => ({
    name: m.name,
    description: m.tagline,
    link: `/hrms/${m.slug}`,
    imageSrc: m.image_src,
  }));
  // Deterministic "next 4" (no random hydration mismatch like the old
  // client-side getRandomModules).
  const startAt = Math.max(
    0,
    relatedPool.findIndex((m) => m.link === `/hrms/${slug}`)
  );
  const others = relatedPool.filter((m) => m.link !== `/hrms/${slug}`);
  const relatedModules = [
    ...others.slice(startAt),
    ...others.slice(0, startAt),
  ].slice(0, 4);

  // ?? guards pre-migration rows where the columns don't exist yet.
  const heroImageRatio =
    (hrmsModule as { image_ratio?: string }).image_ratio ?? "4:1";
  const heroBg = (hrmsModule as { hero_bg?: string }).hero_bg ?? "bg-white";

  return (
    <ModulePageLayout
      pageTitle={hrmsModule.name}
      pageDescription={hrmsModule.tagline}
      heroClassName={heroBg}
      heroImageSrc={hrmsModule.image_src || undefined}
      heroImageAlt={hrmsModule.name}
      heroImageRatio={heroImageRatio}
      coreFeatures={coreFeatures}
      relatedModules={relatedModules}
      constrainMedia
    >
      {/* Slug-specific custom sections */}
      {slug === "leave-management" && <LeaveManagementCTA />}

      {hrmsModule.outro_text ? (
        <div className="bg-slate-100">
          <Container className="py-20 text-center">
            <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
              {hrmsModule.outro_text}
            </p>
          </Container>
        </div>
      ) : null}
    </ModulePageLayout>
  );
}
