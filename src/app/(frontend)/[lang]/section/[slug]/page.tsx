import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Listing, pageNum } from '@/components/Listing'
import { getCategory, getCategoryArticles } from '@/lib/data'
import { assertLang } from '@/lib/i18n'
import { decodeSlug, paths } from '@/lib/paths'

export const dynamic = 'force-dynamic' // reads ?page=
type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const lang = assertLang(p.lang)
  const c = await getCategory(lang, decodeSlug(p.slug))
  return c ? { title: c.cat.title, description: c.cat.description || undefined, alternates: { canonical: paths.category(lang, c.cat.slug) } } : {}
}

export default async function SectionPage({ params, searchParams }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const found = await getCategory(lang, decodeSlug(p.slug))
  if (!found) notFound()
  const page = pageNum((await searchParams).page)
  const res = await getCategoryArticles(lang, found.cat.slug!, 13, page)
  const { cat, parent, children } = found
  return (
    <Listing lang={lang} title={cat.title} intro={cat.description} docs={res.docs} page={page} totalPages={res.totalPages} base={paths.category(lang, cat.slug)}>
      {parent && (
        <nav className="mt-4 text-sm">
          <Link href={paths.category(lang, parent.slug)} className="inline-block rounded-full border border-line px-3 py-1 hover:bg-surface">
            ← {parent.title}
          </Link>
        </nav>
      )}
      {/* a group section lists its sub-sections as cards (title + one-line purpose); a small one as chips */}
      {children.length > 0 &&
        (children.length > 6 || children.some((c) => c.description) ? (
          <nav aria-label={cat.title} className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((c) => (
              <Link key={c.id} href={paths.category(lang, c.slug)} className="group rounded-lg border border-line bg-bg p-3 transition hover:border-brand-600 hover:shadow-sm">
                <span className="block font-semibold text-fg group-hover:text-brand-600">{c.title}</span>
                {c.description && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{c.description}</span>}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="mt-4 flex flex-wrap gap-2 text-sm">
            {children.map((c) => (
              <Link key={c.id} href={paths.category(lang, c.slug)} className="rounded-full bg-navy-900 px-3 py-1 font-semibold text-white hover:bg-navy-700">
                {c.title}
              </Link>
            ))}
          </nav>
        ))}
    </Listing>
  )
}
