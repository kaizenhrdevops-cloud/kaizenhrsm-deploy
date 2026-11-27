import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FreeformPageRenderer from "@/components/page-builder/FreeformPageRenderer";
import { getPublicSettings } from "@/lib/public-settings";
import { getPublishedAboutPage } from "@/lib/site-pages";
import { buildTokenContext } from "@/data/about-us-defaults";

// Matches the 1-hour cache on the published page loader. Publish revalidates
// both the PUBLIC_PAGES_TAG cache entry and this path immediately.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedAboutPage();
  const title = page.seo.metaTitle || page.title || "About Us";
  const description =
    page.seo.metaDescription ||
    "From a pioneering idea to Malaysia's most comprehensive HR solution.";
  const ogImage = page.seo.ogImage || "/images/hrsm-modules/mobile_app.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/company/about-us",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function AboutUsPage() {
  const [page, settings] = await Promise.all([
    getPublishedAboutPage(),
    getPublicSettings().catch(() => ({})),
  ]);

  const tokenCtx = buildTokenContext(settings);

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />

      {/* The canvas hero starts at the page top: the fixed 80px navbar sits
          over the gradient, and element Y positions already account for it. */}
      <main>
        <FreeformPageRenderer doc={page.doc} tokenCtx={tokenCtx} />
      </main>

      <Footer />
    </div>
  );
}
