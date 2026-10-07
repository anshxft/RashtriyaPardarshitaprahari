import { after } from 'next/server'
import type { Article, Video } from '../payload-types'
import { audit } from './audit'
import { asMedia, db } from './data'
import { lexicalToText } from './lexical'
import { paths, siteUrl } from './paths'
import { configured, postTo, type PlatformId, type ShareItem } from './share'
import { resolveUrl } from './storage'

type Who = { id: number; name?: string | null; role?: string | null } | null
type AutoCfg = { news?: boolean | null; video?: boolean | null; epaper?: boolean | null; platforms?: string[] | null; hashtags?: string | null }

const firstSentence = (s: string, max = 220) => (s.length <= max ? s : `${s.slice(0, max).replace(/\s+\S*$/, '')}…`)
const tag = (s?: string | null) => (s ? `#${s.trim().replace(/[\s/–-]+/g, '_').replace(/[^\p{L}\p{M}\p{N}_]/gu, '')}` : '')

async function cfg(): Promise<AutoCfg> {
  const s = (await (await db()).findGlobal({ slug: 'site-settings', depth: 0, locale: 'hi' })) as { autoShare?: AutoCfg }
  return s.autoShare || {}
}

/** Part 1.13: the social version made from the ONE master record — short headline, short description, hashtags. */
export async function socialVersion(a: Article) {
  const c = await cfg()
  const cat = typeof a.category === 'object' ? a.category?.title : null
  return {
    headline: a.social?.headline || a.title,
    description: a.social?.description || firstSentence(a.excerpt || a.subheadline || lexicalToText(a.content)),
    hashtags: a.social?.hashtags || [tag(cat), tag(a.location), c.hashtags || ''].filter(Boolean).join(' '),
  }
}

export async function shareItem(a: Article): Promise<ShareItem> {
  const v = await socialVersion(a)
  const base = siteUrl()
  const url = a.newsId ? `${base}${paths.newsShort(a.newsId)}` : `${base}${paths.article('hi', a.slug)}`
  const media = asMedia(a.heroImage)
  let imageUrl = media?.url ? new URL(media.sizes?.hero?.url || media.url, base).toString() : a.externalImage?.url || null
  let videoUrl: string | null = null
  if (a.format === 'video' && a.video) {
    const vid = (typeof a.video === 'object' ? a.video : await (await db()).findByID({ collection: 'videos', id: a.video, depth: 0, draft: true })) as Video
    videoUrl = (await resolveUrl(vid.socialUrl || vid.processedUrl, 24 * 3600)) || null
    if (videoUrl?.startsWith('/')) videoUrl = new URL(videoUrl, base).toString()
    if (!imageUrl && vid.posterUrl) imageUrl = new URL(`/api/v/${vid.id}/poster`, base).toString()
  }
  return { ...v, url, newsId: a.newsId, imageUrl, videoUrl }
}

/** Post to the chosen platforms. Each result is logged; failures are audited + emailed to the Admin, never thrown. */
export async function shareArticle(articleId: number, platforms: PlatformId[], who: Who, opts: { auto?: boolean; item?: ShareItem; headers?: Headers } = {}) {
  const payload = await db()
  const a = (await payload.findByID({ collection: 'articles', id: articleId, depth: 1, locale: 'hi' })) as Article
  const item = opts.item || (await shareItem(a))
  const kind = a.format === 'video' ? 'video' : 'news'
  const results: { platform: PlatformId; ok: boolean; url?: string; error?: string }[] = []
  for (const p of platforms.filter(configured)) {
    const log = await payload.create({ collection: 'share-log', overrideAccess: true, data: { article: a.id, newsId: a.newsId, title: a.title, kind, platform: p, status: 'queued', auto: Boolean(opts.auto), attempts: 1, by: who?.name || 'auto', item: item as never } })
    try {
      const r = await postTo(p, item)
      await payload.update({ collection: 'share-log', id: log.id, overrideAccess: true, data: { status: 'success', postUrl: r.url, response: r.id } })
      results.push({ platform: p, ok: true, url: r.url })
    } catch (e) {
      const error = String((e as Error).message || e).slice(0, 500)
      await payload.update({ collection: 'share-log', id: log.id, overrideAccess: true, data: { status: 'failed', response: error } })
      results.push({ platform: p, ok: false, error })
      await alertAdmin(`${p}: ${a.newsId || a.title} — ${error}`)
    }
  }
  await audit(payload, who, { action: 'share', newsId: a.newsId, articleId: a.id, collectionSlug: 'articles', title: a.title, details: { results, auto: Boolean(opts.auto) } }, opts.headers)
  return results
}

