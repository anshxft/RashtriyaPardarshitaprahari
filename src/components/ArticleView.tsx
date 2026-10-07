import Link from 'next/link'
import { asAuthor, asCat, cardImage, getArticles, getCategories, getCorrections, getSettings, type Card } from '@/lib/data'
import { formatDate, t, type Lang } from '@/lib/i18n'
import { INK, resolveLayout, type Ink, type Size } from '@/lib/layout'
import { paths, siteUrl } from '@/lib/paths'
import type { Article, Tag, TeamMember } from '@/payload-types'
import { ArticleCard } from './ArticleCard'
import { CorrectionsBox, DocumentsBox, FactCheckBox, FollowUps, InvestigationSections, RichText, SourcesBox, TrackerTimeline } from './ArticleParts'
import { ShareButtons } from './client'
import { Qr } from './Qr'
import { ShareCard } from './ShareCard'
import { StoryTools } from './StoryTools'
import { downloadName } from '@/lib/fileName'
import { Cover, Credit, FormatBadge, QuestionBadge, SampleBadge, SectionTitle, Slot } from './ui'

const H1: Record<Size, string> = { sm: 'text-2xl md:text-4xl', md: 'text-3xl md:text-5xl', lg: 'text-4xl md:text-6xl', xl: 'text-5xl md:text-7xl' }
const SUB: Record<Size, string> = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' }
const BY: Record<Size, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' }
const PHOTO = { s: 'max-w-xs', m: 'max-w-xl', l: 'max-w-3xl', full: 'max-w-3xl' } as const
const ALIGN = { left: 'text-left', center: 'text-center', justify: 'text-left' } as const

/** Custom ink only in light mode (dark mode keeps its readable text colour). */
const ink = (i: Ink, fallback: string) => (i === 'default' ? { className: fallback, style: undefined } : { className: 'text-(--ink) dark:text-fg', style: { ['--ink' as string]: INK[i] } })

/**
 * The public story page. Also used (with `preview`) by the editors' draft preview, so what the Desk shows
 * before publishing is exactly what readers get.
 */
