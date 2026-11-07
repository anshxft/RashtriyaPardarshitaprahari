# Deployment

The application is a single Next.js project. Production runs on Vercel with a Supabase Postgres database.

## 1. Database

1. Create a Postgres database (Supabase recommended, region close to the readers).
2. Use the **transaction pooler** connection string (port 6543) as `DATABASE_URL`.
3. Migrations in `src/migrations` are applied automatically on the first request after each deploy.
4. Keep Row Level Security enabled on all tables with no public policies; the application connects as the table owner.

## 2. Storage

- **Images and documents:** connect a Vercel Blob store to the project (`BLOB_READ_WRITE_TOKEN` is added automatically).
- **Video (recommended):** a private S3-compatible bucket such as Cloudflare R2. Set `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and run `node scripts/r2-cors.mjs` once so browsers can upload in parts.

## 3. Vercel project

1. Import the repository. The framework preset (Next.js) and default build settings are correct.
2. Set the environment variables from `.env.example`. Required: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`.
   Recommended for production: `REQUIRE_2FA=1`, `CRON_SECRET`, `BACKUP_KEY`.
3. Deploy. Every push to `main` deploys to production; pull requests get preview deployments.
4. Add the custom domain and set `NEXT_PUBLIC_SITE_URL` to it.

> Preview deployments use the environment variables scoped to *Preview*. Point them at a separate database if previews
> should not write to production data.

## 4. First login

Open `/admin` and create the first account (it becomes Admin), then fill in Admin → Site Settings: organisation name,
registration number, editor, publisher, address and contact details.

## 5. Video worker (optional)

For long videos and the social / flash exports, deploy `worker/Dockerfile` (e.g. Railway, using `railway.json`) with the
same `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `S3_*` and `TTS_*` values, then set `VIDEO_WORKER=external`
on Vercel and redeploy.

## Troubleshooting

| Symptom | Check |
|---|---|
| Error 500 on every page | `DATABASE_URL` is the full connection string (not only the password); redeploy after changes. |
| Uploads fail | The Blob store is connected to the project; redeploy. |
| Setting change has no effect | Environment variable changes need a redeploy. |
| Site asks for a Vercel login | Project → Settings → Deployment Protection. |
