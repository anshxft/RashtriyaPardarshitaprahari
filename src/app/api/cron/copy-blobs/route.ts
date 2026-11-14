import { timingSafeEqual } from 'node:crypto'
import { list, put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * One-time move of all files from a previous Blob store (OLD_BLOB_READ_WRITE_TOKEN) into the current one
 * (BLOB_READ_WRITE_TOKEN), keeping every path, so only the store address changes. Runs in batches:
 * GET with `Authorization: Bearer $CRON_SECRET`, then call again with ?cursor=<next> until `done` is true.
 * Files already copied are written again harmlessly (same path, same bytes).
 */
export async function GET(req: Request) {
  const want = `Bearer ${process.env.CRON_SECRET || ''}`
  const key = new URL(req.url).searchParams.get('key')
  const got = req.headers.get('authorization') || (key ? `Bearer ${key}` : '')
  if (!process.env.CRON_SECRET || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const from = process.env.OLD_BLOB_READ_WRITE_TOKEN
  const to = process.env.BLOB_READ_WRITE_TOKEN
  if (!from || !to) return NextResponse.json({ error: 'OLD_BLOB_READ_WRITE_TOKEN and BLOB_READ_WRITE_TOKEN are both needed' }, { status: 500 })

  const started = Date.now()
  let cursor = new URL(req.url).searchParams.get('cursor') || undefined
  const originals = new URL(req.url).searchParams.get('originals') === '1'
  let copied = 0
  const failed: string[] = []
  let oldBase = ''
  let newBase = ''
  while (Date.now() - started < 200_000) {
    const page = await list({ token: from, cursor, limit: 25 })
    console.log('page', page.blobs.length, 'more', page.hasMore)
    for (const b of page.blobs) {
      oldBase ||= new URL(b.url).origin
      // the untouched camera originals are only needed to re-make a video; they are big, so they come last (?originals=1)
      if (b.pathname.startsWith('videos/original/') && !originals) continue
      if (Date.now() - started > 240_000) break
      try {
        const res = await fetch(b.url, { signal: AbortSignal.timeout(50_000) })
        if (!res.ok || !res.body) throw new Error(String(res.status))
        const out = await put(b.pathname, res.body, { access: 'public', token: to, addRandomSuffix: false, allowOverwrite: true, contentType: res.headers.get('content-type') || undefined, multipart: b.size > 50_000_000 })
        newBase ||= new URL(out.url).origin
        copied++
        console.log('copied', b.pathname, b.size)
      } catch (e) {
        failed.push(`${b.pathname}: ${(e as Error).message}`)
        console.log('failed', b.pathname, (e as Error).message)
      }
    }
    cursor = page.hasMore ? page.cursor : undefined
    if (!cursor) break
  }
  return NextResponse.json({ copied, failed, done: !cursor, cursor: cursor || null, oldBase, newBase })
}
