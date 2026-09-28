// src/app/admin/editor/components/step-1-category.tsx
"use client";
import { ArrowRight, Check, FileText, Rocket } from "lucide-react";

type Step1CategoryProps = {
  onSelectCategory: (category: "blog" | "development") => void;
  isSaving: boolean;
  // Set when the post already has a category (e.g. user clicked back to
  // Step 1 by accident) — the step then offers a way back instead of
  // forcing a re-pick.
  currentCategory?: "blog" | "development" | null;
  onContinue?: () => void;
  continueLabel?: string;
};

export default function Step1Category({
  onSelectCategory,
  isSaving,
  currentCategory = null,
  onContinue,
  continueLabel,
}: Step1CategoryProps) {
  const hasCategory = currentCategory === "blog" || currentCategory === "development";

  const handleCardClick = (category: "blog" | "development") => {
    // Re-picking the active category just resumes editing.
    if (hasCategory && category === currentCategory) {
      onContinue?.();
    } else {
      onSelectCategory(category);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {hasCategory ? "Post Category" : "Choose Post Category"}
            </h2>
            {hasCategory && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Check size={13} strokeWidth={3} />
                {currentCategory === "blog" ? "Blog Post" : "Development Update"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {hasCategory
              ? "You already picked a category — switch type, or jump straight back to where you left off."
              : "Select the type of content you want to create. This cannot be changed later."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blog Post Option */}
          <button
            onClick={() => handleCardClick("blog")}
            disabled={isSaving}
            aria-pressed={currentCategory === "blog"}
            className={`group relative border rounded-lg bg-white dark:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
              currentCategory === "blog"
                ? "border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/30 dark:ring-blue-500/30"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
            }`}
          >
            {/* Hover Background Effect */}
            <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {currentCategory === "blog" && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <Check size={12} strokeWidth={3} />
                Current
              </span>
            )}

            {/* Content */}
            <div className="relative p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">
                Blog Post
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left leading-relaxed">
                Write an article, share news, or publish insights for your
                audience.
              </p>

              {/* Feature List */}
              <ul className="mt-4 space-y-2 text-left">
                <li className="flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  <span>Articles and thought leadership</span>
                </li>
                <li className="flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  <span>Company news and updates</span>
                </li>
                <li className="flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  <span>Industry insights</span>
                </li>
              </ul>
            </div>
          </button>

          {/* Development Update Option */}
          <button
            onClick={() => handleCardClick("development")}
            disabled={isSaving}
            aria-pressed={currentCategory === "development"}
            className={`group relative border rounded-lg bg-white dark:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
              currentCategory === "development"
                ? "border-purple-600 dark:border-purple-500 ring-2 ring-purple-600/30 dark:ring-purple-500/30"
                : "border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500"
            }`}
          >
            {/* Hover Background Effect */}
            <div className="absolute inset-0 bg-purple-50 dark:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {currentCategory === "development" && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <Check size={12} strokeWidth={3} />
                Current
              </span>
            )}

            {/* Content */}
            <div className="relative p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 mb-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-left">
                Development Update
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left leading-relaxed">
                Announce new features, bug fixes, or updates to your product.
              </p>

              {/* Feature List */}
              <ul className="mt-4 space-y-2 text-left">
                <li className="flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  <span>Product releases</span>
                </li>
                {/* <li className="flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  <span>Bug fixes and improvements</span>
                </li> */}
                <li className="flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">•</span>
                  <span>Technical announcements</span>
                </li>
              </ul>
            </div>
          </button>
        </div>

        {/* Way back for accidental visits — no re-pick required */}
        {hasCategory && onContinue && (
          <button
            onClick={onContinue}
            disabled={isSaving}
            className="mt-6 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {continueLabel ?? "Continue editing"}
            <ArrowRight size={16} />
          </button>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> The category affects how your post appears in
            navigation and determines the URL structure.{" "}
            {hasCategory
              ? "Switching type keeps your saved details and content intact."
              : "Choose carefully as this cannot be changed later."}
          </p>
        </div>
      </div>
    </div>
  );
}
