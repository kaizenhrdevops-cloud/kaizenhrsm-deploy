-- Visual CMS pages (starts with 'about-us') + revision history.
-- Super admin only for management; public (anon) reads published rows only.
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).

CREATE TABLE IF NOT EXISTS "public"."site_pages" (
  "slug" "text" NOT NULL,
  "title" "text" NOT NULL,
  "status" "text" NOT NULL DEFAULT 'published',
  "published_doc" "jsonb" NOT NULL,
  "draft_doc" "jsonb" NOT NULL,
  "has_unpublished_changes" boolean NOT NULL DEFAULT false,
  "seo_meta_title" "text",
  "seo_meta_description" "text",
  "seo_og_image" "text",
  "draft_seo_meta_title" "text",
  "draft_seo_meta_description" "text",
  "draft_seo_og_image" "text",
  "published_at" timestamp with time zone DEFAULT "now"(),
  "last_autosaved_at" timestamp with time zone,
  "updated_by" "uuid" REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "site_pages_pkey" PRIMARY KEY ("slug"),
  CONSTRAINT "site_pages_status_check" CHECK (
    "status" = ANY (ARRAY['draft'::"text", 'published'::"text"])
  )
);

CREATE TABLE IF NOT EXISTS "public"."site_page_revisions" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "page_slug" "text" NOT NULL REFERENCES "public"."site_pages"("slug") ON DELETE CASCADE,
  "revision_number" integer NOT NULL,
  "doc" "jsonb" NOT NULL,
  "seo_meta_title" "text",
  "seo_meta_description" "text",
  "seo_og_image" "text",
  "change_summary" "text",
  "created_by" "uuid" REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "site_page_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "site_page_revisions_unique" UNIQUE ("page_slug", "revision_number")
);

CREATE INDEX IF NOT EXISTS "idx_site_page_revisions_slug_rev"
  ON "public"."site_page_revisions" USING "btree" ("page_slug", "revision_number" DESC);

DROP TRIGGER IF EXISTS "site_pages_updated_at" ON "public"."site_pages";
CREATE TRIGGER "site_pages_updated_at"
  BEFORE UPDATE ON "public"."site_pages"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE "public"."site_pages" OWNER TO "postgres";
ALTER TABLE "public"."site_page_revisions" OWNER TO "postgres";

-- RLS (initplan-safe)
ALTER TABLE "public"."site_pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."site_page_revisions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published site pages" ON "public"."site_pages";
CREATE POLICY "Public can view published site pages"
  ON "public"."site_pages"
  FOR SELECT
  TO "anon"
  USING ("status" = 'published'::"text");

DROP POLICY IF EXISTS "Super admins can manage site pages" ON "public"."site_pages";
CREATE POLICY "Super admins can manage site pages"
  ON "public"."site_pages"
  TO "authenticated"
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  );

DROP POLICY IF EXISTS "Super admins can manage site page revisions" ON "public"."site_page_revisions";
CREATE POLICY "Super admins can manage site page revisions"
  ON "public"."site_page_revisions"
  TO "authenticated"
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  );

REVOKE ALL ON TABLE "public"."site_pages" FROM "anon", "authenticated";
REVOKE ALL ON TABLE "public"."site_page_revisions" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."site_pages" TO "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."site_pages" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."site_page_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."site_pages" TO "service_role";
GRANT ALL ON TABLE "public"."site_page_revisions" TO "service_role";
