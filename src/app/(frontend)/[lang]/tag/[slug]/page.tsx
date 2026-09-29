import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Listing, pageNum } from '@/components/Listing'
import { getArticles, getBySlug } from '@/lib/data'
import { assertLang } from '@/lib/i18n'
import { decodeSlug, paths } from '@/lib/paths'

export const dynamic = 'force-dynamic' // reads ?page=
type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const tag = await getBySlug('tags', assertLang(p.lang), decodeSlug(p.slug))
  return tag ? { title: `#${tag.title}` } : {}
}

export default async function TagPage({ params, searchParams }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const tag = await getBySlug('tags', lang, decodeSlug(p.slug))
  if (!tag) notFound()
  const page = pageNum((await searchParams).page)
  const res = await getArticles(lang, { where: { tags: { in: [tag.id] } }, limit: 13, page })
  return <Listing lang={lang} title={`#${tag.title}`} docs={res.docs} page={page} totalPages={res.totalPages} base={paths.tag(lang, tag.slug)} />
}
