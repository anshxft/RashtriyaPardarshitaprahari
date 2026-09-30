import { timingSafeEqual } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { del, list, put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { backupKey, seal } from '@/lib/security'
import { blobConfigured } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const KEEP = 14 // days of backups kept

/**
 * Daily encrypted backup (Vercel Cron → GET with `Authorization: Bearer $CRON_SECRET`).
 * Every collection + site settings as JSON → gzip → AES-256-GCM (BACKUP_KEY) → Vercel Blob `backups/`.
 * Passwords/2FA secrets are never in it (the API does not return them). Open one with `npm run backup:open <file>`.
 */
export async function GET(req: Request) {
  const want = `Bearer ${process.env.CRON_SECRET || ''}`
  const got = req.headers.get('authorization') || ''
  if (!process.env.CRON_SECRET || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!blobConfigured()) return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 })

  const payload = await getPayload({ config })
  const data: Record<string, unknown> = { takenAt: new Date().toISOString(), collections: {} as Record<string, unknown> }
  for (const c of payload.config.collections) {
    if (c.slug.startsWith('payload-')) continue
    const docs: unknown[] = []
    for (let page = 1; ; page++) {
      const r = await payload.find({ collection: c.slug as 'articles', page, limit: 200, depth: 0, draft: Boolean(c.versions), locale: 'all', overrideAccess: true, pagination: true })
      docs.push(...r.docs)
      if (!r.hasNextPage) break
    }
    ;(data.collections as Record<string, unknown>)[c.slug] = docs
  }
  data.globals = Object.fromEntries(await Promise.all(payload.config.globals.map(async (g) => [g.slug, await payload.findGlobal({ slug: g.slug as 'site-settings', depth: 0, locale: 'all' })])))

  const day = new Date().toISOString().slice(0, 10)
  const blob = await put(`backups/${day}.json.gz.enc`, seal(gzipSync(JSON.stringify(data)), backupKey()), { access: 'public', contentType: 'text/plain', addRandomSuffix: true })

  // Keep the newest KEEP backups.
  const all = (await list({ prefix: 'backups/' })).blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
  if (all.length > KEEP) await del(all.slice(KEEP).map((b) => b.url))
  return NextResponse.json({ ok: true, day, url: blob.pathname, kept: Math.min(all.length, KEEP) })
}
