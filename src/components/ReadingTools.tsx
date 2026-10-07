'use client'

import { useEffect, useState } from 'react'

const KEY = 'story-font'
const SIZES = [90, 100, 115, 130]

/** Thin reading-progress line at the top of the screen while reading a story. */
export function ReadingProgress({ target }: { target: string }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = document.getElementById(target)
    if (!el) return
    const on = () => {
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      setP(total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total)))
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => (window.removeEventListener('scroll', on), window.removeEventListener('resize', on))
  }, [target])
  return <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-saffron-500 print:hidden" style={{ transform: `scaleX(${p})` }} />
}

/** अ− / अ+ : the reader's text size for story bodies (remembered on this device). */
export function FontSizer({ target, labels }: { target: string; labels: { smaller: string; larger: string } }) {
  const [i, setI] = useState(1)
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(KEY))
      if (SIZES.includes(v)) setI(SIZES.indexOf(v))
    } catch {}
  }, [])
  useEffect(() => {
    const el = document.getElementById(target)
    if (el) el.style.setProperty('--reader-scale', String(SIZES[i] / 100))
    try {
      localStorage.setItem(KEY, String(SIZES[i]))
    } catch {}
  }, [i, target])
  const b = 'h-9 min-w-9 rounded-md border border-line bg-bg px-2 font-bold hover:bg-surface disabled:opacity-40'
  return (
    <span className="inline-flex items-center gap-1 print:hidden">
      <button type="button" className={`${b} text-sm`} aria-label={labels.smaller} title={labels.smaller} disabled={i === 0} onClick={() => setI((x) => Math.max(0, x - 1))}>
        अ−
      </button>
      <button type="button" className={`${b} text-base`} aria-label={labels.larger} title={labels.larger} disabled={i === SIZES.length - 1} onClick={() => setI((x) => Math.min(SIZES.length - 1, x + 1))}>
        अ+
      </button>
    </span>
  )
}
