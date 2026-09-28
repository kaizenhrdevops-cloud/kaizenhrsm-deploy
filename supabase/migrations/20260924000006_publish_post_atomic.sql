-- Atomic publish: swap a post's live blocks + flip its draft fields in ONE
-- transaction. The old app code did delete-blocks -> insert-blocks ->
-- update-post as three round trips, so a failure mid-way left a published
-- post with zero content. Now all-or-nothing.
--
-- Republish keeps the ORIGINAL published_at (COALESCE): previously every
-- publish stamped now(), destroying dates, sort order, and SEO signals.
-- Only service_role may call it (revoked from anon/authenticated/PUBLIC);
-- the app authorizes staff before invoking.

CREATE OR REPLACE FUNCTION "public"."publish_post_atomic"(
  "p_post_id" "uuid",
  "p_title" "text",
  "p_slug" "text",
  "p_excerpt" "text",
  "p_featured_image" "text",
  "p_featured_image_alt" "text",
  "p_seo_meta_title" "text",
  "p_seo_meta_description" "text",
  "p_seo_og_image" "text",
  "p_blocks" "jsonb",
  "p_updated_by" "uuid"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
  blk "jsonb";
  idx INT := 0;
BEGIN
  -- 1. Drop the current live blocks.
  DELETE FROM "public"."post_blocks" WHERE "post_id" = "p_post_id";

  -- 2. Insert the draft blocks with fresh ordering.
  FOR blk IN SELECT * FROM jsonb_array_elements(COALESCE("p_blocks", '[]'::"jsonb"))
  LOOP
    INSERT INTO "public"."post_blocks" ("post_id", "type", "content", "order_index")
    VALUES ("p_post_id", blk->>'type', blk->'content', idx);
    idx := idx + 1;
  END LOOP;

  -- 3. Flip draft -> live. Any failure above rolls ALL of this back.
  UPDATE "public"."posts" SET
    "status" = 'published',
    "published_at" = COALESCE("published_at", NOW()),
    "title" = "p_title",
    "slug" = "p_slug",
    "excerpt" = "p_excerpt",
    "featured_image" = "p_featured_image",
    "featured_image_alt" = "p_featured_image_alt",
    "seo_meta_title" = "p_seo_meta_title",
    "seo_meta_description" = "p_seo_meta_description",
    "seo_og_image" = "p_seo_og_image",
    "has_unpublished_changes" = false,
    "draft_title" = NULL,
    "draft_slug" = NULL,
    "draft_excerpt" = NULL,
    "draft_featured_image" = NULL,
    "draft_featured_image_alt" = NULL,
    "draft_seo_meta_title" = NULL,
    "draft_seo_meta_description" = NULL,
    "draft_seo_og_image" = NULL,
    "draft_blocks" = NULL,
    "updated_by" = "p_updated_by"
  WHERE "id" = "p_post_id";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post % not found', "p_post_id";
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION "public"."publish_post_atomic"("uuid", "text", "text", "text", "text", "text", "text", "text", "text", "jsonb", "uuid") FROM "anon", "authenticated", "public";

-- Contact admin notifications become first-class logged sends (the contact
-- route now logs both mails; previously only the user mail was logged).
ALTER TABLE "public"."email_send_log"
  DROP CONSTRAINT IF EXISTS "email_send_log_email_type_check",
  ADD CONSTRAINT "email_send_log_email_type_check" CHECK (
    "email_type" = ANY (ARRAY[
      'contact_reply'::"text",
      'subscriber_verification'::"text",
      'newsletter_test'::"text",
      'password_reset'::"text",
      'contact_notification'::"text"
    ])
  );
