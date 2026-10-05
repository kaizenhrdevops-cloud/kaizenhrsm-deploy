/**
 * Node-only part of instrumentation (see instrumentation.ts).
 *
 * DEV ONLY: drains due newsletter campaigns every minute while running
 * `npm run dev`. In production this is a no-op; delivery is driven by the
 * minutely scheduler hitting /api/cron/process-newsletter (README → Cron).
 *
 * Opt out locally with NEWSLETTER_DEV_POLLER=off in .env.local.
 */
import { processNewsletterQueue } from "@/lib/newsletter-queue";

const POLL_INTERVAL_MS = 60_000;

declare global {
  var __newsletterDevPoller: ReturnType<typeof setInterval> | undefined;
}

export function startNewsletterDevPoller() {
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.NEWSLETTER_DEV_POLLER === "off") return;
  // Guard against duplicate intervals on hot reload.
  if (globalThis.__newsletterDevPoller) return;

  let running = false;
  const tick = async () => {
    if (running) return; // never overlap runs
    running = true;
    try {
      const result = await processNewsletterQueue({ timeBudgetMs: 40_000 });
      if (result.sent || result.failed || result.skipped || !result.success) {
        console.log(`[newsletter-dev-poller] ${result.message}`);
      }
    } catch (err) {
      console.error("[newsletter-dev-poller] error:", (err as Error)?.message);
    } finally {
      running = false;
    }
  };

  globalThis.__newsletterDevPoller = setInterval(tick, POLL_INTERVAL_MS);
  console.log("[newsletter-dev-poller] started — checking due campaigns every 60s");
  void tick();
}
