import QRCode from 'qrcode'
import { publicArticleWhere } from '@/collections/Articles'
import { proxied } from '@/components/ShareCard'
import type { Article } from '@/payload-types'
import { istDate } from './articleHooks'
import { asCat, cardImage, db, getAds, getBySlug, getSettings } from './data'
import type { EpStory } from './epaper'
import { lexicalToParagraphs, storyText } from './lexical'
import { t, type Lang } from './i18n'
import { resolveLayout } from './layout'
import { paths, siteUrl } from './paths'

const qr = (v: string) => QRCode.toString(v, { type: 'svg', margin: 0, width: 60, errorCorrectionLevel: 'M', color: { dark: '#1a1a1a', light: '#ffffff' } })

/** The edition (one IST day) as plain, serialisable data for the e-paper board. */
export async function toEpStory(a: Article, lang: Lang): Promise<EpStory> {
  const img = cardImage(a, 'hero')
  const member = typeof a.reporter === 'object' && a.reporter ? a.reporter.name : undefined
  const isLink = a.format === 'link' && a.linkCard?.url
  const url = `${siteUrl()}${a.newsId ? paths.newsShort(a.newsId) : paths.article(lang, a.slug)}`
  const known = img && (img.src.startsWith('/') || /^https:\/\/[^/]*(wikimedia\.org|unsplash\.com|pexels\.com|vercel-storage\.com)\//.test(img.src))
  const photoSrc = img ? (known ? proxied(img.src, 1920) : img.src) : undefined // sharp when zoomed / Full HD export
  const linkImg = isLink && a.linkCard?.imageUrl ? a.linkCard.imageUrl : undefined
  const text = storyText(a) // a story pasted into the sub-headline box still reaches the e-paper
  return {
    id: String(a.id),
    title: a.title,
    subheadline: text.subheadline,
    reporter: a.reporterName || member,
    location: a.location,
    category: asCat(a.category)?.title,
    categorySlug: asCat(a.category)?.slug,
    newsId: a.newsId,
    url,
    paragraphs: text.paragraphs,
    photo: photoSrc ? { src: photoSrc, alt: img!.alt, credit: img!.credit } : linkImg ? { src: linkImg, alt: a.title } : undefined,
    layout: resolveLayout(a.layout, { hasPhoto: Boolean(photoSrc || linkImg), format: a.format }),
    format: a.format,
    link: isLink ? { url: a.linkCard!.url!, siteName: a.linkCard!.siteName, description: a.linkCard!.description } : null,
    qrSvg: await qr(isLink ? a.linkCard!.url! : url),
    publishedAt: a.firstPublishedAt || a.publishedAt,
  }
}

const dayRange = (date: string) => {
  const start = new Date(`${date}T00:00:00+05:30`)
  return [start.toISOString(), new Date(start.getTime() + 86_400_000).toISOString()] as const
}

export async function getEditionStories(lang: Lang, date: string): Promise<EpStory[]> {
  const [from, to] = dayRange(date)
  const res = await (await db()).find({
    collection: 'articles',
    locale: lang,
    where: { and: [publicArticleWhere(lang, { withEpaperOnly: true }), { firstPublishedAt: { greater_than_equal: from } }, { firstPublishedAt: { less_than: to } }] },
    limit: 300,
    depth: 1,
    pagination: false,
  })
  const items = await Promise.all((res.docs as Article[]).map((a) => toEpStory(a, lang)))
  return items.filter((s) => s.layout.inEpaper && s.paragraphs.length > 0)
}

/** Recent edition dates (IST) that have stories, newest first. */
export async function listEditions(limitDays = 30): Promise<{ date: string; count: number }[]> {
  const res = await (await db()).find({
    collection: 'articles',
    where: publicArticleWhere(undefined, { withEpaperOnly: true }),
    sort: '-firstPublishedAt',
    limit: 1000,
    depth: 0,
    pagination: false,
    select: { firstPublishedAt: true, publishedAt: true },
  })
  const count = new Map<string, number>()
  for (const a of res.docs) {
    const day = istDate(a.firstPublishedAt || a.publishedAt)
    count.set(day, (count.get(day) || 0) + 1)
  }
  return [...count.entries()].slice(0, limitDays).map(([date, n]) => ({ date, count: n }))
}

/** Every live e-paper ad (Desk → ई-पेपर विज्ञापन) as blocks: the first takes the page-1 column, the rest go between the news. */
export async function getEpaperAds(): Promise<EpStory[]> {
  return (await getAds('epaper')).map((ad) => toAdStory(ad))
}

function toAdStory(ad: { id?: number; title: string; image: string; link?: string | null; w?: number | null; h?: number | null }): EpStory {
  const known = ad.image.startsWith('/') || /vercel-storage\.com\//.test(ad.image)
  return {
    id: `ad-${ad.id ?? 0}`,
    title: ad.title,
    url: ad.link || '',
    paragraphs: [],
    photo: { src: known ? proxied(ad.image, 1080) : ad.image, alt: ad.title },
    layout: resolveLayout(undefined, { hasPhoto: true }),
    publishedAt: new Date().toISOString(),
    slot: 'ad',
    ad: { link: ad.link, aspect: ad.w && ad.h ? Math.min(2.2, Math.max(0.5, ad.h / ad.w)) : 1.4 },
  }
}

/**
 * The paper's own standing blocks, used only to fill space a thin edition leaves empty: the editor's message (first
 * paragraphs, from Pages) and the “send your issue” box. Real site content only — nothing written here for filling.
 */
export async function getEpaperFillers(lang: Lang): Promise<EpStory[]> {
  const d = t(lang)
  const [page, settings] = await Promise.all([getBySlug('pages', lang, 'editor-in-chief-message'), getSettings(lang)])
  const out: EpStory[] = []
  const now = new Date().toISOString()
  const base = { layout: resolveLayout({ columns: 2, autoFit: false }, { hasPhoto: false }), publishedAt: now, slot: 'filler' as const }
  const msg = page ? lexicalToParagraphs(page.content).filter((p) => !p.startsWith('—')).slice(0, 3) : []
  if (msg.length) {
    const url = `${siteUrl()}${paths.page(lang, 'editor-in-chief-message')}`
    out.push({ ...base, id: 'filler-editor', title: d.editorMessage, paragraphs: msg, reporter: settings.editorName || undefined, url, qrSvg: await qr(url) })
  }
  const submit = `${siteUrl()}${paths.submit(lang)}`
  out.push({ ...base, id: 'filler-submit', title: d.submitIssue, paragraphs: [d.submitIssueCta], url: submit, qrSvg: await qr(submit) })
  return out
}
