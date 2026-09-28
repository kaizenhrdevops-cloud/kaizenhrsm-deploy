// DB-backed sliding-window rate limiter.
//
// Vercel Hobby is stateless (fresh/isolated memory per instance), so an
// in-memory limiter would silently not limit. A tiny table works on
// Supabase free tier and is shared across all instances.
//
// Fail-open: if the table/DB is unreachable, requests are allowed — the
// caller’s own checks (Turnstile, per-email cooldowns) still apply, and
// the subscribe flow needs the DB anyway.

import { createHash } from "crypto";
import { getServiceClient } from "./supabase-admin";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 64);
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const hashed = hashKey(key);
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  try {
    const supabase = getServiceClient();

    // Prune this key's expired attempts (keeps the table tiny on free tier).
    await supabase
      .from("abuse_attempts")
      .delete()
      .eq("key", hashed)
      .lt("created_at", windowStart);

    const { data, count, error } = await supabase
      .from("abuse_attempts")
      .select("created_at", { count: "exact" })
      .eq("key", hashed)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(limit + 1);

    if (error) throw error;

    if ((count ?? 0) >= limit) {
      const oldest = data?.[0]?.created_at
        ? new Date(data[0].created_at).getTime()
        : Date.now();
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + windowMs - Date.now()) / 1000)
      );
      return { allowed: false, retryAfterSeconds };
    }

    await supabase.from("abuse_attempts").insert({ key: hashed });
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error("Rate-limit check failed (fail-open):", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
