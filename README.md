# राष्ट्रीय पारदर्शिता प्रहरी — Rashtriya Pardarshita Prahari

Bilingual (Hindi-first + English) online national newspaper with a built-in newsroom CMS.
*खबर से आगे, जवाबदेही तक · Beyond News. Towards Accountability.*

## Why this stack (5 lines)

1. **Next.js 16 + TypeScript + Tailwind 4**: fast server-rendered pages, image optimisation, SEO metadata, and `/hi` and `/en` routing, all built in.
2. **Payload CMS 3** runs *inside* the same Next.js app: login, roles, drafts/versions, per-field Hindi/English, media library and a rich-text editor, with no separate server.
3. **Database**: a local SQLite file for development and **Supabase Postgres** in production. The adapter is picked automatically from `DATABASE_URL` (`postgres://…` → Postgres).
4. The public site reads content **only** through `src/lib/data.ts`, so the content source can be replaced without touching pages.
5. Deploys to **Vercel** as one project. Media goes to Vercel Blob, email to any SMTP server, and spam protection uses Cloudflare Turnstile (optional).

## Project map

```
src/
  app/(frontend)/[lang]/     public site (/hi, /en): home, news/[slug], section/[slug], tag, author,
                             search, corrections, submit-issue, appointment, contact, [slug] static pages, feed.xml
  app/(payload)/             admin panel at /admin + REST/GraphQL API at /api
  app/sitemap.ts, robots.ts  SEO
  collections/               database schema (Articles, Categories, Tags, Authors, Pages, Corrections,
                             BreakingNews, Media, PrivateFiles, Submissions/Appointments/ContactMessages, Users)
  globals/SiteSettings.ts    ONE place for Trust name, registration no., editor, address, contacts, social links
  content/site-structure.ts  the 24 main sections + sub-sections (menu)           ← from content.md
  content/forms.ts           form fields/labels/options + DPDP consent text       ← from content.md
  seed/pages.ts              About + policy/legal page drafts                     ← from content.md
  seed/demo.ts, samples.ts   TEMPORARY demo news + fictional "Sample" items
  lib/                       data access, i18n strings, paths, form validation
  components/                header/mega-menu/drawer, cards, badges, tracker, documents, forms
```

## Run locally

Requires Node 20.9+ (tested on Node 24).

```bash
npm install
cp .env.example .env         # then set PAYLOAD_SECRET to a long random string
npm run seed                 # sections, settings placeholders, pages, demo + sample content
npm run dev                  # http://localhost:3000  → redirects to /hi ; admin at /admin
```

Other commands: `npm run check` (self-check of validation/security helpers), `npm run typecheck`, `npm run build && npm start`.

`npm run build` never touches the database: pages render on their first request and are then cached for 60 s (ISR).
To try `npm start` locally against your dev database, keep `RUN_MIGRATIONS=false` in `.env`. Otherwise Payload stops at a
"you've run Payload in dev mode" prompt. **Never set `RUN_MIGRATIONS=false` in production.**

Measured on the production build (Lighthouse 12): Best practices 100, SEO 100 (demo stories are deliberately `noindex`),
Accessibility 96–100, Performance 98–99 on desktop and ~72–79 on simulated slow-4G mobile. CLS is 0.

Logo sizes (`public/logo.png`, `logo-160.webp`, `emblem.png`, favicons, OG image) are generated from `public/logo-original.jpg`
by `node scripts/logo-variants.mjs`.

> Windows: if a Payload CLI command fails with `spawn …esbuild.exe ENOENT`, the project path is too long.
> Move the folder somewhere short (e.g. `C:\prahari`) and run `npm install` again.

## Admin login and roles

- **First admin:** on a fresh database, open `/admin`. The first account created there automatically becomes **Admin**.
  Or from the terminal:
  ```bash
  ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='a-long-password' ADMIN_NAME='Your Name' npm run create-admin
  ```
  Use `ADMIN_ROLE=editor` or `ADMIN_ROLE=reporter` to create the other roles. Admins can also add users in Admin → Users.
