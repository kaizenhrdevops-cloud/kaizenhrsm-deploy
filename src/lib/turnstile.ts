/**
 * Shared Cloudflare Turnstile verification (server-only).
 * Replaces the per-route copies. Returns true when Cloudflare
 * confirms the token.
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
    return data.success === true;
  } catch {
    return false;
  }
}
