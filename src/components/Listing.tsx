import type { ReactNode } from 'react'
import type { Card } from '@/lib/data'
import { t, type Lang } from '@/lib/i18n'
import { ArticleCard } from './ArticleCard'
import { Pagination } from './ui'

/** Shared layout for section / tag / author / search result pages. */
export function Listing({
  lang,
  title,
  intro,
  docs,
  page,
  totalPages,
  base,
  children,
}: {
  lang: Lang
  title: ReactNode
  intro?: ReactNode
  docs: Card[]
  page: number
  totalPages: number
  base: string
  children?: ReactNode
}) {
  const [first, ...rest] = docs
  return (
    <div>
      <header className="mb-8 border-b-4 border-gold-400 pb-4">
        <h1 className="font-display text-3xl font-extrabold text-navy-900 md:text-4xl dark:text-gold-300">{title}</h1>
        {intro && <div className="mt-2 text-lg text-muted">{intro}</div>}
        {children}
      </header>
      {!first ? (
        <p className="py-12 text-center text-muted">{t(lang).noResults}</p>
      ) : (
        <>
          {page === 1 && (
            <div className="mb-10">
              <ArticleCard a={first} lang={lang} variant="lead" />
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(page === 1 ? rest : docs).map((a) => (
              <ArticleCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        </>
      )}
      <Pagination page={page} totalPages={totalPages} base={base} lang={lang} />
    </div>
  )
}

export const pageNum = (v?: string | string[]) => Math.max(1, Math.min(500, Number(Array.isArray(v) ? v[0] : v) || 1))
