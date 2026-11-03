'use client'

import Link from 'next/link'

/** Something failed while building this page: say so plainly, offer a retry — never show technical details. */
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center sm:py-24">
      <h1 className="font-display text-2xl font-bold">यह पृष्ठ अभी खुल नहीं पाया</h1>
      <p className="mt-1 text-muted" lang="en">
        This page could not be loaded right now.
      </p>
      <p className="mt-4 text-muted">कृपया थोड़ी देर बाद दोबारा कोशिश करें। समस्या बनी रहे तो हमें हेल्पलाइन पर बताएं।</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          दोबारा कोशिश करें / Try again
        </button>
        <Link href="/hi" className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-surface">
          मुख्य पृष्ठ
        </Link>
      </div>
    </div>
  )
}
