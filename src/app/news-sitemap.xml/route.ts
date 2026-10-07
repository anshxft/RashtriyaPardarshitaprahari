import { publicArticleWhere } from '@/collections/Articles'
import { db } from '@/lib/data'
import { paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic'
export const revalidate = 300

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Google News sitemap: our own stories of the last 48 hours (no demo items, no external link cards). */
export async function GET() {
  const since = new Date(Date.now() - 48 * 3_600_000).toISOString()
  const res = await (await db()).find({
    collection: 'articles',
    locale: 'hi',
    where: { and: [publicArticleWhere(), { firstPublishedAt: { greater_than_equal: since } }, { or: [{ demoContent: { equals: false } }, { demoContent: { exists: false } }] }, { format: { in: ['news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion', 'video'] } }] },
    sort: '-firstPublishedAt',
    limit: 1000,
    depth: 0,
    select: { title: true, slug: true, firstPublishedAt: true, publishedAt: true },
  })
  const base = siteUrl()
  const urls = res.docs
    .map(
      (a) => `<url><loc>${esc(base + paths.article('hi', a.slug))}</loc><news:news><news:publication><news:name>राष्ट्रीय पारदर्शिता प्रहरी</news:name><news:language>hi</news:language></news:publication><news:publication_date>${a.firstPublishedAt || a.publishedAt}</news:publication_date><news:title>${esc(a.title)}</news:title></news:news></url>`,
    )
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
