-- Top-level public navbar management (6 canonical items, no new items allowed).
-- Run in Supabase Dashboard → SQL Editor (or `supabase db push`).

CREATE TABLE IF NOT EXISTS "public"."navbar_items" (
  "key" "text" NOT NULL,
  "label" "text" NOT NULL,
  "item_type" "text" NOT NULL,
  "href" "text",
  "dropdown_key" "text",
  "footer_section" "text",
  "order_index" integer NOT NULL DEFAULT 0,
  "is_visible" boolean NOT NULL DEFAULT true,
  "deleted_at" timestamp with time zone,
  "deleted_by" "uuid" REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "navbar_items_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "navbar_items_key_check" CHECK (
    "key" = ANY (ARRAY[
      'hrms'::"text",
      'resources'::"text",
      'blog-articles'::"text",
      'developments'::"text",
      'careers'::"text",
      'company'::"text"
    ])
  ),
  CONSTRAINT "navbar_items_label_not_empty" CHECK (char_length(btrim("label")) BETWEEN 1 AND 40),
  CONSTRAINT "navbar_items_type_check" CHECK (
    "item_type" = ANY (ARRAY['link'::"text", 'dropdown'::"text"])
  ),
  CONSTRAINT "navbar_items_dropdown_key_check" CHECK (
    "dropdown_key" IS NULL
    OR "dropdown_key" = ANY (ARRAY['hrms'::"text", 'resources'::"text", 'company'::"text"])
  ),
  CONSTRAINT "navbar_items_footer_section_check" CHECK (
    "footer_section" IS NULL
    OR "footer_section" = ANY (ARRAY['hrms'::"text", 'resources'::"text", 'company'::"text"])
  ),
  CONSTRAINT "navbar_items_type_target_check" CHECK (
    ("item_type" = 'link' AND "href" IS NOT NULL AND "dropdown_key" IS NULL)
    OR ("item_type" = 'dropdown' AND "dropdown_key" IS NOT NULL AND "href" IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS "idx_navbar_items_active_order"
  ON "public"."navbar_items" USING "btree" ("order_index")
  WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_navbar_items_deleted_at"
  ON "public"."navbar_items" USING "btree" ("deleted_at")
  WHERE ("deleted_at" IS NOT NULL);

-- Reuse the existing generic updated_at trigger function.
DROP TRIGGER IF EXISTS "navbar_items_updated_at" ON "public"."navbar_items";
CREATE TRIGGER "navbar_items_updated_at"
  BEFORE UPDATE ON "public"."navbar_items"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE "public"."navbar_items" OWNER TO "postgres";

-- RLS (initplan-safe: auth.uid() wrapped in sub-selects)
-- Intentionally NO INSERT policy for authenticated users — new menus cannot be added.
ALTER TABLE "public"."navbar_items" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active navbar items" ON "public"."navbar_items";
CREATE POLICY "Public can view active navbar items"
  ON "public"."navbar_items"
  FOR SELECT
  TO "anon"
  USING (("is_visible" = true) AND ("deleted_at" IS NULL));

DROP POLICY IF EXISTS "Authenticated users can view active navbar items" ON "public"."navbar_items";
CREATE POLICY "Authenticated users can view active navbar items"
  ON "public"."navbar_items"
  FOR SELECT
  TO "authenticated"
  USING (("is_visible" = true) AND ("deleted_at" IS NULL));

DROP POLICY IF EXISTS "Super admins can view all navbar items" ON "public"."navbar_items";
CREATE POLICY "Super admins can view all navbar items"
  ON "public"."navbar_items"
  FOR SELECT
  TO "authenticated"
  USING (
    EXISTS (
      SELECT 1
      FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  );

DROP POLICY IF EXISTS "Super admins can update navbar items" ON "public"."navbar_items";
CREATE POLICY "Super admins can update navbar items"
  ON "public"."navbar_items"
  FOR UPDATE
  TO "authenticated"
  USING (
    EXISTS (
      SELECT 1
      FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  );

DROP POLICY IF EXISTS "Super admins can delete navbar items" ON "public"."navbar_items";
CREATE POLICY "Super admins can delete navbar items"
  ON "public"."navbar_items"
  FOR DELETE
  TO "authenticated"
  USING (
    EXISTS (
      SELECT 1
      FROM "public"."profiles"
      WHERE "profiles"."id" = (select "auth"."uid"())
        AND "profiles"."status" = 'active'::"text"
        AND "profiles"."role" = 'super_admin'::"text"
    )
  );

-- Explicit minimal grants (authenticated cannot INSERT new menus).
REVOKE ALL ON TABLE "public"."navbar_items" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."navbar_items" TO "anon";
GRANT SELECT, UPDATE, DELETE ON TABLE "public"."navbar_items" TO "authenticated";
GRANT ALL ON TABLE "public"."navbar_items" TO "service_role";

-- Seed the 6 canonical top-level navbar items (idempotent).
INSERT INTO "public"."navbar_items"
  ("key", "label", "item_type", "href", "dropdown_key", "footer_section", "order_index", "is_visible")
VALUES
  ('hrms', 'HRMS', 'dropdown', NULL, 'hrms', 'hrms', 0, true),
  ('resources', 'Resources', 'dropdown', NULL, 'resources', 'resources', 1, true),
  ('blog-articles', 'Blog & Articles', 'link', '/resources/blog-articles', NULL, NULL, 2, true),
  ('developments', 'Developments', 'link', '/company/developments', NULL, NULL, 3, true),
  ('careers', 'Careers', 'link', '/company/careers', NULL, NULL, 4, true),
  ('company', 'Company', 'dropdown', NULL, 'company', 'company', 5, true)
ON CONFLICT ("key") DO NOTHING;
