import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/ArticleView'
import { asCat, cardImage, getArticle } from '@/lib/data'
import { assertLang, other } from '@/lib/i18n'
import { decodeSlug, paths } from '@/lib/paths'

export const revalidate = 60
export const generateStaticParams = async () => []

type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const lang = assertLang(p.lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a) return {}
  const img = cardImage(a, 'hero')
  const description = a.subheadline || a.excerpt || undefined
  return {
    title: a.title,
    description,
    alternates: {
      canonical: paths.article(lang, a.slug),
      languages: { [lang]: paths.article(lang, a.slug), [other(lang)]: paths.article(other(lang), a.slug) },
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
    robots: a.demoContent ? { index: false } : undefined,
  }
}

export default async function ArticlePage({ params }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const a = await getArticle(lang, decodeSlug(p.slug))
  if (!a) notFound()
  return <ArticleView a={a} lang={lang} />
}
