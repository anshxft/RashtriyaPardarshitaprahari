import QRCode from 'qrcode'
import { publicArticleWhere } from '@/collections/Articles'
import { proxied } from '@/components/ShareCard'
import type { Article } from '@/payload-types'
import { istDate } from './articleHooks'
import { asCat, cardImage, db } from './data'
import type { EpStory } from './epaper'
import { lexicalToParagraphs } from './lexical'
import type { Lang } from './i18n'
import { resolveLayout } from './layout'
import { paths, siteUrl } from './paths'

const qr = (v: string) => QRCode.toString(v, { type: 'svg', margin: 0, width: 60, errorCorrectionLevel: 'M', color: { dark: '#0b1f4d', light: '#ffffff' } })

/** The edition (one IST day) as plain, serialisable data for the e-paper board. */
export async function toEpStory(a: Article, lang: Lang): Promise<EpStory> {
  const img = cardImage(a, 'hero')
  const member = typeof a.reporter === 'object' && a.reporter ? a.reporter.name : undefined
  const isLink = a.format === 'link' && a.linkCard?.url
  const url = `${siteUrl()}${a.newsId ? paths.newsShort(a.newsId) : paths.article(lang, a.slug)}`
  const known = img && (img.src.startsWith('/') || /^https:\/\/[^/]*(wikimedia\.org|unsplash\.com|pexels\.com|vercel-storage\.com)\//.test(img.src))
  const photoSrc = img ? (known ? proxied(img.src, 1080) : img.src) : undefined
  const linkImg = isLink && a.linkCard?.imageUrl ? a.linkCard.imageUrl : undefined
  return {
    id: String(a.id),
    title: a.title,
    subheadline: a.subheadline,
    reporter: a.reporterName || member,
    location: a.location,
    category: asCat(a.category)?.title,
    newsId: a.newsId,
    url,
    paragraphs: lexicalToParagraphs(a.content).length ? lexicalToParagraphs(a.content) : a.excerpt ? [a.excerpt] : [],
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
    where: { and: [publicArticleWhere(), { firstPublishedAt: { greater_than_equal: from } }, { firstPublishedAt: { less_than: to } }] },
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
    where: publicArticleWhere(),
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