export async function ArticleView({ a, lang, preview }: { a: Article; lang: Lang; preview?: boolean }) {
  const d = t(lang)
  const cat = asCat(a.category)
  const author = asAuthor(a.author)
  const member = typeof a.reporter === 'object' && a.reporter ? (a.reporter as TeamMember) : undefined
  const byline = a.reporterName || member?.name || author?.name
  const img = cardImage(a, 'hero')
  const L = resolveLayout(a.layout, { hasPhoto: Boolean(img), format: a.format })
  const url = `${siteUrl()}${paths.article(lang, a.slug)}`
  const shortUrl = a.newsId ? `${siteUrl()}${paths.newsShort(a.newsId)}` : url
  const parentId = typeof a.followUpOf === 'object' ? a.followUpOf?.id : a.followUpOf
  const stamp = a.firstPublishedAt || a.publishedAt

  const [related, followUps, parent, corrections, categories, settings] = await Promise.all([
    getArticles(lang, { where: { and: [{ category: { equals: cat?.id } }, { id: { not_equals: a.id } }] }, limit: 4 }),
    getArticles(lang, { where: { followUpOf: { equals: a.id } }, limit: 10 }),
    parentId ? getArticles(lang, { where: { id: { equals: parentId } }, limit: 1 }) : null,
    getCorrections(lang, a.id),
    getCategories(lang),
    getSettings(lang),
  ])
  const parentCat = categories.find((c) => c.id === cat?.parent)
  const tags = (a.tags || []).filter((x): x is Tag => typeof x === 'object')
  const siteName = settings.siteName || d.siteName
  const revisions = (a.revisions || []).filter((v) => !v.locale || v.locale === lang).sort((x, y) => +new Date(y.at) - +new Date(x.at))

  const h = ink(L.headlineInk, 'text-navy-900 dark:text-fg')
  const s = ink(L.subheadlineInk, 'text-muted')
  const r = ink(L.reporterInk, '')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.excerpt || a.subheadline,
    inLanguage: lang,
    datePublished: stamp,
    dateModified: revisions[0]?.at || a.updatedAt,
    mainEntityOfPage: url,
    identifier: a.newsId || undefined,
    image: img ? [img.src.startsWith('http') ? img.src : `${siteUrl()}${img.src}`] : [`${siteUrl()}/og-default.jpg`],
    articleSection: cat?.title,
    keywords: tags.map((x) => x.title).join(', ') || undefined,
    author: byline ? { '@type': 'Person', name: byline } : { '@type': 'Organization', name: siteName },
    publisher: { '@type': 'Organization', name: siteName, logo: { '@type': 'ImageObject', url: `${siteUrl()}/logo.png` } },
  }
  const claim =
    a.format === 'factcheck' && a.factCheck?.verdict
      ? {
          '@context': 'https://schema.org',
          '@type': 'ClaimReview',
          url,
          datePublished: stamp,
          inLanguage: lang,
          claimReviewed: a.factCheck.claim || a.title,
          author: { '@type': 'Organization', name: siteName },
          reviewRating: { '@type': 'Rating', ratingValue: { true: 5, misleading: 2, false: 1, unverified: 3 }[a.factCheck.verdict], bestRating: 5, worstRating: 1, alternateName: d.verdicts[a.factCheck.verdict] },
        }
      : null
  const ld = (o: object) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o).replace(/</g, '\\u003c') }} />

  return (
    <article className="mx-auto max-w-3xl">
      {ld(jsonLd)}
      {claim && ld(claim)}
      {preview && (
        <p role="note" className="mb-4 rounded-md border border-dashed border-saffron-600 bg-saffron-500/10 p-3 text-sm font-semibold">
          👁 {d.previewBanner}
        </p>
      )}

      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <Link href={paths.home(lang)} className="hover:underline">{d.home}</Link>
        {parentCat && (
          <> › <Link href={paths.category(lang, parentCat.slug)} className="hover:underline">{parentCat.title}</Link></>
        )}
        {cat && (
          <> › <Link href={paths.category(lang, cat.slug)} className="font-semibold text-saffron-600 hover:underline">{cat.title}</Link></>
        )}
      </nav>

      <div className="mb-3 flex flex-wrap gap-2">
        <FormatBadge format={a.format} lang={lang} />
        <QuestionBadge status={a.questionStatus} lang={lang} />
        {a.sample && <SampleBadge lang={lang} />}
      </div>
      <h1 className={`font-display leading-tight font-extrabold ${H1[L.headlineSize]} ${ALIGN[L.align]} ${h.className}`} style={h.style}>
        {a.title}
      </h1>
      {(a.subheadline || a.excerpt) && (
        <p className={`mt-4 leading-relaxed ${SUB[L.subheadlineSize]} ${ALIGN[L.align]} ${s.className}`} style={s.style}>
          {a.subheadline || a.excerpt}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3 text-sm">
        {byline && (
          <span className={`${BY[L.reporterSize]} ${r.className}`} style={r.style}>
            {d.reportBy}: <strong>{byline}</strong>
            {member?.designation && <span className="text-muted"> · {member.designation}</span>}
          </span>
        )}
        {a.location && <span>📍 {a.location}</span>}
        <span>
          {d.published}: <time dateTime={stamp}>{formatDate(stamp, lang, true)}</time>
        </span>
        {revisions[0] && (
          <span className="font-semibold text-saffron-600">
            {d.revised}: <time dateTime={revisions[0].at}>{formatDate(revisions[0].at, lang, true)}</time>
          </span>
        )}
        {a.newsId && (
          <span className="text-muted">
            {d.newsId}: <span className="font-mono">{a.newsId}</span>
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <ShareButtons url={shortUrl} title={a.title} labels={{ share: d.share, copy: d.copyLink, copied: d.copied }} />
        <StoryTools
          title={a.title}
          shortUrl={shortUrl}
          printHref={`${paths.article(lang, a.slug)}/print`}
          fileName={downloadName(a.newsId, a.title, a.firstPublishedAt || a.publishedAt, 'png').replace(/\.png$/, '')}
          labels={{ print: d.printPdf, image: d.downloadImage, share: d.shareLinkLabel, busy: d.imageBusy, fail: d.imageFail, copied: d.linkCopied }}
        >
          <ShareCard lang={lang} title={a.title} subtitle={a.subheadline || a.excerpt} category={cat?.title} date={formatDate(stamp, lang)} img={img} newsId={a.newsId} shortUrl={shortUrl} siteName={siteName} />
        </StoryTools>
      </div>

      {/* No photo → no frame at all. */}
      {img && L.showPhoto && (
        <figure className={`mt-6 ${L.photoSize === 'l' || L.photoSize === 'full' ? '' : 'mx-auto'} ${PHOTO[L.photoSize]}`}>
          <Cover img={img} sizes="(min-width:768px) 768px, 100vw" priority className="aspect-video" />
          <Credit img={img} lang={lang} />
        </figure>
      )}

      {(a.demoContent || a.sample) && (
        <p className="mt-6 rounded-md border border-dashed border-saffron-600 bg-saffron-500/10 p-3 text-sm">
          <strong>{a.sample ? d.sample : d.demo}:</strong> {a.sample ? d.sampleNote : d.demoNote}
        </p>
      )}

      {revisions.length > 0 && (
        <section aria-label={d.revised} className="mt-6 rounded-md border border-saffron-600/40 bg-saffron-500/5 p-3 text-sm">
          <p className="font-bold text-saffron-600">✎ {d.revised}</p>
          <ul className="mt-1 space-y-0.5">
            {revisions.map((v) => (
              <li key={v.id}>
                <time dateTime={v.at}>{formatDate(v.at, lang, true)}</time>
                {v.note ? ` — ${v.note}` : ''}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">
            {d.originalPublished}: {formatDate(stamp, lang, true)} · {d.newsId} {a.newsId}
          </p>
        </section>
      )}

      {a.format === 'link' && a.linkCard?.url && (
        <section className="mt-6 rounded-xl border-2 border-dashed border-navy-700/50 bg-surface p-4">
          <p className="mb-3 inline-block rounded bg-navy-100 px-2 py-0.5 text-xs font-bold text-navy-900">
            {d.externalLink}
            {a.linkCard.siteName ? ` · ${a.linkCard.siteName}` : ''}
          </p>
          {a.linkCard.description && <p className="text-lg">{a.linkCard.description}</p>}
          <a href={a.linkCard.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-4 inline-block rounded-md bg-navy-900 px-5 py-3 font-bold text-white hover:bg-navy-700">
            {d.viewRelatedPortal}
          </a>
          <p className="mt-3 text-sm text-muted">{d.externalNote}</p>
        </section>
      )}

      <FactCheckBox a={a} lang={lang} />
      {a.askedTo && (
        <p className="mt-6 rounded-md bg-surface p-3">
          <strong>{d.askedTo}:</strong> {a.askedTo} <QuestionBadge status={a.questionStatus} lang={lang} />
        </p>
      )}
      {a.format === 'tracker' && a.tracker && <TrackerTimeline steps={a.tracker} lang={lang} />}

      <div className="mt-8" style={{ fontSize: `${L.bodyScale}%` }}>
        <RichText data={a.content} className={L.align === 'justify' ? 'text-justify' : L.align === 'center' ? 'text-center' : ''} />
      </div>
      <Slot name="ad-article-inline" />
      {a.format === 'investigation' && <InvestigationSections a={a} lang={lang} />}
      {a.documents && <DocumentsBox docs={a.documents} lang={lang} />}
      {a.sources && <SourcesBox sources={a.sources} lang={lang} />}
      <FollowUps parent={parent?.docs[0]} next={followUps.docs} current={a} lang={lang} />
      <CorrectionsBox items={corrections} lang={lang} />

      {a.newsId && (
        <aside aria-label={d.newsId} className="mt-10 flex items-center gap-5 rounded-xl border-2 border-navy-900/30 p-4 dark:border-gold-300/40">
          <Qr value={shortUrl} size={128} className="shrink-0 rounded bg-white" />
          <div className="text-sm">
            <p className="text-muted">{d.newsId}</p>
            <p className="font-mono text-lg font-bold">{a.newsId}</p>
            <p className="mt-1">{d.verifyScan}</p>
            <p className="mt-1 break-all text-xs text-muted">{shortUrl.replace(/^https?:\/\//, '')}</p>
          </div>
        </aside>
      )}

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="font-semibold">{d.tags}:</span>
          {tags.map((x) => (
            <Link key={x.id} href={paths.tag(lang, x.slug)} className="rounded-full bg-surface px-3 py-1 text-sm hover:bg-navy-100 dark:hover:bg-navy-800">
              #{x.title}
            </Link>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm">
        <Link href={`${paths.contact(lang)}?topic=correction&ref=${encodeURIComponent(a.slug || '')}`} className="text-link underline">
          {d.reportError}
        </Link>
      </p>

      {related.docs.length > 0 && (
        <section className="mt-12">
          <SectionTitle lang={lang}>{d.related}</SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.docs.map((x: Card) => (
              <ArticleCard key={x.id} a={x} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

