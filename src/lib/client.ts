import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Shared browser Supabase client (singleton).
 * Replaces the 13+ copies of `createBrowserClient(URL, ANON_KEY)`
 * scattered across components. Safe to call during render.
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

/** @deprecated Use getBrowserClient() instead. */
export function createClient() {
  return getBrowserClient();
}
