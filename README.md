# Rashtriya Pardarshita Prahari

Bilingual (Hindi-first, English) digital newspaper with a daily A3 e-paper, video news and a built-in newsroom desk.

*तथ्य * पारदर्शिता * जवाबदेही * जनहित*

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Editorial workflow](#editorial-workflow)
- [Video pipeline](#video-pipeline)
- [Security](#security)
- [Operations](#operations)
- [Deployment](#deployment)
- [License](#license)

## Features

**Public site (`/hi`, `/en`)**
- Server-rendered news, sections and sub-sections, tags, authors, search, RSS, sitemaps (incl. Google News sitemap)
- Story formats: news, fact check (with ClaimReview data), investigation, complaint tracker, direct question with follow-ups, documents, opinion, video
- Permanent News ID (`NTP-YYYY-MM-DD-0001`) with QR short links (`/n/<id>`), print/PDF view and a shareable news card
- Corrections log, breaking-news ticker and pop-up, listen-to-story (browser speech), reading tools, dark mode
- Daily A3 e-paper: automatic layout from the day's stories, or a hand-made layout from the desk designer; page images, print and a phone reading view

**Newsroom desk (`/desk`)**
- Fast story editor with paste-to-split, templates, photo gallery, live preview, scheduling and a publish checklist
- Status tabs, review flow, versions, archive / trash / restore, audit log and a download centre
- E-paper designer: drag-and-drop blocks across pages, column/height handles, text flow between parts, undo/redo
- Video news with headline bands, tickers, name and place tags, and an in-browser export of the full on-screen package
- Breaking flash and pop-up flash, website and e-paper advertisements, team roster, reader inbox, social sharing

**Administration (`/admin`)**
- Payload CMS: users and roles, a permission matrix, site settings, pages, categories, media and per-field Hindi/English content

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| CMS | Payload 3 running inside the Next.js app |
| Database | PostgreSQL (Supabase) in production, SQLite for local development |
| Styling | Tailwind CSS 4 |
| Media | Vercel Blob, or any S3-compatible bucket (Cloudflare R2) for video |
| Video processing | ffmpeg + sharp; optional Docker worker for long jobs |
| Hosting | Vercel (functions in `bom1`) |

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env        # set PAYLOAD_SECRET to a long random string
npm run seed                # sections, settings, pages and demo content (local database)
npm run dev                 # http://localhost:3000  (admin at /admin, desk at /desk)
```

The first account created at `/admin` on an empty database becomes an Admin. Further users can be created in Admin → Users or with:

```bash
ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… ADMIN_ROLE=editor npm run create-admin
```

## Configuration

All settings are environment variables; `.env.example` documents each one.

| Variable | Purpose |
|---|---|
| `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL` | Required |
| `BLOB_READ_WRITE_TOKEN` | Media storage on Vercel |
| `S3_*` | Private bucket for video files (optional) |
| `REQUIRE_2FA` | Authenticator-app second step for all staff logins |
| `CRON_SECRET`, `BACKUP_KEY` | Daily encrypted backup |
| `SMTP_*`, `NOTIFY_EMAIL` | Notification e-mail (optional) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Form spam protection (optional) |
| `VIDEO_WORKER`, `TTS_*` | External video worker, synthetic voice (optional) |
| `TELEGRAM_*`, `FB_*`, `IG_USER_ID`, `X_*` | Auto-share to social platforms (optional) |

Never commit `.env` files; production values live in the hosting provider's settings.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Unit checks (layout engine, validation, security helpers, video arguments) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `npm run seed` | Seed a fresh database (adds only what is missing) |
| `npm run demo:remove` | Remove demo content |
| `npm run backup:open -- <file>` | Decrypt a backup file (`BACKUP_KEY` required) |

## Project structure

```
src/
  app/(frontend)/[lang]/   public site
  app/(desk)/              newsroom desk, login and 2-step verification
  app/(payload)/           admin panel and REST API
  app/api/                 video playback, desk downloads, cron jobs
  collections/, globals/   database schema (Payload)
  components/              UI; components/desk and components/epaper for the desk and e-paper
  lib/                     data access, e-paper layout engine, video processing, security, i18n
  migrations/              database migrations (applied automatically in production)
  content/                 brand constants and fixed copy
  seed/                    seed data and content updates
scripts/                   checks and maintenance scripts
worker/                    Docker image for the external video worker
```

## Editorial workflow

| Role | Rights |
|---|---|
| Reporter | Creates and edits own drafts, submits for review. Cannot publish. |
| Editor | Reviews, edits and publishes, unless publishing is switched off for the user. |
| Senior Editor | Editor rights plus the extras set in Admin → Permissions. |
| Admin (प्रधान संपादक) | Everything, including users, permissions and site settings. |

Rights are enforced on the server. The first publish freezes the News ID and the original publish date; later edits are shown as revisions. Scheduled stories appear automatically at their publish time.

## Video pipeline

Uploads are kept untouched; a website version with the logo and a poster frame is produced in the background (`media-jobs` queue). Short clips are processed on Vercel. Long videos, social formats and the burned-in flash/voice version need the worker: build `worker/Dockerfile` (e.g. on Railway via `railway.json`) with the same database and storage variables, then set `VIDEO_WORKER=external`.

## Security

- 2-step verification (TOTP) for desk, admin and API when `REQUIRE_2FA=1`; trusted browsers for 90 days
- Strong password policy, login lockout after repeated failures, role checks on every server action
- CSRF/CORS limited to the site's own origins; security headers including HSTS
- Row Level Security on every table with no public policies, so the database's public API cannot read site data
- Uploads type-checked by content and size-limited; reader files stored privately
- Rate-limited public forms with honeypot, time trap and optional Turnstile
- Append-only audit log of publishing, deletion and download actions

## Operations

- **Migrations:** after a schema change run `npx payload migrate:create <name>` and commit the file; migrations run on deploy.
- **Backups:** a daily cron exports all collections, compressed and AES-256 encrypted with `BACKUP_KEY`; the database provider keeps its own backups as well.
- **Logos:** `node scripts/logo-variants.mjs` regenerates favicons and logo sizes from `public/logo-original.jpg`.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).
