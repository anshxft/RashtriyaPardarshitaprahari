import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/ArticleView'
import { asCat, cardImage, getArchivedStub, getArticle } from '@/lib/data'
import { assertLang, formatDate, other } from '@/lib/i18n'
import { decodeSlug, paths } from '@/lib/paths'

export const revalidate = 60
export const generateStaticParams = async () => []

type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const lang = assertLang(p.lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a) return { robots: { index: false } }
  const img = cardImage(a, 'hero')
  const description = a.subheadline || a.excerpt || undefined
  // hreflang only to a language version that really exists
  const translated = lang === 'en' || Boolean(await getArticle('en', decodeSlug(p.slug)))
  return {
    title: a.title,
    description,
    alternates: {
      canonical: paths.article(lang, a.slug),
      languages: translated ? { [lang]: paths.article(lang, a.slug), [other(lang)]: paths.article(other(lang), a.slug) } : { [lang]: paths.article(lang, a.slug) },
    },
    openGraph: {
      type: 'article',
      title: a.title,
      description,
      publishedTime: a.firstPublishedAt || a.publishedAt,
      modifiedTime: a.updatedAt,
      section: asCat(a.category)?.title,
      images: img ? [img.src] : ['/og-default.jpg'],
    },
    robots: a.demoContent || a.format === 'link' ? { index: false } : undefined, // external items are not our own reporting
  }
}

export default async function ArticlePage({ params }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a && lang === 'en') {
    // Not translated yet: say so plainly instead of Hindi text under an English menu.
    const hi = await getArticle('hi', decodeSlug(p.slug))
    if (hi)
      return (
        <div className="mx-auto max-w-2xl rounded-xl border border-line bg-surface p-6 text-center">
          <p className="text-sm font-bold text-brand-600">This story is available in Hindi</p>
          <h1 lang="hi" className="mt-2 font-display text-2xl font-bold">{hi.title}</h1>
          <p className="mt-3 text-muted">An English version has not been published yet.</p>
          <Link href={paths.article('hi', hi.slug)} className="mt-5 inline-block rounded-md bg-navy-900 px-5 py-3 font-bold text-white hover:bg-navy-700">
            हिंदी में पढ़ें / Read in Hindi →
          </Link>
        </div>
      )
  }
  if (!a) {
    const stub = await getArchivedStub(lang, decodeSlug(p.slug))
    if (!stub) notFound()
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-line bg-surface p-6 text-center">
        <p className="text-sm font-bold text-brand-600">{lang === 'hi' ? 'आर्काइव की गई खबर' : 'Archived story'}</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{stub.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {stub.newsId && <span className="font-mono">{stub.newsId}</span>}
          {stub.firstPublishedAt && <> · {formatDate(stub.firstPublishedAt, lang)}</>}
        </p>
        <p className="mt-4">{lang === 'hi' ? 'यह खबर संपादक द्वारा आर्काइव कर दी गई है। इसका News ID और रिकॉर्ड सुरक्षित है।' : 'This story has been archived by the editors. Its News ID and record are preserved.'}</p>
      </div>
    )
  }
  return <ArticleView a={a} lang={lang} />
}
