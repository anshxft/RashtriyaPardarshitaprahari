import type { MetadataRoute } from 'next'
import { publicArticleWhere } from '@/collections/Articles'
import { publicVideoWhere } from '@/collections/Videos'
import { db } from '@/lib/data'
import { LANGS } from '@/lib/i18n'
import { paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic' // never touch the DB at build time

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await db()
  const base = siteUrl()
  const [articles, english, cats, pages, videos] = await Promise.all([
    payload.find({ collection: 'articles', where: publicArticleWhere(), limit: 5000, depth: 0, select: { slug: true, updatedAt: true, demoContent: true, format: true }, sort: '-publishedAt' }),
    payload.find({ collection: 'articles', locale: 'en', where: publicArticleWhere('en'), limit: 5000, depth: 0, select: { slug: true } }),
    payload.find({ collection: 'categories', limit: 500, depth: 0, select: { slug: true } }),
    payload.find({ collection: 'pages', limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'videos', where: publicVideoWhere(), limit: 2000, depth: 0, select: { slug: true, updatedAt: true, demoContent: true } }),
  ])
  const enSlugs = new Set(english.docs.map((a) => a.slug))
  const both = (make: (l: (typeof LANGS)[number]) => string, lastModified?: string) =>
    LANGS.map((l) => ({ url: `${base}${make(l)}`, lastModified, alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${base}${make(x)}`])) } }))

  return [
    ...both((l) => paths.home(l)),
    ...cats.docs.flatMap((c) => both((l) => paths.category(l, c.slug))),
    ...pages.docs.flatMap((p) => both((l) => paths.page(l, p.slug), p.updatedAt)),
    ...both((l) => paths.corrections(l)),
    ...both((l) => paths.team(l)),
    ...both((l) => paths.videos(l)),
    ...videos.docs.filter((v) => !v.demoContent).flatMap((v) => both((l) => paths.video(l, v.slug), v.updatedAt)),
    ...articles.docs
      .filter((a) => !a.demoContent && a.format !== 'link')
      .flatMap((a) => (enSlugs.has(a.slug) ? both((l) => paths.article(l, a.slug), a.updatedAt) : ([{ url: `${base}${paths.article('hi', a.slug)}`, lastModified: a.updatedAt }] as MetadataRoute.Sitemap))),
  ]
}
