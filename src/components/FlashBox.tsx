/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FlashItem } from '@/lib/flash'
import type { Lang } from '@/lib/i18n'

const SHOW_MS = 8000 // one flash stays this long …
const GAP_MS = 1200 // … then fades away and the next one (or the same, if alone) comes back
const POLL_MS = 60_000 // fresh list without reloading the page (edits, pauses, new flashes)

const L = {
  hi: { badge: 'ब्रेकिंग न्यूज़', read: 'पूरी खबर पढ़ें', epaper: 'ई-पेपर में', updated: 'अपडेट', play: 'वीडियो चलाएँ', close: 'बंद करें', by: 'संवाददाता', of: 'में से' },
  en: { badge: 'Breaking News', read: 'Read full story', epaper: 'In the e-paper', updated: 'Updated', play: 'Play video', close: 'Close', by: 'Reporter', of: 'of' },
}

const time = (iso: string | undefined, lang: Lang) => {
  if (!iso) return ''
  const d = new Date(iso)
  const day = (x: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(x)
  const today = day(new Date()) === day(d)
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: 'Asia/Kolkata', ...(today ? {} : { day: 'numeric', month: 'short' }), hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

/** One flash: media on the left (photo, or video poster with a Play button), the short lines and links on the right. */
export function FlashCard({ item, lang, onPlay }: { item: FlashItem; lang: Lang; onPlay?: (src: string) => void }) {
  const t = L[lang]
  const edited = item.publishedAt && new Date(item.updatedAt).getTime() - new Date(item.publishedAt).getTime() > 60_000
  return (
    <div className="flex gap-3 md:gap-4">
      {(item.photo || item.video) && (
        <div className="w-28 shrink-0 sm:w-40 md:w-56">
          {item.video && (
            <button type="button" onClick={() => onPlay?.(item.video!.play)} className="group relative block aspect-video w-full overflow-hidden rounded bg-navy-900" aria-label={t.play}>
              <img src={item.video.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
              <span aria-hidden className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 pl-1 text-lg text-navy-900 shadow transition group-hover:scale-105">
                ▶
              </span>
            </button>
          )}
          {item.photo && (
            <div className={`aspect-video w-full overflow-hidden rounded bg-surface ${item.video ? 'mt-2 hidden md:block' : ''}`}>
              <img src={item.photo.src} alt={item.photo.alt} className="h-full w-full object-cover object-[50%_30%]" loading="lazy" />
            </div>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-alert-600 px-2 py-0.5 font-bold tracking-wide text-white uppercase">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white" />
            {t.badge}
          </span>
          <time dateTime={item.publishedAt} className="text-muted">
            {time(item.publishedAt || item.updatedAt, lang)}
            {edited && ` · ${t.updated} ${time(item.updatedAt, lang)}`}
          </time>
        </p>
        {item.lines.map((line, i) => (
          <p key={i} className={`mt-1 line-clamp-2 break-words ${i === 0 ? 'font-display text-base leading-snug font-bold md:text-xl' : 'text-sm leading-snug md:text-base'}`}>
            {line}
          </p>
        ))}
        {(item.caption || item.reporter) && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">{[item.caption, item.reporter && `${t.by}: ${item.reporter}`].filter(Boolean).join(' · ')}</p>
        )}
        {(item.href || item.epaperHref) && (
          <p className="mt-2 flex flex-wrap gap-x-4 text-sm font-semibold">
            {item.href && (
              <Link href={item.href} className="text-link hover:underline">
                {t.read} →
              </Link>
            )}
            {item.epaperHref && (
              <Link href={item.epaperHref} className="text-muted hover:underline">
                {t.epaper}
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Home-page Breaking Flash: shows one flash at a time, fades out after a few seconds and brings in the next (or the same
 * one again) — calm, newspaper-like, no flicker. Hover / keyboard focus / an open video pause it. Polls for changes.
 */
export function FlashBox({ initial, lang }: { initial: FlashItem[]; lang: Lang }) {
  const [items, setItems] = useState(initial)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(true)
  const [hold, setHold] = useState(false)
  const [video, setVideo] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const load = useCallback(() => {
    fetch(`/api/flash?lang=${lang}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { items?: FlashItem[] } | null) => j?.items && setItems(j.items))
      .catch(() => {})
  }, [lang])

  useEffect(() => {
    const id = setInterval(load, POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => (clearInterval(id), document.removeEventListener('visibilitychange', onVisible))
  }, [load])

  useEffect(() => {
    if (hold || video) return
    const out = setTimeout(() => setShown(false), SHOW_MS)
    const next = setTimeout(() => {
      setI((n) => n + 1)
      setShown(true)
    }, SHOW_MS + GAP_MS)
    return () => (clearTimeout(out), clearTimeout(next))
  }, [i, hold, video])

  useEffect(() => {
    if (video) dialog.current?.showModal()
    else dialog.current?.close()
  }, [video])

  if (!items.length) return null
  const k = i % items.length
  const item = items[k]
  const t = L[lang]

  return (
    <section
      aria-label={t.badge}
      className="rounded-lg border border-line border-l-4 border-l-alert-600 bg-bg p-3 shadow-sm md:p-4"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      <div className={`transition-all duration-500 motion-reduce:transition-none ${shown ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}>
        <FlashCard key={item.id} item={item} lang={lang} onPlay={setVideo} />
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-end gap-1.5" aria-label={`${k + 1} ${t.of} ${items.length}`}>
          {items.map((f, n) => (
            <button
              key={f.id}
              type="button"
              aria-label={`${n + 1}`}
              aria-current={n === k}
              onClick={() => (setI(n), setShown(true))}
              className={`h-1.5 rounded-full transition-all ${n === k ? 'w-5 bg-alert-600' : 'w-1.5 bg-line hover:bg-muted'}`}
            />
          ))}
        </div>
      )}
      <dialog ref={dialog} onClose={() => setVideo(null)} className="m-auto w-[min(92vw,960px)] rounded-lg bg-black p-0 backdrop:bg-black/70">
        {video && <video src={video} controls autoPlay playsInline className="aspect-video w-full bg-black" />}
        <form method="dialog" className="flex justify-end bg-black p-2">
          <button className="rounded px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10">{t.close} ✕</button>
        </form>
      </dialog>
    </section>
  )
}