- **Roles**
  - **Reporter**: creates and edits *their own* drafts, uploads media, sets *Review status → Submitted*. **Cannot publish**, cannot edit others' stories, and cannot set the lead story. This is enforced on the server, not just hidden in the UI.
  - **Editor**: reviews, edits and **publishes** everything; manages sections, tags, breaking news, pages, corrections; reads the inbox.
  - **Admin**: everything, plus users and Site Settings.
- **Scheduled publishing**: publish with a future *Published at* date. The story stays invisible until that time and then appears automatically (pages refresh every 60 seconds).
- **Allegation content**: tick *Allegation content legally reviewed* on the article as your internal check before publishing.
- **Hindi typing**: the editor accepts any Unicode input. Use the Windows/Android/macOS Hindi keyboard (e.g. "Hindi Phonetic") or Google Input Tools.

⚠ Local development created three test logins (`admin@`, `editor@`, `reporter@prahari.test`). Their password is in `.env` (`DEV_TEST_PASSWORD`). Delete these users before going live.

## Special formats (Admin → Articles → *Format*)

| Format | Where to fill it | Public result |
|---|---|---|
| Fact Check | tab *Fact check*: claim, source, verdict | coloured badge सही / गलत / भ्रामक / अपुष्ट + ClaimReview SEO data |
| Complaint Tracker | tab *Complaint tracker*: one row per stage with date and status | timeline समस्या → शिकायत → विभाग → जवाब → कार्रवाई → परिणाम |
| Investigation | tab *Investigation*: 8 sections | numbered sections with a jump menu |
| Direct Question | tab *Question & follow-ups*: status + *asked to*; follow-up stories set *Follow-up of* | status badge + a linked "what happened next" chain on every story in the chain |
| Documents Speak | tab *Documents* (any format): PDF/image + source + reference | inline PDF/image preview with source and reference |
| Corrections | Admin → Corrections | note under the story + public `/hi/corrections` log |

## Round 3 — प्रहरी डेस्क, News ID, e-paper, Team, Videos

- **प्रहरी डेस्क (`/desk`)** — the fast editor for solo publishing (laptop or 5G phone). *+ नई खबर*: fields → or paste the whole story and it is split into headline / dateline / paragraphs automatically. Six page templates, **Auto Fit** (never overflows into other stories), live preview identical to the published page, photo crop with no empty placeholder, one-tap Draft / Send for review / Publish / Schedule. *+ लिंक कार्ड* adds an external news-portal card (clearly marked "external"). Breaking news is managed at `/desk/breaking`.
- **News ID** `NTP-YYYY-MM-DD-0001` is created once at first publish and never changes. Every story has a QR (short link `/n/<ID>`), a printable/downloadable version and an image share card, all carrying the ID + QR. The **original publish date is frozen**; later edits show "संशोधित" with the date.
- **E-paper** (`/hi/epaper`): A3 pages laid out automatically from that day's stories (browser-measured, 6 columns, story never split across pages unless too long, pinned stories reserved first). Print/PDF via the browser.
- **हमारी टीम** (`/hi/team`): searchable State → District → Bureau → Designation. The Editor-in-Chief manages the roster in `/desk/team` (with preview); it can also be edited in Admin.
- **Videos** (`/desk/video`): upload once, the site adds the Trust logo (top-right, set in Site Settings → Video watermark) in the background — the **original is kept untouched**. If processing is still running or fails, the original plays with the logo laid over it, so publishing is never blocked. Limit: processing must finish inside Vercel's 300 s function limit (about 10–15 min of 1080p); for longer videos switch to Cloudflare Stream or Mux.
- **Registered tagline** (`तथ्य * पारदर्शिता * जवाबदेही * जनहित`) lives in `src/content/brand.ts` and is not editable from the admin.

### Security (Round 3)

