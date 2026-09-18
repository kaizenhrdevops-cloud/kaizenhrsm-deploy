-- Add a separate card/thumbnail image field so modules can have a
-- related-modules card image without needing a hero banner.
-- Falls back to image_src when empty.

ALTER TABLE "public"."hrms_modules"
  ADD COLUMN IF NOT EXISTS "card_image_src" "text" NOT NULL DEFAULT '';
