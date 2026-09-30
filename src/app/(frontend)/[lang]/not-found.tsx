import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-gold-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">पृष्ठ नहीं मिला · Page not found</h1>
      <p className="mt-6 flex justify-center gap-4">
        <Link href="/hi" className="rounded bg-navy-900 px-4 py-2 font-semibold text-white">
          होम
        </Link>
        <Link href="/en" className="rounded border border-line px-4 py-2 font-semibold">
          Home
        </Link>
      </p>
    </div>
  )
}
