import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCard } from '@/components/ArticleCard'
import { CorrectionsBox, DocumentsBox, FactCheckBox, FollowUps, InvestigationSections, RichText, SourcesBox, TrackerTimeline } from '@/components/ArticleParts'
import { ShareButtons } from '@/components/client'
import { Cover, Credit, FormatBadge, QuestionBadge, SampleBadge, SectionTitle, Slot } from '@/components/ui'
import { asAuthor, asCat, cardImage, getArticle, getArticles, getCategories, getCorrections, getSettings, type Card } from '@/lib/data'
import { assertLang, formatDate, other, t } from '@/lib/i18n'
import { decodeSlug, paths, siteUrl } from '@/lib/paths'
import type { Article, Tag } from '@/payload-types'

export const revalidate = 60
export const generateStaticParams = async () => []

type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const lang = assertLang(p.lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a) return {}
  const img = cardImage(a, 'hero')
  return {
    title: a.title,
    description: a.excerpt || undefined,
    alternates: {
      canonical: paths.article(lang, a.slug),
      languages: { [lang]: paths.article(lang, a.slug), [other(lang)]: paths.article(other(lang), a.slug) },
    },
    openGraph: {
      type: 'article',
      title: a.title,
      description: a.excerpt || undefined,
      publishedTime: a.publishedAt,
      modifiedTime: a.updatedAt,
      section: asCat(a.category)?.title,
      images: img ? [img.src] : ['/og-default.jpg'],
    },
    robots: a.demoContent ? { index: false } : undefined,
  }
}

export default async function ArticlePage({ params }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const d = t(lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a) notFound()

  const cat = asCat(a.category)
  const author = asAuthor(a.author)
  const img = cardImage(a, 'hero')
  const url = `${siteUrl()}${paths.article(lang, a.slug)}`
  const parentId = typeof a.followUpOf === 'object' ? a.followUpOf?.id : a.followUpOf

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.excerpt,
    inLanguage: lang,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    mainEntityOfPage: url,
    image: img ? [img.src.startsWith('http') ? img.src : `${siteUrl()}${img.src}`] : [`${siteUrl()}/og-default.jpg`],
    articleSection: cat?.title,
    keywords: tags.map((x) => x.title).join(', ') || undefined,
    author: author ? { '@type': 'Person', name: author.name, url: `${siteUrl()}${paths.author(lang, author.slug)}` } : { '@type': 'Organization', name: settings.siteName || d.siteName },
    publisher: { '@type': 'Organization', name: settings.siteName || d.siteName, logo: { '@type': 'ImageObject', url: `${siteUrl()}/logo.png` } },
  }

  return (
    <article className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {a.format === 'factcheck' && a.factCheck?.verdict && <ClaimReview a={a} url={url} lang={lang} org={settings.siteName || d.siteName} />}

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
      <h1 className="font-display text-3xl leading-tight font-extrabold text-navy-900 md:text-5xl dark:text-fg">{a.title}</h1>
      {a.excerpt && <p className="mt-4 text-xl leading-relaxed text-muted">{a.excerpt}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3 text-sm">
        {author && (
          <span>
            {d.by}{' '}
            <Link href={paths.author(lang, author.slug)} className="font-bold text-link hover:underline">{author.name}</Link>
          </span>
        )}
        <span>
          {d.published}: <time dateTime={a.publishedAt}>{formatDate(a.publishedAt, lang, true)}</time>
        </span>
        {a.updatedAt && new Date(a.updatedAt).getTime() - new Date(a.publishedAt).getTime() > 3_600_000 && (
          <span className="text-muted">
            {d.updated}: <time dateTime={a.updatedAt}>{formatDate(a.updatedAt, lang, true)}</time>
          </span>
        )}
      </div>
      <div className="mt-3">
        <ShareButtons url={url} title={a.title} labels={{ share: d.share, copy: d.copyLink, copied: d.copied }} />
      </div>

      <figure className="mt-6">
        <Cover img={img} label={cat?.title} sizes="(min-width:768px) 768px, 100vw" priority className="aspect-video" />
        <Credit img={img} lang={lang} />
      </figure>

      {(a.demoContent || a.sample) && (
        <p className="mt-6 rounded-md border border-dashed border-saffron-600 bg-saffron-500/10 p-3 text-sm">
          <strong>{a.sample ? d.sample : d.demo}:</strong> {a.sample ? d.sampleNote : d.demoNote}
        </p>
      )}

      <FactCheckBox a={a} lang={lang} />
      {a.askedTo && (
        <p className="mt-6 rounded-md bg-surface p-3">
          <strong>{d.askedTo}:</strong> {a.askedTo} <QuestionBadge status={a.questionStatus} lang={lang} />
        </p>
      )}
      {a.format === 'tracker' && a.tracker && <TrackerTimeline steps={a.tracker} lang={lang} />}

      <div className="mt-8">
        <RichText data={a.content} />
      </div>
      <Slot name="ad-article-inline" />
      {a.format === 'investigation' && <InvestigationSections a={a} lang={lang} />}
      {a.documents && <DocumentsBox docs={a.documents} lang={lang} />}
      {a.sources && <SourcesBox sources={a.sources} lang={lang} />}
      <FollowUps parent={parent?.docs[0]} next={followUps.docs} current={a} lang={lang} />
      <CorrectionsBox items={corrections} lang={lang} />

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
            {related.docs.map((r: Card) => (
              <ArticleCard key={r.id} a={r} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

/** Google fact-check markup, only for fact-check articles. */
function ClaimReview({ a, url, lang, org }: { a: Article; url: string; lang: 'hi' | 'en'; org: string }) {
  const rating = { true: 5, misleading: 2, false: 1, unverified: 3 }[a.factCheck!.verdict!]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    url,
    datePublished: a.publishedAt,
    inLanguage: lang,
    claimReviewed: a.factCheck?.claim || a.title,
    author: { '@type': 'Organization', name: org },
    reviewRating: { '@type': 'Rating', ratingValue: rating, bestRating: 5, worstRating: 1, alternateName: t(lang).verdicts[a.factCheck!.verdict!] },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