- **Passwords**: at least 12 characters with capital, small, digit and symbol; obvious words refused (create, change and reset).
- **2-step verification (authenticator app)**: set `REQUIRE_2FA=1` on Vercel. At the first login each person scans a QR (Google/Microsoft Authenticator, Authy) and from then on needs the 6-digit code after the password. Wrong code 5× = 15-minute lock. It covers the Desk, `/admin` and the REST API. Lost phone: an Admin un-ticks *2-step verification set up* on that user (Admin → Users) and the person enrols again. Leave it off locally.
- **Roles / publish permission**: Reporter can never publish; Editor can publish unless an Admin un-ticks *Can publish* on that user; Admin can always.
- **Edit history**: articles, videos, team profiles and pages keep versions (Admin → open item → *Versions*). Who changed a published story and when is also shown as the "revisions" list.
- **Daily encrypted backup**: Vercel Cron calls `/api/cron/backup` at 03:00 IST; every collection and site settings are exported, gzip-compressed, AES-256-encrypted with `BACKUP_KEY` and stored in Blob `backups/` (last 14 kept). Set `CRON_SECRET` and `BACKUP_KEY` on Vercel and keep a copy of `BACKUP_KEY` in a password manager. To open one: download the file, then `BACKUP_KEY=… npm run backup:open -- <file>`. Uploaded media stay in Blob; the database itself also has Supabase's own backups.

## Round 4 — contact, editor panel, video pipeline, voice, auto-share, e-paper

- **Contact & branding**: Site Settings → Identity (descriptor line) and → Contact (offices with call / WhatsApp numbers, pre-filled WhatsApp text, floating button switch). Contact page, footer and every public form use them. New logo: replace `public/logo*.png|webp`, `og-default.jpg`, `emblem.png` and `logo-watermark.png` (see `scripts/logo-variants.mjs`).
- **Editor panel** (`/desk/news`): status tabs (Draft, Pending, Scheduled, Published, Updated, Archived, Trash), buttons by status × role, publish checklist + confirmation, Archive / Delete (2 confirmations + reason, soft) / Restore (Admin) / Re-publish (original date or “Updated on”) / Purge (Admin + password), Create New From This News, preview (desktop / mobile / social), version history (every version kept), download centre, audit log (`/desk/audit`, append-only). Roles: Reporter, Editor, Senior Editor, Admin (प्रधान संपादक); rights per role in **Admin → Permissions**. Downloads are Editor/Admin only.
- **Video news** (`/desk/video`): one master record (an article with format “video”). Upload resumes after a dropped connection when the R2 bucket is configured. Jobs (`media-jobs`): website version with logo + thumbnail, Social-Ready 1920×1080 / 1080×1920 with headline, reporter, place, date, News ID and end screen; Flash + Voice final. Public: Watch + Share only via `/api/v/<id>/play` (short-lived link, never the original).
- **Flash + female voice**: one approved script for strip and voice; TTS provider by env (`TTS_PROVIDER=google|azure`), cached; pronunciation dictionary (Admin → Content → Pronunciation dictionary, speech only); optional “AI voice” note (Site Settings → Video watermark).
- **Auto-share** (Site Settings → Auto-share; keys in env): Telegram, Facebook Page, Instagram, X adapters; WhatsApp = links only. Share preview + per-platform choice at `/desk/news/<id>/share`; e-paper issue at `/desk/epaper-share`; log + retry at `/desk/share-log`; failures email the Admin and never block publishing.
- **E-paper**: masthead with descriptor and “मूल्य: निःशुल्क”; page 1 right-hand columns for “समाज का आइना” (stories in that section) and the advertisement column (**Content → Advertisements**, placement “E-paper”; Site Settings → Ads enabled); body text never below 13 px (Auto Fit only widens); zoom 1×/1.5×/2× (vector, stays sharp); page image export 2246 × 3174 px.

### Video worker (recommended for real videos)

Vercel functions stop after 5 minutes and have no Hindi fonts, so social / flash videos are made by a small worker:
1. Cloudflare → R2 → create a private bucket + an API token (Object Read & Write). Put `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` in Vercel **and** in the worker. Run `node scripts/r2-cors.mjs` once.
2. Railway → New Project → Deploy from GitHub repo (this repo; `railway.json` builds `worker/Dockerfile`). Variables: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, the `S3_*` values and (for the voice) the `TTS_*` values.
3. On Vercel set `VIDEO_WORKER=external` and redeploy.
Without the worker, the website version (logo) is still made on Vercel for short clips; social / flash jobs then show “worker needed”.

## What you must fill in manually

1. **Admin → Site Settings**: Trust name, **registration number**, editor, publisher, address, email, phone, grievance officer, **notification email**, social links. Placeholders appear in `[brackets]`.
2. **content.md wording** was not provided while this was built. Replace the drafts in:
   - `src/content/site-structure.ts` (24 sections and sub-sections) *or* edit them directly in Admin → Categories
   - `src/content/forms.ts` (form fields and labels, consent text)
   - Admin → Pages (About, policies, legal pages; the seed never overwrites pages you have edited)
