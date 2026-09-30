/**
 * The only module the public site uses to read content. Swap this file to change the content source.
 */
import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'
import { publicArticleWhere } from '@/collections/Articles'
import { TIERS } from '@/collections/TeamMembers'
import { publicVideoWhere } from '@/collections/Videos'
import type { Article, Author, Category, Media, Page, SiteSetting, Tag, TeamMember, Video } from '@/payload-types'
import type { Lang } from './i18n'

export const db = () => getPayload({ config })

/** Fields needed to render a card — keeps list queries light. */
const cardSelect = {
  title: true,
  subheadline: true,
  slug: true,
  newsId: true,
  linkCard: true,
  excerpt: true,
  format: true,
  category: true,
  author: true,
  heroImage: true,
  externalImage: true,
  publishedAt: true,
  factCheck: { verdict: true },
  questionStatus: true,
  sample: true,
  demoContent: true,
  featured: true,
} as const
const cardPopulate = {
  categories: { title: true, slug: true },
  authors: { name: true, slug: true },
  media: { url: true, alt: true, sizes: true, credit: true, width: true, height: true },
} as const

export type Card = Pick<
  Article,
  'id' | 'title' | 'subheadline' | 'newsId' | 'linkCard' | 'slug' | 'excerpt' | 'format' | 'category' | 'author' | 'heroImage' | 'externalImage' | 'publishedAt' | 'factCheck' | 'questionStatus' | 'sample' | 'demoContent' | 'featured'
>

export const getArticles = async (lang: Lang, opts: { where?: Where; limit?: number; page?: number } = {}) => {
  const res = await (await db()).find({
    collection: 'articles',
    locale: lang,
    where: opts.where ? { and: [publicArticleWhere(), opts.where] } : publicArticleWhere(),
    limit: opts.limit ?? 12,
    page: opts.page ?? 1,
    sort: '-publishedAt',
    depth: 1,
    select: cardSelect,
    populate: cardPopulate,
  })
  return { ...res, docs: res.docs as unknown as Card[] }
}

