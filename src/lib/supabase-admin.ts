import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let serviceClient: SupabaseClient<Database> | null = null;

/**
 * Shared service-role Supabase client (server-only).
 * Bypasses RLS — never import this in client components.
 * Replaces the copies of `createClient(URL, SUPABASE_SERVICE_ROLE_KEY)`
 * scattered across API routes and server actions.
 */
export function getServiceClient(): SupabaseClient<Database> {
  if (!serviceClient) {
    serviceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return serviceClient;
}
