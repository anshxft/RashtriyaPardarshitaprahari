/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import type { FlashItem } from '@/lib/flash'

const SHOW_MS = 10_000
const rand = (min: number, max: number) => min + Math.random() * (max - min)

/**
 * Pop-up Breaking Flash: flashes the desk marked “पॉप-अप” appear now and then in a corner card, stay ~10 s, then go.
 * First one 15–30 s after the page opens, later ones every 2–4 minutes; a reader who closes it isn't shown it again
 * in this visit. Reads the same live list as the ticker (/api/flash), so pausing/removing a flash stops it at once.
 */
export function FlashPopup({ lang }: { lang: 'hi' | 'en' }) {
  const [item, setItem] = useState<FlashItem | null>(null)
  const hi = lang === 'hi'

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let turn = 0
    const closed = () => {
      try {
        return new Set<number>(JSON.parse(sessionStorage.getItem('flash-popup-closed') || '[]'))
      } catch {
        return new Set<number>()
      }
    }
    const show = async () => {
      try {
        const res = await fetch(`/api/flash?lang=${lang}&kind=popup`)
        const { items } = (await res.json()) as { items: FlashItem[] }
        const pool = items.filter((f) => f.popup && !closed().has(f.id))
        if (pool.length) {
          setItem(pool[turn++ % pool.length])
          setTimeout(() => setItem(null), SHOW_MS)
        }
      } catch {
        /* offline — try again next round */
      }
      timer = setTimeout(show, rand(120_000, 240_000))
    }
    timer = setTimeout(show, rand(15_000, 30_000))
    return () => clearTimeout(timer)
  }, [lang])

  if (!item) return null
  const close = () => {
    try {
      const ids: number[] = JSON.parse(sessionStorage.getItem('flash-popup-closed') || '[]')
      sessionStorage.setItem('flash-popup-closed', JSON.stringify([...ids, item.id]))
    } catch {
      /* storage blocked — just hide */
    }
    setItem(null)
  }
  return (
    <div role="alert" className="anim-fade fixed bottom-24 left-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border-2 border-alert-600 bg-bg shadow-2xl">
      <div className="flex items-center justify-between bg-alert-600 px-3 py-1.5 text-sm font-extrabold tracking-wide text-white">
        <span className="animate-pulse motion-reduce:animate-none">🔴 {hi ? 'फ्लैश न्यूज़' : 'FLASH NEWS'}</span>
        <button type="button" onClick={close} aria-label={hi ? 'बंद करें' : 'Close'} className="rounded px-2 text-lg leading-none hover:bg-white/20">
          ×
        </button>
      </div>
      <a href={item.href || '#'} onClick={item.href ? undefined : (e) => e.preventDefault()} className="flex gap-3 p-3 hover:bg-surface">
        {item.photo && <img src={item.photo.src} alt={item.photo.alt} className="h-16 w-16 shrink-0 rounded object-cover" />}
        <span className="min-w-0 font-display text-[15px] leading-snug font-bold">
          {item.lines.join(' ')}
          {item.href && <span className="mt-1 block text-xs font-semibold text-link">{hi ? 'पूरी खबर पढ़ें →' : 'Read more →'}</span>}
        </span>
      </a>
    </div>
  )
}
