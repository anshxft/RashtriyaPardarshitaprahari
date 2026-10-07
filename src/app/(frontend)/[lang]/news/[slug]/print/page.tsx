import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { RichText, SourcesBox } from '@/components/ArticleParts'
import { PrintButton } from '@/components/PrintButton'
import { Qr } from '@/components/Qr'
import { TAGLINE_SHORT } from '@/content/brand'
import { currentUser } from '@/lib/auth'
import { asAuthor, asCat, cardImage, db, getArticle, getSettings } from '@/lib/data'
import { allowed, loadPermissions } from '@/lib/permissions'
import { assertLang, formatDate, t } from '@/lib/i18n'
import { decodeSlug, paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic' // staff-only: checks the login on every request
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** One story, A4, with QR + News ID. Print it or "Save as PDF" from the browser (works on phones too). */
export default async function PrintStory({ params, searchParams }: { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ auto?: string }> }) {
  const p = await params
  const lang = assertLang(p.lang)
  const d = t(lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a) notFound()
  // Round 4: the printable / PDF copy is an Editor/Admin download, not a public one.
  const user = await currentUser()
  await loadPermissions(await db())
  if (!allowed(user, 'download')) redirect(paths.article(lang, a.slug))
  const settings = await getSettings(lang)
  const img = cardImage(a, 'hero')
  const byline = a.reporterName || (typeof a.reporter === 'object' && a.reporter ? a.reporter.name : undefined) || asAuthor(a.author)?.name
  const stamp = a.firstPublishedAt || a.publishedAt
  const shortUrl = a.newsId ? `${siteUrl()}${paths.newsShort(a.newsId)}` : `${siteUrl()}${paths.article(lang, a.slug)}`
  const revised = (a.revisions || []).filter((v) => !v.locale || v.locale === lang).sort((x, y) => +new Date(y.at) - +new Date(x.at))[0]
  const auto = (await searchParams).auto === '1'

  return (
    <article className="print-sheet mx-auto max-w-[210mm] bg-white p-2 text-black">
      <style>{`@page { size: A4; margin: 14mm; } @media print { .print-sheet { padding: 0 } }`}</style>
      <div className="no-print mb-4 flex items-center justify-between gap-4">
        <PrintButton label={d.printNow} auto={auto} />
      </div>
      <header className="flex items-center gap-4 border-b-4 border-navy-900 pb-3">
        <Image src="/logo-160.webp" alt="" width={72} height={72} />
        <div>
          <p className="font-display text-2xl leading-tight font-extrabold text-navy-900">{settings.siteName || d.siteName}</p>
          <p className="text-sm font-semibold text-saffron-600">{TAGLINE_SHORT}</p>
        </div>
      </header>
      <p className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-gray-600">
        <span>{asCat(a.category)?.title}</span>
        <span>
          {formatDate(stamp, lang, true)}
          {revised && ` · ${d.revised}: ${formatDate(revised.at, lang, true)}`}
        </span>
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight font-extrabold text-navy-900">{a.title}</h1>
      {(a.subheadline || a.excerpt) && <p className="mt-2 text-lg text-gray-700">{a.subheadline || a.excerpt}</p>}
      {(byline || a.location) && (
        <p className="mt-2 text-sm">
          {byline && (
            <>
              {d.reportBy}: <strong>{byline}</strong>
            </>
          )}
          {byline && a.location && ' · '}
          {a.location && <>📍 {a.location}</>}
        </p>
      )}
      {img && (
        <figure className="mt-4">
          <Image src={img.src} alt={img.alt} width={900} height={506} className="h-auto w-full rounded" />
          {img.credit && <figcaption className="mt-1 text-xs text-gray-500">{img.credit}</figcaption>}
        </figure>
      )}
      <div className="mt-4">
        <RichText data={a.content} className="!prose-neutral" />
      </div>
      {a.sources && <SourcesBox sources={a.sources} lang={lang} />}
      <footer className="mt-8 flex items-center gap-5 border-t-2 border-navy-900 pt-4 break-inside-avoid">
        <Qr value={shortUrl} size={120} />
        <div className="text-sm">
          <p>
            {d.newsId}: <span className="font-mono text-base font-bold">{a.newsId || '—'}</span>
          </p>
          <p className="mt-1">{d.verifyScan}</p>
          <p className="mt-1 break-all text-xs text-gray-500">{shortUrl.replace(/^https?:\/\//, '')}</p>
        </div>
      </footer>
    </article>
  )
}
