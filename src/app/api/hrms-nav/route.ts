import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceClient();

    // Fetch published modules directly ordered by order_index
    const { data: rawModules, error } = await supabase
      .from("hrms_modules")
      .select("slug, name, tagline, icon_name, nav_description, order_index")
      .eq("status", "published")
      .order("order_index", { ascending: true });

    if (error || !rawModules) {
      return NextResponse.json({ modules: [] }, { status: 200 });
    }

    // Secondary fallback: fetch custom order from system_settings if order_index is unassigned
    const { data: orderSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "hrms_module_order")
      .maybeSingle();

    let orderedSlugs: string[] = [];
    if (orderSetting?.value) {
      try {
        orderedSlugs = Array.isArray(orderSetting.value)
          ? (orderSetting.value as string[])
          : JSON.parse(orderSetting.value as string);
      } catch {
        orderedSlugs = [];
      }
    }

    // Sort modules: prioritize order_index if set; otherwise use orderedSlugs
    const sorted = [...rawModules].sort((a, b) => {
      const idxA = typeof a.order_index === "number" ? a.order_index : 9999;
      const idxB = typeof b.order_index === "number" ? b.order_index : 9999;
      if (idxA !== idxB) return idxA - idxB;

      const slugIdxA = orderedSlugs.indexOf(a.slug);
      const slugIdxB = orderedSlugs.indexOf(b.slug);
      const posA = slugIdxA !== -1 ? slugIdxA : 9999;
      const posB = slugIdxB !== -1 ? slugIdxB : 9999;
      if (posA !== posB) return posA - posB;
      return a.name.localeCompare(b.name);
    });

    const modules = sorted.map((m, idx) => ({
      slug: m.slug,
      name: m.name,
      tagline: m.tagline ?? "",
      icon_name: m.icon_name ?? "",
      nav_description: m.nav_description ?? "",
      order_index: idx,
    }));

    return NextResponse.json(
      { modules },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
        },
      }
    );
  } catch {
    return NextResponse.json({ modules: [] }, { status: 200 });
  }
}