/** The e-paper issue of one day as a share item (link to the issue + its top headlines). */
export async function epaperItem(date: string): Promise<ShareItem> {
  const { getEditionStories } = await import('./epaperData')
  const c = await cfg()
  const stories = await getEditionStories('hi', date)
  const label = new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(`${date}T12:00:00+05:30`))
  return {
    headline: `आज का ई-पेपर · ${label}`,
    description: stories.slice(0, 4).map((x) => `• ${x.title}`).join('\n'),
    hashtags: ['#ई_पेपर', c.hashtags || ''].filter(Boolean).join(' '),
    url: `${siteUrl()}/hi/epaper/${date}`,
    newsId: null,
    imageUrl: new URL('/og-default.jpg', siteUrl()).toString(),
  }
}

export async function shareEpaper(date: string, platforms: PlatformId[], who: Who, item?: ShareItem, headers?: Headers) {
  const payload = await db()
  const it = item || (await epaperItem(date))
  const results: { platform: PlatformId; ok: boolean; url?: string; error?: string }[] = []
  for (const p of platforms.filter(configured)) {
    const log = await payload.create({ collection: 'share-log', overrideAccess: true, data: { title: it.headline, kind: 'epaper', platform: p, status: 'queued', attempts: 1, by: who?.name || 'auto', item: it as never } })
    try {
      const r = await postTo(p, it)
      await payload.update({ collection: 'share-log', id: log.id, overrideAccess: true, data: { status: 'success', postUrl: r.url, response: r.id } })
      results.push({ platform: p, ok: true, url: r.url })
    } catch (e) {
      const error = String((e as Error).message || e).slice(0, 500)
      await payload.update({ collection: 'share-log', id: log.id, overrideAccess: true, data: { status: 'failed', response: error } })
      results.push({ platform: p, ok: false, error })
      await alertAdmin(`${p}: e-paper ${date} — ${error}`)
    }
  }
  await audit(payload, who, { action: 'share', title: it.headline, collectionSlug: 'epaper', details: { date, results } }, headers)
  return results
}

export async function retryShare(logId: number, who: Who) {
  const payload = await db()
  const log = await payload.findByID({ collection: 'share-log', id: logId, depth: 0, overrideAccess: true })
  const p = log.platform as PlatformId
  try {
    const r = await postTo(p, log.item as ShareItem)
    await payload.update({ collection: 'share-log', id: logId, overrideAccess: true, data: { status: 'success', postUrl: r.url, response: r.id, attempts: (log.attempts || 1) + 1, by: who?.name } })
    return { ok: true as const, url: r.url }
  } catch (e) {
    const error = String((e as Error).message || e).slice(0, 500)
    await payload.update({ collection: 'share-log', id: logId, overrideAccess: true, data: { status: 'failed', response: error, attempts: (log.attempts || 1) + 1 } })
    return { ok: false as const, error }
  }
}

async function alertAdmin(text: string) {
  try {
    const payload = await db()
    const s = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as { notifyEmail?: string }
    const to = s.notifyEmail || process.env.NOTIFY_EMAIL
    if (to) await payload.sendEmail({ to, subject: '[Prahari] Auto-share failed', text: `${text}\n\nRetry: ${siteUrl()}/desk/share-log` })
  } catch {}
}

/**
 * Called when a story goes live (and, for video news, again when its social video is ready).
 * Runs after the response; one automatic post per platform per story.
 */
export function autoShare(articleId: number, kind: 'news' | 'video') {
  const go = async () => {
    const c = await cfg()
    if (!c[kind]) return
    const payload = await db()
    const done = await payload.find({ collection: 'share-log', where: { and: [{ article: { equals: articleId } }, { auto: { equals: true } }, { status: { equals: 'success' } }] }, limit: 50, depth: 0, overrideAccess: true })
    const already = new Set(done.docs.map((d) => d.platform))
    const want = ((c.platforms || []) as PlatformId[]).filter((p) => configured(p) && !already.has(p))
    if (want.length) await shareArticle(articleId, want, null, { auto: true })
  }
  try {
    after(() => go().catch((e) => console.error('auto-share', e)))
  } catch {
    void go().catch((e) => console.error('auto-share', e)) // outside a request (worker): run now
  }
}