3. **Lawyer review**: Privacy Policy, Terms, Disclaimer and Grievance Policy show a "draft, to be reviewed by a lawyer" notice. Untick *Show "Draft…" notice* on each page once it has been reviewed.
4. **Secrets and services** in `.env` / Vercel: `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, database, SMTP, Turnstile, Blob.
5. Delete the demo content and test users (below).

## Remove demo content

All demo and sample items are flagged `demoContent = true` (visible in the admin sidebar of each article).

```bash
npm run demo:remove
```

This deletes the demo/sample articles, their corrections, demo breaking-news items, the two sample documents and the fictional "Sample Reporter". Sections, pages, settings and your own articles are untouched. Demo stories are also `noindex` and excluded from the sitemap while they exist.

Demo news are our own short summaries of real reports from 4–28 Sep 2026, each linked to its source. Images are hotlinked from Wikimedia Commons with the author and licence shown under the image (CC BY-SA / CC BY / GODL-India). Stories without a suitable free image use a branded placeholder.

## Deploy (Vercel + Supabase), as set up for this project

- **Code**: private GitHub repo `anshxft/rashtriya-pardarshita-prahari`. Every push to `main` deploys automatically on Vercel.
- **Vercel project** `rashtriya-pardarshita-prahari` (functions in Mumbai, `bom1`). It is protected by Vercel login until a custom domain is added or protection is switched off.
- **Database**: Supabase project `rashtriya-pardarshita-prahari` (Mumbai). Use the **Transaction pooler** connection string (port 6543).
- **Media**: Vercel Blob store `prahari-media`. Vercel sets `BLOB_READ_WRITE_TOKEN` on the project automatically.
- **Vercel environment variables**: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`, plus optionally `SMTP_*`, `NOTIFY_EMAIL` and Turnstile keys.
  The production secrets live locally in the git-ignored `.env.vercel`; never commit it.
- **Migrations** in `src/migrations` run automatically in production. After changing a collection, generate a new one (no database needed), then commit and push:
  ```bash
  DATABASE_URL=postgres://offline@127.0.0.1:1/x npx payload migrate:create <name>
  ```
- **Seeding or running scripts against production** from your machine (PowerShell; paste `DATABASE_URL` from `.env.vercel`):
  ```powershell
  $env:NODE_ENV='production'; $env:RUN_MIGRATIONS='true'; $env:DATABASE_URL='<value from .env.vercel>'; npx payload run src/seed/index.ts
  ```
- **Supabase security**: every table has Row Level Security on with no policies, and the `anon`/`authenticated` roles have no grants (this also applies to future tables). Supabase's public REST API therefore cannot read the site's data. The site connects as the table owner and is unaffected. Keep it this way.

Other hosts (Railway, Render, a VPS with `npm run build && npm start`) also work. On a VPS you can keep `DATABASE_URL=file:./prahari.db` and skip Blob; uploads are then stored in `media/` and `private-files/`.

## Security and privacy notes

- Citizen uploads go to the **private-files** collection: never public, readable only by Editors and Admins. They are type-checked by file content (not the browser's claim) and limited to 3 files / 4 MB total (Vercel request limit). On Vercel Blob the stored objects have unguessable but technically public URLs. For strict privacy use an S3 bucket with `@payloadcms/storage-s3` and private ACL.
- Forms: honeypot + minimum fill time + per-IP rate limit (in-memory, per server instance) + Cloudflare Turnstile when keys are set. There is explicit DPDP consent with a timestamp, and an optional anonymity flag.
- Notification emails contain only a reference number and an admin link, never personal data or files.
- Admin login locks for 15 minutes after 5 failed attempts.

## Placeholders for later (not built)

- Ads: `<Slot name="ad-…" />` in the home and article pages renders nothing. Build it when needed.
- Donations: Site Settings → *Future slots* (flag only).
- Newsletter: the home block is a disabled placeholder form.
- Live preview of drafts from the admin: not built. Editors review drafts inside the admin.
