import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'पृष्ठ नहीं मिला · Page not found', robots: { index: false } }

/** 404 inside the site chrome: say plainly what happened and offer the useful ways on (both languages). */
export default function NotFound() {
  const btn = 'rounded-md px-4 py-2 text-sm font-semibold'
  return (
    <div className="mx-auto max-w-xl py-16 text-center sm:py-24">
      <p className="font-display text-6xl font-extrabold text-brand-600 sm:text-7xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">यह पृष्ठ उपलब्ध नहीं है</h1>
      <p className="mt-1 text-muted" lang="en">
        This page is not available.
      </p>
      <p className="mt-4 text-muted">हो सकता है लिंक पुराना हो या खबर हटा दी गई हो। नीचे खोजें या मुख्य पृष्ठ पर जाएं।</p>

      <form action="/hi/search" method="get" role="search" className="mx-auto mt-6 flex max-w-md gap-2">
        <label htmlFor="nf-q" className="sr-only">
          खोजें / Search
        </label>
        <input id="nf-q" name="q" type="search" placeholder="खबर खोजें / Search news" className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2" />
        <button className={`${btn} bg-navy-900 text-white`}>खोजें</button>
      </form>

      <nav aria-label="Helpful links" className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/hi" className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
          मुख्य पृष्ठ
        </Link>
        <Link href="/hi/epaper" className={`${btn} border border-line hover:bg-surface`}>
          आज का ई-पेपर
        </Link>
        <Link href="/en" className={`${btn} border border-line hover:bg-surface`} lang="en">
          English home
        </Link>
      </nav>
    </div>
  )
}
