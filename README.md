# KaizenHR Website + Admin (kaizenhrsm)

Next.js 15 + Supabase + Resend. Public marketing/blog site plus an
`/admin` CMS (posts, contacts, newsletter, subscribers, settings).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in keys, see below
npm run dev                  # http://localhost:3000
```

Login: `http://localhost:3000/login` -> redirects to `/admin/dashboard`.

## Env vars

See `.env.example`. Sources:

| Key | Where |
| --- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > Data API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, server-only |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | resend.com/api-keys (free: 100 emails/day) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile dashboard |
| `CRON_SECRET` | Any random 32-byte hex (`openssl rand -hex 32`) |
| `MAINTENANCE_MODE` | Optional, `true` forces the maintenance page |

## Supabase setup (new clone)

```bash
npm i -g supabase
supabase link --project-ref <project-ref>
supabase db push            # applies supabase/migrations/
```

First staff account (there is no sign-up page):

1. Supabase Dashboard > Authentication > Add user (email + password).
2. Insert profile row: `profiles(id=<auth-user-id>, email, full_name, role='super_admin', status='active')`.
3. Login at `/login`. `super_admin` is required for `/admin/users`; `admin` can use everything else.

Key tables: `posts` + `post_blocks`, `contacts` + `contact_replies`,
`newsletter_subscribers` / `newsletter_campaigns` / `newsletter_send_log`,
`hrms_modules` + `hrms_features` (see `docs/hrms-cms.md`),
`system_settings`, `admin_audit_log`.

## Cron (required for newsletter + audit cleanup)

Hourly: `GET /api/cron/process-newsletter` with header
`Authorization: Bearer <CRON_SECRET>`.

Each run sends **at most 25 emails** (fits Vercel 10s timeout + Resend
free quota) and deletes `admin_audit_log` rows older than
`audit_log_retention_days` (default **30** — keep it low, Supabase free
is 500MB).

Vercel: Project Settings > Cron, or use cron-job.org (Supabase free
projects pause when idle — a hourly ping also keeps it awake).

## Deploy (Vercel free)

1. Push to GitHub, Import in Vercel.
2. Add all `.env.example` vars (production values, `NEXT_PUBLIC_SITE_URL=https://<domain>`).
3. `Framework: Next.js`, Build: `next build`. No custom server.
4. Add the hourly cron above.

Note: `npm run dev` currently uses `node server.js` (custom server).
Planned cleanup (left for last on purpose): switch scripts to
`next dev` / `next start` and delete `server.js`.

## Free-tier survival rules

- Public pages are ISR (`(public)/layout` revalidates every 60s,
  sitemap hourly). Don't add per-request DB reads to hot paths.
- `getPublicSettings()` is `cache()`d per request — call it freely,
  it hits the DB once.
- Newsletter: 25/run max, Resend 100/day. Big lists drain over days.
- Keep `audit_log_retention_days` at 30. Don't `select("*")` on big
  tables — select only needed columns.
- Images: use `next/image` (auto WebP). Don't commit multi-MB PNGs to
  `public/` — compress first (`cwebp -q 85`).

## Scripts

- `npm run dev` — dev server (custom `server.js`, port 3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — eslint (build currently ignores lint; TS errors fail the build)
