import type { Metadata } from 'next'
import { Listing, pageNum } from '@/components/Listing'
import { getArticles } from '@/lib/data'
import { assertLang, t } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const dynamic = 'force-dynamic' // reads searchParams
type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string; page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).search, robots: { index: false } }
}

export default async function SearchPage({ params, searchParams }: Props) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  const sp = await searchParams
  const q = (sp.q || '').trim().slice(0, 100)
  const page = pageNum(sp.page)
  const res = q
    ? await getArticles(lang, { where: { or: [{ title: { like: q } }, { excerpt: { like: q } }, { subheadline: { like: q } }, { newsId: { like: q } }] }, limit: 13, page })
    : { docs: [], totalPages: 0 }
  return (
    <Listing lang={lang} title={q ? `${d.resultsFor}: “${q}”` : d.search} docs={res.docs} page={page} totalPages={res.totalPages} base={paths.search(lang, q)}>
      <form action={paths.search(lang)} role="search" className="mt-4 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          {d.search}
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={d.searchPlaceholder} className="min-w-0 flex-1 rounded-md border border-line bg-bg px-4 py-2.5 text-lg" />
        <button className="rounded-md bg-navy-900 px-5 font-bold text-white hover:bg-navy-700">{d.search}</button>
      </form>
    </Listing>
  )
}
