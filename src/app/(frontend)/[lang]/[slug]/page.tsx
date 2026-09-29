import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@/components/ArticleParts'
import { getBySlug } from '@/lib/data'
import { assertLang, formatDate, t } from '@/lib/i18n'
import { decodeSlug, paths } from '@/lib/paths'

export const revalidate = 300
export const generateStaticParams = async () => []
type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const lang = assertLang(p.lang)
  const page = await getBySlug('pages', lang, decodeSlug(p.slug))
  return page ? { title: page.title, alternates: { canonical: paths.page(lang, page.slug) } } : {}
}

/** Static pages from Admin → Pages (About, policies, legal). */
export default async function StaticPage({ params }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const page = await getBySlug('pages', lang, decodeSlug(p.slug))
  if (!page) notFound()
  const d = t(lang)
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="border-b-4 border-gold-400 pb-4 font-display text-4xl font-extrabold text-navy-900 dark:text-gold-300">{page.title}</h1>
      {page.legalReviewPending && (
        <p role="note" className="mt-4 rounded-md border border-saffron-600 bg-saffron-500/10 p-3 text-sm font-semibold">
          ⚖ {d.lawyerReview}
        </p>
      )}
      <div className="mt-6">
        <RichText data={page.content} />
      </div>
      <p className="mt-10 text-sm text-muted">
        {d.updated}: {formatDate(page.updatedAt, lang)}
      </p>
    </article>
  )
}
