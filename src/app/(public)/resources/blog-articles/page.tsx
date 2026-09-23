import type { Metadata } from "next";
import PostListingPage from "@/components/blog/PostListingPage";

export const metadata: Metadata = {
  title: "Blog & Articles | KaizenHR",
  description:
    "Explore HR trends, payroll best practices, workplace compliance, and software insights to elevate your organization.",
};

export default function BlogArticlesPage() {
  return (
    <PostListingPage
      category="blog"
      title="Blog & Articles"
      basePath="/resources/blog-articles"
      emptyMessage="There are no blog articles published yet. Check back soon!"
      emptyActionHref="/company/contact-us"
      emptyActionLabel="Contact Us"
    />
  );
}