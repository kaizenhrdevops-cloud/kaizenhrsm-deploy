import type { Metadata } from "next";
import PostListingPage from "@/components/blog/PostListingPage";

export const metadata: Metadata = {
  title: "Developments | KaizenHR",
  description:
    "Discover our latest module releases, technological milestones, and platform enhancements designed for modern HR.",
};

export default function DevelopmentsPage() {
  return (
    <PostListingPage
      category="development"
      title="Developments"
      basePath="/company/developments"
      emptyMessage="There are no development updates published yet. Check back soon!"
      emptyActionHref="/company/contact-us"
      emptyActionLabel="Contact Us"
    />
  );
}
