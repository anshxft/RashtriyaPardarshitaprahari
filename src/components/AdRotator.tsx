'use client'

import { useEffect, useState } from 'react'

export type RotAd = { id: number; title: string; image: string; link?: string | null }

/** Every live ad of a placement gets its turn (one at a time, a few seconds each, soft fade). */
export function AdRotator({ ads, seconds = 7 }: { ads: RotAd[]; seconds?: number }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    // start on a random ad so different readers (and cached pages) don't all open on the same one
    setI(Math.floor(Math.random() * ads.length))
    if (ads.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % ads.length), seconds * 1000)
    return () => clearInterval(t)
  }, [ads.length, seconds])
  const ad = ads[i % ads.length]
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={ad.id} src={ad.image} alt={ad.title} loading="lazy" className="anim-fade mx-auto max-h-64 w-auto max-w-full rounded" />
  )
  return (
    <>
      {ad.link ? (
        <a href={ad.link} target="_blank" rel="sponsored noopener noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {ads.length > 1 && (
        <div className="mt-1.5 flex justify-center gap-1.5" aria-hidden>
          {ads.map((a, k) => (
            <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${k === i % ads.length ? 'bg-brand-600' : 'bg-line'}`} />
          ))}
        </div>
      )}
    </>
  )
}
