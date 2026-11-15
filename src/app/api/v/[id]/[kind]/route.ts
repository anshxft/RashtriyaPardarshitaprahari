import { NextResponse } from 'next/server'
import { liveLifecycle } from '@/collections/Articles'
import { publicVideoWhere } from '@/collections/Videos'
import { currentUser } from '@/lib/auth'
import { asMedia, db } from '@/lib/data'
import { resolveUrl } from '@/lib/storage'
import type { Article, Video } from '@/payload-types'

export const dynamic = 'force-dynamic'

/**
 * Public video playback without any file address in the page: /api/v/<id>/play and /api/v/<id>/poster check that the
 * video news is published (or that a logged-in editor is looking) and answer with a short-lived link to the WEBSITE
 * version (or the final Flash + Voice version). The original upload and the social exports are never served here.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params
  const payload = await db()
  const staff = Boolean(await currentUser())
  const res = await payload.find({ collection: 'videos', where: staff ? { id: { equals: Number(id) } } : { and: [publicVideoWhere(), { id: { equals: Number(id) } }] }, limit: 1, depth: 1, draft: staff })
  let v = res.docs[0] as Video | undefined
  let aId = v ? (typeof v.article === 'object' ? v.article?.id : v.article) : undefined
  if (!v) {
    // a story's second video is not listed on its own: it plays while the story it belongs to is live
    const owner = await payload.find({ collection: 'articles', where: { and: [{ video2: { equals: Number(id) } }, liveLifecycle(), { _status: { equals: 'published' } }] }, limit: 1, depth: 0 })
    if (!owner.docs[0]) return new Response('Not found', { status: 404 })
    v = (await payload.findByID({ collection: 'videos', id: Number(id), depth: 1, draft: true }).catch(() => null)) as Video | undefined
    if (!v) return new Response('Not found', { status: 404 })
    aId = owner.docs[0].id
  }
  let a: Article | null = null
  if (aId) {
    const r = await payload.find({ collection: 'articles', where: staff ? { id: { equals: aId } } : { and: [{ id: { equals: aId } }, liveLifecycle()] }, limit: 1, depth: 0, draft: staff })
    a = (r.docs[0] as Article) ?? null
    if (!a) return new Response('Not found', { status: 404 }) // archived / trashed news: the video goes with it
  }
  let stored: string | null | undefined
  if (kind === 'play') stored = (a?.flash?.enabled || a?.flash?.voice) && v.flashUrl ? v.flashUrl : v.processedUrl
  else if (kind === 'voice') stored = a?.flash?.voice ? a.flash.audioUrl : null // the spoken text, played over the video
  else if (kind === 'poster') stored = asMedia(v.thumbnail)?.sizes?.card?.url || asMedia(v.thumbnail)?.url || v.posterUrl
  else return new Response('Not found', { status: 404 })
  const url = await resolveUrl(stored, 2 * 3600)
  if (!url) return new Response('Not ready', { status: 404 })
  return NextResponse.redirect(new URL(url, req.url), { status: 302, headers: { 'cache-control': 'private, max-age=600' } })
}
