import { NextResponse } from 'next/server'
import type { Where } from 'payload'
import { liveFlashWhere } from '@/collections/BreakingNews'
import { currentUser } from '@/lib/auth'
import { asMedia, db } from '@/lib/data'
import { resolveUrl } from '@/lib/storage'
import type { BreakingNew, Video } from '@/payload-types'

export const dynamic = 'force-dynamic'

/**
 * Video of a Breaking Flash: /api/flash/<id>/play and /api/flash/<id>/poster. Readers get it only while the flash is
 * live (editors always, for the preview). Serves the compressed, logo-watermarked web copy — never the original upload.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params
  const staff = Boolean(await currentUser())
  const where: Where = staff ? { id: { equals: Number(id) } } : { and: [liveFlashWhere(), { id: { equals: Number(id) } }] }
  const f = (await (await db()).find({ collection: 'breaking-news', where, limit: 1, depth: 2, overrideAccess: true })).docs[0] as BreakingNew | undefined
  const v = f && typeof f.video === 'object' ? (f.video as Video) : undefined
  if (!v) return new Response('Not found', { status: 404 })
  let stored: string | null | undefined
  if (kind === 'play') stored = v.processedUrl
  else if (kind === 'poster') stored = asMedia(v.thumbnail)?.sizes?.card?.url || asMedia(v.thumbnail)?.url || v.posterUrl
  else return new Response('Not found', { status: 404 })
  const url = await resolveUrl(stored, 2 * 3600)
  if (!url) return new Response('Not ready', { status: 404 })
  return NextResponse.redirect(new URL(url, req.url), { status: 302, headers: { 'cache-control': staff ? 'private, no-store' : 'private, max-age=600' } })
}
