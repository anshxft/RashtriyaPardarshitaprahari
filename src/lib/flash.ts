import { liveFlashWhere } from '@/collections/BreakingNews'
import type { Article, BreakingNew, Video } from '@/payload-types'
import { istDate } from './articleHooks'
import { asMedia, db } from './data'
import type { Lang } from './i18n'
import { paths } from './paths'

/** One live Breaking Flash as plain data — the same shape for the website card, the ticker and the public API (app). */
export type FlashItem = {
  id: number
  lines: string[]
  caption?: string
  photo?: { src: string; alt: string }
  video?: { poster: string; play: string }
  href?: string
  epaperHref?: string
  reporter?: string
  publishedAt?: string
  updatedAt: string
  popup?: boolean
}

const object = <T,>(v: unknown) => (typeof v === 'object' && v ? (v as T) : undefined)

/** Doc → item. Media rules: `auto` = video when there is one, otherwise photo; a photo next to a video becomes its poster. */
export function toFlashItem(f: BreakingNew, lang: Lang): FlashItem {
  const photo = asMedia(f.photo)
  const photoSrc = photo ? photo.sizes?.card?.url || photo.url || undefined : undefined
  const video = object<Video>(f.video)
  const mode = f.showMedia || 'auto'
  const wantVideo = Boolean(video) && mode !== 'photo'
  const wantPhoto = Boolean(photoSrc) && (mode === 'photo' || mode === 'both' || (mode === 'auto' && !video))
  const a = object<Article>(f.article)
  const live = a && a._status === 'published' && (!a.lifecycle || a.lifecycle === 'active')
  return {
    id: f.id,
    lines: (f.text || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3),
    caption: f.caption || undefined,
    photo: wantPhoto ? { src: photoSrc!, alt: photo?.alt || f.caption || '' } : undefined,
    video: wantVideo ? { poster: !wantPhoto && photoSrc ? photoSrc : `/api/flash/${f.id}/poster`, play: `/api/flash/${f.id}/play` } : undefined,
    href: live ? paths.article(lang, a.slug) : f.link || undefined,
    epaperHref: live && a.layout?.inEpaper !== false ? paths.epaper(lang, istDate(a.firstPublishedAt || a.publishedAt || a.createdAt)) : undefined,
    reporter: f.showReporter && f.reporterName ? f.reporterName : undefined,
    publishedAt: f.publishedAt || undefined,
    updatedAt: f.updatedAt,
    popup: Boolean(f.popup),
  }
}

/**
 * Live flashes, highest priority first, newest first within the same priority. The desk keeps two separate sections:
 * `ticker` = ब्रेकिंग फ्लैश (red strip + home card), `popup` = फ्लैश पॉप-अप (corner pop-up only).
 */
export async function getFlash(lang: Lang, limit = 10, kind: 'ticker' | 'popup' = 'ticker'): Promise<FlashItem[]> {
  const res = await (await db()).find({ collection: 'breaking-news', locale: lang, where: liveFlashWhere(), sort: ['-priority', '-publishedAt'], limit: 60, depth: 1 })
  return (res.docs as BreakingNew[])
    .filter((f) => Boolean(f.popup) === (kind === 'popup'))
    .map((f) => toFlashItem(f, lang))
    .filter((f) => f.lines.length > 0)
    .slice(0, limit)
}
