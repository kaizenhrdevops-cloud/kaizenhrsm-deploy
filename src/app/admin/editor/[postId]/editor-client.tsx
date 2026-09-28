// src/app/admin/editor/[postId]/editor-client.tsx
"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import {
  updatePostCategory,
  updatePostDetails,
  publishPost,
} from "../../posts/actions";
import { Loader2, Check } from "lucide-react";
import StepIndicator from "../components/step-indicator";
import Step1Category from "../components/step-1-category";
import Step2SEO from "../components/step-2-seo";
import Step3Content from "../components/step-3-content";
import Step4Review from "../components/step-4-review";

type Post = Database["public"]["Tables"]["posts"]["Row"];
type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];

export default function EditorClient({
  initialPost,
  initialBlocks,
}: {
  initialPost: Post;
  initialBlocks: PostBlock[];
}) {
  const router = useRouter();
  const STEPS = ["Category", "SEO", "Content", "Review"];
  const [currentStep, setCurrentStep] = useState(
    initialPost.category ? (initialPost.title !== "Untitled Post" ? 3 : 2) : 1
  );
  // Furthest step reached this session — any step up to here has been
  // visited, so the indicator lets the user jump back AND forth freely
  // (e.g. an accidental click on Step 1 never strands them there).
  const [maxStep, setMaxStep] = useState(currentStep);

  // Single choke point for step changes so maxStep never goes stale.
  const navigateTo = (step: number) => {
    setCurrentStep(step);
    setMaxStep((prev) => Math.max(prev, step));
  };
  const [post, setPost] = useState<Post>(initialPost);
  // Blocks live here (not inside Step3Content) so navigating
  // Step 3 -> Step 4 -> Back to Step 3 never loses in-memory edits.
  const [blocks, setBlocks] = useState<PostBlock[]>(initialBlocks);
  const [isSaving, setIsSaving] = useState(false);
  const [isSlugValid, setIsSlugValid] = useState(true); // To track slug validity from child
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  const getEditorContentRef = useRef<(() => any) | undefined>(undefined);
  // Step3Content registers a flush fn here so Next/Back can force-save
  // any debounced (not-yet-saved) changes before unmounting Step 3.
  const step3FlushRef = useRef<(() => Promise<boolean>) | undefined>(
    undefined
  );

  // Keep the legacy getEditorJSON accessor in sync with parent state so
  // Step 4 review always sees the latest blocks even after Step 3 unmounts.
  const blocksRefForReview = useRef(blocks);
  blocksRefForReview.current = blocks;
  if (!getEditorContentRef.current) {
    getEditorContentRef.current = () => ({
      blocks: blocksRefForReview.current,
    });
  }

  const handleSelectCategory = async (category: "blog" | "development") => {
    // Re-clicking the already-selected category (e.g. after an accidental
    // jump back to Step 1) just resumes — no redundant save, no reset to 2.
    if (post.category === category) {
      navigateTo(Math.max(2, maxStep));
      return;
    }
    setIsSaving(true);
    const result = await updatePostCategory(post.id, category);
    if (result.success) {
      setPost({ ...post, category });
      navigateTo(2);
    } else {
      toast.error(result.message || "Something went wrong.");
    }
    setIsSaving(false);
  };

  const handleNext = async () => {
    let success = false; // <-- DEFINED HERE

    // Validate Step 2 before proceeding
    if (currentStep === 2) {
      const errors: string[] = []; // <-- DEFINED HERE
      if (!post.slug || post.slug.trim() === "") {
        errors.push("URL slug is required");
      }
      if (!isSlugValid) {
        errors.push(
          "URL slug is already taken. Please choose a different one."
        );
      }
      if (!post.seo_meta_title || post.seo_meta_title.trim() === "") {
        errors.push("Meta title is required");
      }
      if (
        !post.seo_meta_description ||
        post.seo_meta_description.trim() === ""
      ) {
        errors.push("Meta description is required");
      }

      if (errors.length > 0) {
        toast.error("Please fix the following issues:\n\n" + errors.join("\n"));
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(true);

    if (currentStep === 2) {
      // Step 2 (SEO) now saves to DRAFT fields
      const result = await updatePostDetails(post.id, {
        // Update draft fields from state
        draft_title: post.title,
        draft_slug: post.slug, // <-- ADDED DRAFT SLUG
        draft_seo_meta_title: post.seo_meta_title,
        draft_seo_meta_description: post.seo_meta_description,
        draft_seo_og_image: post.seo_og_image,

        // Also update live title/slug for editor consistency
        title: post.title,
        slug: post.slug,

        // Mark as having changes
        has_unpublished_changes: true,
      });

      if (result.success) {
        navigateTo(3);
      } else {
        toast.error(result.message || "Failed to save SEO details");
      }
      success = result.success; // <-- ASSIGN VALUE
    } else if (currentStep === 3) {
      // Step 3: flush any pending debounced autosave before leaving,
      // otherwise edits made <2s before clicking Next would be lost
      // (the debounce timer was cancelled on unmount).
      try {
        const flushed = await step3FlushRef.current?.();
        if (flushed === false) {
          toast.error(
            "Autosave failed — your content is kept on screen, but please check your connection before publishing."
          );
        }
      } catch {
        toast.error("Autosave failed — your content is kept on screen.");
      }
      // In-memory blocks already live in parent state, so navigation is safe.
      navigateTo(4);
      success = true; // <-- ASSIGN VALUE
    } else if (currentStep === 4) {
      // Step 4 (Review) logic stays the same
      const result = await publishPost(post.id);
      if (result.success) {
        toast.success("Post published successfully!");
        router.push("/admin/blog");
      } else {
      toast.error(result.message);
      }
      success = result.success; // <-- ASSIGN VALUE
    } else {
      navigateTo(currentStep + 1);
      success = true; // <-- ASSIGN VALUE
    }

    setIsSaving(false);
  };

  const goToStep = (step: number) => {
    // Any visited step (not just earlier ones) is reachable — forward jumps
    // only ever land where the user has already been (step <= maxStep).
    if (step <= maxStep && step !== currentStep) {
      void handleStepChange(step);
    }
  };

  // Centralised step change so Back navigation from Step 3 also flushes
  // pending autosaves (same data-loss bug as Next).
  const handleStepChange = async (step: number) => {
    if (currentStep === 3 && step !== 3 && step3FlushRef.current) {
      setAutoSaveStatus("saving");
      try {
        await step3FlushRef.current();
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("idle");
        toast.error("Autosave failed — your latest edits may not be saved.");
        // Still navigate: in-memory parent state keeps the content on screen.
      }
    }
    navigateTo(step);
  };

  const handleBack = () => {
    void handleStepChange(currentStep - 1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          setStep={goToStep}
          totalSteps={STEPS.length}
          maxReachableStep={maxStep}
        />
      </div>

      <div className="flex-grow">
        {currentStep === 1 && (
          <Step1Category
            onSelectCategory={handleSelectCategory}
            isSaving={isSaving}
            currentCategory={post.category as "blog" | "development" | null}
            onContinue={() => navigateTo(Math.max(2, maxStep))}
            continueLabel={
              maxStep > 1
                ? `Continue editing at Step ${maxStep}: ${STEPS[maxStep - 1]}`
                : undefined
            }
          />
        )}
        {currentStep === 2 && (
          <Step2SEO
            post={post}
            setPost={setPost}
            onValidationChange={setIsSlugValid}
          />
        )}
        {currentStep === 3 && (
          <Step3Content
            post={post}
            setPost={setPost}
            blocks={blocks}
            setBlocks={setBlocks}
            getEditorJSON={getEditorContentRef as any}
            setAutoSaveStatus={setAutoSaveStatus}
            flushRef={step3FlushRef as any}
          />
        )}
        {currentStep === 4 && (
          <Step4Review
            post={post}
            blocks={blocks}
            onEditStep={(step) => void handleStepChange(step)}
          />
        )}
      </div>

      {currentStep > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex  justify-end items-center gap-3">
          {/* --- ADDED: AUTOSAVE STATUS --- */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentStep === 3 && (
              <div className="flex items-center gap-2">
                {autoSaveStatus === "saving" && (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                )}
                {autoSaveStatus === "saved" && (
                  <>
                    <Check size={16} className="text-green-500" />
                    Saved
                  </>
                )}
              </div>
            )}
          </div>
          {/* --- END OF ADDED STATUS --- */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleBack}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Back
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={isSaving || (currentStep === 2 && !isSlugValid)}
            className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
              currentStep === STEPS.length
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSaving
              ? "Saving..."
              : currentStep === STEPS.length
                ? "Publish Now"
                : "Next Step"}
          </button>
        </div>
      )}
    </div>
  );
}