export const getArticle = cache(async (lang: Lang, slug: string) => {
  const res = await (await db()).find({
    collection: 'articles',
    locale: lang,
    where: { and: [publicArticleWhere(), { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] as Article | undefined
})

/** Editors only: a draft (or published) story exactly as the public page would render it. */
export const getArticleForPreview = async (lang: Lang, id: string, user: unknown) =>
  (await (await db()).findByID({ collection: 'articles', id, draft: true, locale: lang, depth: 2, overrideAccess: false, user: user as never }).catch(() => null)) as Article | null

export const getSettings = cache(async (lang: Lang) =>
  (await (await db()).findGlobal({ slug: 'site-settings', locale: lang, depth: 0 })) as SiteSetting,
)

export const getCategories = cache(async (lang: Lang) => {
  const res = await (await db()).find({ collection: 'categories', locale: lang, limit: 300, depth: 0, sort: 'menuOrder' })
  return res.docs as Category[]
})

export type MenuItem = Category & { children: Category[] }
export const getMenu = cache(async (lang: Lang): Promise<MenuItem[]> => {
  const all = await getCategories(lang)
  return all
    .filter((c) => !c.parent && c.showInMenu !== false)
    .map((c) => ({ ...c, children: all.filter((k) => k.parent === c.id) }))
})

export const getCategory = cache(async (lang: Lang, slug: string) => {
  const all = await getCategories(lang)
  const cat = all.find((c) => c.slug === slug)
  if (!cat) return undefined
  return {
    cat,
    parent: all.find((c) => c.id === cat.parent),
    children: all.filter((c) => c.parent === cat.id),
  }
})

/** Articles in a category *and* its sub-categories. */
export const getCategoryArticles = async (lang: Lang, slug: string, limit = 6, page = 1) => {
  const found = await getCategory(lang, slug)
  if (!found) return { docs: [] as Card[], totalPages: 0, page: 1 }
  const ids = [found.cat.id, ...found.children.map((c) => c.id)]
  return getArticles(lang, { where: { category: { in: ids } }, limit, page })
}

export const getBySlug = async <T extends 'tags' | 'authors' | 'pages'>(collection: T, lang: Lang, slug: string) => {
  const res = await (await db()).find({ collection, locale: lang, where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] as unknown as (T extends 'tags' ? Tag : T extends 'authors' ? Author : Page) | undefined
}

export const getBreaking = async (lang: Lang) => {
  const now = new Date().toISOString()
  const res = await (await db()).find({
    collection: 'breaking-news',
    locale: lang,
    where: { and: [{ active: { equals: true } }, { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: now } }] }] },
    limit: 10,
    depth: 0,
  })
  return res.docs.map((b) => ({ text: b.text, href: b.link || undefined }))
}

export const getCorrections = async (lang: Lang, articleId?: number) => {
  const res = await (await db()).find({
    collection: 'corrections',
    locale: lang,
    where: articleId ? { article: { equals: articleId } } : undefined,
    limit: articleId ? 20 : 100,
    sort: '-date',
    depth: 1,
    populate: { articles: { title: true, slug: true } },
  })
  return res.docs
}

export const getFooterPages = cache(async (lang: Lang) => {
  const res = await (await db()).find({
    collection: 'pages',
    locale: lang,
    where: { showInFooter: { equals: true } },
    limit: 50,
    depth: 0,
    select: { title: true, slug: true },
  })
  return res.docs as Pick<Page, 'id' | 'title' | 'slug'>[]
})

/** Published team, sorted by rank (tier) → manual order → name. Small list, so filtering happens in memory. */
export const getTeam = cache(async (lang: Lang): Promise<TeamMember[]> => {
  const res = await (await db()).find({
    collection: 'team-members',
    locale: lang,
    where: { _status: { equals: 'published' } },
    limit: 2000,
    depth: 1,
    pagination: false,
  })
  const rank = (t?: string | null) => Math.max(0, TIERS.findIndex((x) => x.value === t))
  return (res.docs as TeamMember[]).sort(
    (a, b) => rank(a.tier) - rank(b.tier) || (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name, lang),
  )
})

export const getVideos = async (lang: Lang, opts: { limit?: number; page?: number } = {}) => {
  const res = await (await db()).find({ collection: 'videos', locale: lang, where: publicVideoWhere(), sort: '-publishedAt', limit: opts.limit ?? 12, page: opts.page ?? 1, depth: 1 })
  return { ...res, docs: res.docs as Video[] }
}

export const getVideo = cache(async (lang: Lang, slug: string) => {
  const res = await (await db()).find({ collection: 'videos', locale: lang, where: { and: [publicVideoWhere(), { slug: { equals: slug } }] }, limit: 1, depth: 1 })
  return res.docs[0] as Video | undefined
})

// ── Helpers for populated relations
export const asCat = (c: Card['category'] | undefined) => (typeof c === 'object' && c ? c : undefined)
export const asAuthor = (a: Card['author'] | undefined) => (typeof a === 'object' && a ? a : undefined)
export const asMedia = (m: unknown) => (typeof m === 'object' && m ? (m as Media) : undefined)

export type Img = { src: string; alt: string; credit?: string | null; creditUrl?: string | null; w?: number; h?: number }
export const cardImage = (a: Pick<Card, 'heroImage' | 'externalImage' | 'title'>, size: 'card' | 'hero' = 'card'): Img | undefined => {
  const m = asMedia(a.heroImage)
  if (m?.url) {
    const s = m.sizes?.[size]
    return { src: s?.url || m.url, alt: m.alt || a.title, credit: m.credit, creditUrl: m.creditUrl, w: s?.width || m.width || undefined, h: s?.height || m.height || undefined }
  }
  if (a.externalImage?.url) return { src: a.externalImage.url, alt: a.title, credit: a.externalImage.credit, creditUrl: a.externalImage.creditUrl }
  return undefined
}
