import type { MetadataRoute } from 'next'
import { publicArticleWhere } from '@/collections/Articles'
import { db } from '@/lib/data'
import { LANGS } from '@/lib/i18n'
import { paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic' // never touch the DB at build time

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await db()
  const base = siteUrl()
  const [articles, cats, pages] = await Promise.all([
    payload.find({ collection: 'articles', where: publicArticleWhere(), limit: 5000, depth: 0, select: { slug: true, updatedAt: true, demoContent: true }, sort: '-publishedAt' }),
    payload.find({ collection: 'categories', limit: 500, depth: 0, select: { slug: true } }),
    payload.find({ collection: 'pages', limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
  ])
  const both = (make: (l: (typeof LANGS)[number]) => string, lastModified?: string) =>
    LANGS.map((l) => ({ url: `${base}${make(l)}`, lastModified, alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${base}${make(x)}`])) } }))

  return [
    ...both((l) => paths.home(l)),
    ...cats.docs.flatMap((c) => both((l) => paths.category(l, c.slug))),
    ...pages.docs.flatMap((p) => both((l) => paths.page(l, p.slug), p.updatedAt)),
    ...both((l) => paths.corrections(l)),
    ...articles.docs.filter((a) => !a.demoContent).flatMap((a) => both((l) => paths.article(l, a.slug), a.updatedAt)),
  ]
}
