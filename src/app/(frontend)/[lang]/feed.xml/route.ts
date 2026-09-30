import { getArticles } from '@/lib/data'
import { assertLang, t } from '@/lib/i18n'
import { paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic'
const esc = (s = '') => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

/** RSS 2.0 feed of the latest 30 stories. */
export async function GET(_: Request, { params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  const base = siteUrl()
  const { docs } = await getArticles(lang, { limit: 30 })
  const items = docs
    .map((a) => {
      const url = `${base}${paths.article(lang, a.slug)}`
      return `<item><title>${esc(a.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate><description>${esc(a.excerpt || '')}</description></item>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(d.siteName)}</title><link>${base}/${lang}</link><description>${esc(d.tagline)}</description><language>${lang}</language>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
