/**
 * Shared Cloudflare Turnstile verification (server-only).
 * Replaces the per-route copies. Returns true when Cloudflare
 * confirms the token *for our own hostname* — without the hostname
 * check, a token solved for any other site sharing the secret scope
 * would be accepted here.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );
    const data = await response.json();
    if (data.success !== true) {
      // Log Cloudflare's reason server-side (never exposed to clients):
      // invalid-input-secret, invalid-input-response, timeout-or-duplicate,
      // hostname-mismatch, etc. This is the fastest way to diagnose setup
      // mistakes (mismatched key pairs, unlisted domains).
      console.error(
        "Turnstile verification failed:",
        JSON.stringify(data["error-codes"] ?? data)
      );
      return false;
    }

    // Bind the token to our own domain (compare without leading www.
    // so apex/www visits don't false-reject). Skipped when the site URL
    // isn't configured — never fail closed on our own misconfiguration
    // here; the token itself is still Cloudflare-verified above.
    const expectedHost = canonicalHost(process.env.NEXT_PUBLIC_SITE_URL);
    const tokenHost =
      typeof data.hostname === "string" ? canonicalHost(data.hostname) : "";
    if (expectedHost && tokenHost && tokenHost !== expectedHost) {
      console.warn(
        `Turnstile hostname mismatch: token for "${tokenHost}", expected "${expectedHost}".`
      );
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function canonicalHost(value: string | undefined): string {
  if (!value) return "";
  try {
    const host = value.includes("://") ? new URL(value).hostname : value;
    return host.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
