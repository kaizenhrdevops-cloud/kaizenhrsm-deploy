-- HRMS module CMS: tables + RLS. Content seed lives in the follow-up
-- migration (20260912120001_hrms_seed.sql). Reads mirror the posts model:
-- public reads published rows, authenticated admins manage everything.

CREATE TABLE IF NOT EXISTS "public"."hrms_modules" (
  "slug" "text" NOT NULL,
  "name" "text" NOT NULL,
  "tagline" "text" NOT NULL DEFAULT '',
  "image_src" "text" NOT NULL DEFAULT '',
  "outro_text" "text",
  "status" "text" NOT NULL DEFAULT 'draft',
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "hrms_modules_pkey" PRIMARY KEY ("slug"),
  CONSTRAINT "hrms_modules_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."hrms_features" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "module_slug" "text" NOT NULL REFERENCES "public"."hrms_modules"("slug") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" "text" NOT NULL DEFAULT '',
  "description" "text" NOT NULL DEFAULT '',
  "layout" "text" NOT NULL DEFAULT 'center',
  "media_type" "text" NOT NULL DEFAULT 'none',
  "media_src" "text" NOT NULL DEFAULT '',
  "media_alt" "text" NOT NULL DEFAULT '',
  "bg_color" "text" NOT NULL DEFAULT 'bg-white',
  "order_index" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "hrms_features_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_features_layout_check" CHECK (("layout" = ANY (ARRAY['center'::"text", 'left-media'::"text", 'right-media'::"text", 'full-width'::"text"]))),
  CONSTRAINT "hrms_features_media_type_check" CHECK (("media_type" = ANY (ARRAY['none'::"text", 'image'::"text", 'video'::"text"])))
);

CREATE INDEX IF NOT EXISTS "idx_hrms_features_module_order" ON "public"."hrms_features" USING "btree" ("module_slug", "order_index");
CREATE INDEX IF NOT EXISTS "idx_hrms_modules_status" ON "public"."hrms_modules" USING "btree" ("status");

-- Reuse the generic updated_at trigger (search_path already pinned).
DROP TRIGGER IF EXISTS "hrms_modules_updated_at" ON "public"."hrms_modules";
CREATE TRIGGER "hrms_modules_updated_at" BEFORE UPDATE ON "public"."hrms_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
DROP TRIGGER IF EXISTS "hrms_features_updated_at" ON "public"."hrms_features";
CREATE TRIGGER "hrms_features_updated_at" BEFORE UPDATE ON "public"."hrms_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE "public"."hrms_modules" OWNER TO "postgres";
ALTER TABLE "public"."hrms_features" OWNER TO "postgres";

-- RLS (initplan-safe: auth.uid() wrapped in sub-selects) --
ALTER TABLE "public"."hrms_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."hrms_features" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published modules" ON "public"."hrms_modules";
CREATE POLICY "Public can view published modules" ON "public"."hrms_modules" FOR SELECT TO "anon" USING (("status" = 'published'::"text"));

DROP POLICY IF EXISTS "Admins can manage hrms modules" ON "public"."hrms_modules";
CREATE POLICY "Admins can manage hrms modules" ON "public"."hrms_modules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

DROP POLICY IF EXISTS "Public can view published module features" ON "public"."hrms_features";
CREATE POLICY "Public can view published module features" ON "public"."hrms_features" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."hrms_modules" AS "m"
  WHERE (("m"."slug" = "hrms_features"."module_slug") AND ("m"."status" = 'published'::"text")))));

DROP POLICY IF EXISTS "Admins can manage hrms features" ON "public"."hrms_features";
CREATE POLICY "Admins can manage hrms features" ON "public"."hrms_features" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = (select "auth"."uid"())) AND ("profiles"."status" = 'active'::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));

GRANT ALL ON TABLE "public"."hrms_modules" TO "anon";
GRANT ALL ON TABLE "public"."hrms_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."hrms_modules" TO "service_role";
GRANT ALL ON TABLE "public"."hrms_features" TO "anon";
GRANT ALL ON TABLE "public"."hrms_features" TO "authenticated";
GRANT ALL ON TABLE "public"."hrms_features" TO "service_role";
