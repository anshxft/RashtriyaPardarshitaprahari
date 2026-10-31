/** Shown the moment a Desk link is tapped, while the next page is prepared on the server — so taps never feel ignored. */
export default function DeskLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-4">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" aria-hidden />
        <span className="font-semibold text-navy-900">लोड हो रहा है…</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-bg motion-reduce:animate-none" />
      ))}
    </div>
  )
}
