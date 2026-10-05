/**
 * Next.js instrumentation hook — runs once when the server boots.
 *
 * DEV ONLY: starts a tiny in-process scheduler (see
 * instrumentation-node.ts) that drains due newsletter campaigns every
 * minute, so "Pick Exact Date & Time" schedules fire on time while running
 * `npm run dev`. Vercel cron / pg_cron can't reach localhost.
 *
 * The Node-only code lives in a separate file and is imported inside the
 * NEXT_RUNTIME check so it's stripped from the Edge bundle (it uses
 * `crypto`, Resend, etc.).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startNewsletterDevPoller } = await import("./instrumentation-node");
    startNewsletterDevPoller();
  }
}
