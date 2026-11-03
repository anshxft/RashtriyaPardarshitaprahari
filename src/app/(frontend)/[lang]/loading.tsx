/** Shown while a page is being prepared: a calm skeleton of a story list (no spinner jumping around). */
export default function Loading() {
  const bar = 'animate-pulse rounded bg-line/70 motion-reduce:animate-none'
  return (
    <div aria-busy="true" aria-live="polite" className="py-6">
      <span className="sr-only">लोड हो रहा है… / Loading…</span>
      <div className={`${bar} h-8 w-2/3`} />
      <div className={`${bar} mt-3 h-4 w-1/3`} />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className={`${bar} aspect-video w-full`} />
            <div className={`${bar} mt-3 h-5 w-11/12`} />
            <div className={`${bar} mt-2 h-5 w-3/4`} />
          </div>
        ))}
      </div>
    </div>
  )
}
