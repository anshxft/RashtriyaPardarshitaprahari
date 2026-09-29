# राष्ट्रीय पारदर्शिता प्रहरी — Rashtriya Pardarshita Prahari

Bilingual (Hindi-first + English) online national newspaper with a built-in newsroom CMS.
*खबर से आगे, जवाबदेही तक · Beyond News. Towards Accountability.*

## Why this stack (5 lines)

1. **Next.js 16 + TypeScript + Tailwind 4**: fast server-rendered pages, image optimisation, SEO metadata, and `/hi` and `/en` routing, all built in.
2. **Payload CMS 3** runs *inside* the same Next.js app: login, roles, drafts/versions, per-field Hindi/English, media library and a rich-text editor, with no separate server.
3. **SQLite (libSQL)**: a single file locally and **Turso** in production, using the same driver. Swap to Postgres by changing one adapter line in `src/payload.config.ts`.
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

## Deploy (Vercel + Turso)

1. **Database**: create a Turso database (`turso db create prahari`) and note the URL (`libsql://…`) and an auth token.
2. **Vercel**: import the repo. Set these environment variables:
   `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL=https://your-domain`, `DATABASE_URL=libsql://…`, `DATABASE_AUTH_TOKEN`,
   `BLOB_READ_WRITE_TOKEN` (create a Blob store under Storage; Vercel's disk is not persistent),
   and optionally `SMTP_*`, `NOTIFY_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
3. Deploy. Database migrations in `src/migrations` run automatically on startup in production.
4. Open `https://your-domain/admin` and create the first (Admin) account. Optionally run the seed once against the production DB from your machine (`DATABASE_URL=… DATABASE_AUTH_TOKEN=… npm run seed`), then `npm run demo:remove` when you're ready.
5. **Schema changes later**: edit a collection, run `npm run payload migrate:create <name>`, commit the new file in `src/migrations`, and deploy.

Other hosts (Railway, Render, a VPS with `npm run build && npm start`) work the same way. On a VPS you can keep `DATABASE_URL=file:./prahari.db` and skip Blob, and local uploads are stored in `media/` and `private-files/`.

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
