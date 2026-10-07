/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { reorderAction, saveLayoutAction } from '@/app/(frontend)/[lang]/epaper/actions'
import { TAGLINE_SHORT } from '@/content/brand'
import { GEO, sortStories, type EpStory, type Placed } from '@/lib/epaper'
import { t, type Lang } from '@/lib/i18n'
import type { Layout } from '@/lib/layout'
import { StoryBlock } from './StoryBlock'
import { usePack } from './usePack'

type Props = {
  lang: Lang
  date: string
  dateLabel: string
  siteName: string
  descriptor?: string | null
  ad?: EpStory | null
  stories: EpStory[]
  editions: { date: string; label: string; count: number }[]
  canEdit: boolean
}

const btn = 'rounded-md border border-line bg-bg px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50'
const tool = 'h-6 min-w-6 rounded bg-navy-900 px-1 text-[11px] leading-none font-bold text-white hover:bg-navy-700'

export function EpaperBoard({ lang, date, dateLabel, siteName, descriptor, ad, stories, editions, canEdit }: Props) {
  const d = t(lang)
  const router = useRouter()
  const [patches, setPatches] = useState<Record<string, Layout>>({})
  const [view, setView] = useState<'page' | 'all'>('page')
  const [idx, setIdx] = useState(0)
  const [note, setNote] = useState('')
  const [, start] = useTransition()
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1000)

  const eff = useMemo(
    () => stories.map((s) => (patches[s.id] ? { ...s, layout: { ...s.layout, ...Object.fromEntries(Object.entries(patches[s.id]).filter(([, v]) => v !== undefined)) } as EpStory['layout'] } : s)),
    [stories, patches],
  )
  const { ready, pages } = usePack(eff, lang, ad)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,select,textarea')) return
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(pages.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [pages.length])
  useEffect(() => setIdx((i) => Math.min(i, Math.max(0, pages.length - 1))), [pages.length])

  // Pages are vector (real text), so any zoom stays sharp; zoom > 1 scrolls sideways.
  const scale = Math.min(1, width / GEO.pageW) * zoom
  const flash = (m: string) => {
    setNote(m)
    setTimeout(() => setNote(''), 2500)
  }

  const patch = useCallback(
    (id: string, p: Layout) => {
      setPatches((cur) => ({ ...cur, [id]: { ...cur[id], ...p } }))
      start(async () => {
        const r = await saveLayoutAction(Number(id), p)
        flash(r.ok ? d.layoutSaved : r.error || 'Error')
      })
    },
    [d.layoutSaved],
  )

  const move = (id: string, dir: -1 | 1) => {
    const order = sortStories(eff).map((s) => s.id)
    const i = order.indexOf(id.split('~')[0])
    const j = i + dir
    if (i < 0 || j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    setPatches((cur) => {
      const next = { ...cur }
      order.forEach((sid, k) => (next[sid] = { ...next[sid], epaperOrder: (k + 1) * 10 }))
      return next
    })
    start(async () => {
      const r = await reorderAction(order.map(Number))
      flash(r.ok ? d.layoutSaved : r.error || 'Error')
    })
  }

  async function pageImage(n: number) {
    const el = document.getElementById(`ep-page-${n}`)
    if (!el) return
    const { toBlob } = await import('html-to-image')
    // 2× = 2246 × 3174 px: above Full HD in both directions, crisp on any screen.
    const opts = { width: GEO.pageW, height: GEO.pageH, pixelRatio: 2, cacheBust: true, style: { transform: 'none', margin: '0' } }
    await toBlob(el, opts)
    const blob = await toBlob(el, opts)
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `epaper-${date}-p${n}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  const cell = (pl: Placed, pageNo: number) => {
    const baseId = pl.id.split('~')[0]
    const cur = eff.find((s) => s.id === baseId)
    return (
      <div key={pl.id} className="ep-cell" style={{ position: 'absolute', left: pl.x, top: pl.y, width: pl.w, height: pl.h, overflow: 'hidden' }}>
        <StoryBlock s={pl.story} cols={pl.variant.cols} scale={pl.variant.scale} take={pl.variant.take} lang={lang} />
        {canEdit && cur && pl.story.slot !== 'ad' && (
          <div className="ep-tools no-print" style={{ position: 'absolute', top: 3, right: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: pl.w - 6 }}>
            {pl.fitted && <span style={{ background: '#f28c1b', color: '#000', fontSize: 10, padding: '2px 4px', borderRadius: 3 }}>{d.autoFitted}</span>}
            {pl.pinFailed && <span style={{ background: '#d0201a', color: '#fff', fontSize: 10, padding: '2px 4px', borderRadius: 3 }}>{d.pinMissed}</span>}
            <button type="button" className={tool} title="Columns −" onClick={() => patch(baseId, { columns: Math.max(1, cur.layout.columns - 1) })}>◀ col</button>
            <button type="button" className={tool} title="Columns +" onClick={() => patch(baseId, { columns: Math.min(4, cur.layout.columns + 1) })}>col ▶</button>
            <button type="button" className={tool} title="Text smaller" onClick={() => patch(baseId, { bodyScale: Math.max(100, cur.layout.bodyScale - 5) })}>A−</button>
            <button type="button" className={tool} title="Text larger" onClick={() => patch(baseId, { bodyScale: Math.min(130, cur.layout.bodyScale + 5) })}>A+</button>
            <button type="button" className={tool} title="Earlier" onClick={() => move(baseId, -1)}>↑</button>
            <button type="button" className={tool} title="Later" onClick={() => move(baseId, 1)}>↓</button>
            <button type="button" className={tool} title="Pin to previous page" onClick={() => patch(baseId, { epaperPage: Math.max(1, pageNo - 1) })}>{d.pageWord}−</button>
            <button type="button" className={tool} title="Pin to next page" onClick={() => patch(baseId, { epaperPage: pageNo + 1 })}>{d.pageWord}+</button>
            <button type="button" className={tool} title="Auto Fit" onClick={() => patch(baseId, { autoFit: !cur.layout.autoFit })}>{cur.layout.autoFit ? '⚡ on' : '⚡ off'}</button>
            <button type="button" className={tool} title="Reset" onClick={() => patch(baseId, { columns: null, bodyScale: 100, epaperPage: null, epaperOrder: null, autoFit: true })}>↺</button>
            <Link href={`/desk/news/${baseId}`} className={`${tool} inline-flex items-center`} title="Edit in Desk">✎</Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <style>{`
        .ep-cell .ep-tools { opacity: 0; transition: opacity .15s }
        .ep-cell:hover .ep-tools, .ep-cell:focus-within .ep-tools { opacity: 1 }
        @media (hover: none) { .ep-cell .ep-tools { opacity: 1 } }
        @media print {
          @page { size: A3 portrait; margin: 0 }
          .ep-sheet { display: block !important; break-after: page }
          .ep-wrap { width: ${GEO.pageW}px !important; height: ${GEO.pageH}px !important }
          .ep-page { transform: none !important; box-shadow: none !important }
        }
      `}</style>

      <div className="no-print mb-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-navy-900 dark:text-gold-300">{d.epaper}</h1>
            <p className="text-muted">
              {dateLabel} · {stories.length} {d.storiesWord} · {pages.length || '…'} {d.pageWord.toLowerCase()}
            </p>
          </div>
          <label className="text-sm font-semibold">
            {d.editionOf}
            <select className="mt-1 block rounded-md border border-line bg-bg px-3 py-2 text-base font-normal" value={date} onChange={(e) => router.push(`/${lang}/epaper/${e.target.value}`)}>
              {!editions.some((e) => e.date === date) && <option value={date}>{dateLabel}</option>}
              {editions.map((e) => (
                <option key={e.date} value={e.date}>
                  {e.label} ({e.count})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pages.map((p, i) => (
            <button key={p.number} type="button" onClick={() => (setView('page'), setIdx(i))} className={`${btn} ${view === 'page' && idx === i ? '!bg-navy-900 !text-white' : ''}`}>
              {p.number}
            </button>
          ))}
          <button type="button" onClick={() => setView(view === 'all' ? 'page' : 'all')} className={`${btn} ${view === 'all' ? '!bg-navy-900 !text-white' : ''}`}>
            {d.allPages}
          </button>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
          <button type="button" className={btn} onClick={() => window.print()}>
            🖨 {d.printA3}
          </button>
          <button type="button" className={btn} onClick={() => pageImage(pages[idx]?.number ?? 1)} disabled={!pages.length}>
            🖼 {d.pageImage}
          </button>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
          {[1, 1.5, 2].map((z) => (
            <button key={z} type="button" className={`${btn} ${zoom === z ? '!bg-navy-900 !text-white' : ''}`} onClick={() => setZoom(z)} aria-label={`zoom ${z}x`}>
              🔍 {z}×
            </button>
          ))}
          {canEdit && (
            <Link href={`/desk/epaper-share?date=${date}`} className={btn}>
              📣 {lang === 'hi' ? 'शेयर करें' : 'Share'}
            </Link>
          )}
          {canEdit && <span className="text-sm font-semibold text-saffron-600">🛠 {d.layoutTools}</span>}
          {note && (
            <span role="status" className="text-sm font-semibold text-india-600">
              ✓ {note}
            </span>
          )}
        </div>
      </div>

      <div ref={wrap} className="w-full overflow-x-auto">
        {!ready && <p className="animate-pulse py-16 text-center text-muted motion-reduce:animate-none">{d.preparing}</p>}
        {ready && stories.length === 0 && <p className="py-16 text-center text-muted">{d.noEdition}</p>}
        {pages.map((pg, i) => (
          <section key={pg.number} className="ep-sheet anim-fade mb-6" style={{ display: view === 'all' || idx === i ? 'block' : 'none' }} aria-label={`${d.pageWord} ${pg.number}`}>
            <div className="ep-wrap" style={{ width: GEO.pageW * scale, height: GEO.pageH * scale }}>
              <div id={`ep-page-${pg.number}`} className="ep-page" style={{ position: 'relative', width: GEO.pageW, height: GEO.pageH, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#fff', color: '#111', boxShadow: '0 2px 18px rgba(0,0,0,.25)', overflow: 'hidden' }}>
                {pg.number === 1 && (
                  <header style={{ position: 'absolute', left: GEO.margin, top: GEO.margin - 8, width: GEO.pageW - GEO.margin * 2, height: GEO.mastheadH - 20, borderBottom: '4px double #0b1f4d', display: 'flex', alignItems: 'center', gap: 22 }}>
                    <img src="/logo.png" alt="" width={120} height={120} style={{ width: 120, height: 120, objectFit: 'contain' }} />
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mukta), sans-serif', fontWeight: 800, fontSize: 62, lineHeight: 1.08, color: '#0b1f4d' }}>{siteName}</div>
                      {descriptor && <div style={{ fontSize: 17, fontWeight: 700, color: '#0b1f4d', marginTop: 2 }}>{descriptor}</div>}
                      <div style={{ fontSize: 21, fontWeight: 700, color: '#c25a00', marginTop: 3 }}>{TAGLINE_SHORT}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 15, lineHeight: 1.5, color: '#333', minWidth: 190 }}>
                      <div style={{ fontWeight: 700 }}>{dateLabel}</div>
                      <div>{d.epaper}</div>
                      <div style={{ marginTop: 4, display: 'inline-block', border: '2px solid #0b1f4d', padding: '1px 8px', fontWeight: 800, color: '#0b1f4d' }}>मूल्य: निःशुल्क</div>
                    </div>
                  </header>
                )}
                {pg.placed.map((pl) => cell(pl, pg.number))}
                <div style={{ position: 'absolute', left: GEO.margin, right: GEO.margin, bottom: 12, height: 18, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#666', borderTop: '1px solid #ccc', paddingTop: 3 }}>
                  <span>
                    {siteName} · {dateLabel}
                  </span>
                  <span>
                    {d.pageWord} {pg.number} / {pages.length}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Plain list for screen readers / crawlers: the e-paper itself is drawn in the browser. */}
      <ul className="sr-only">
        {stories.map((s) => (
          <li key={s.id}>
            <a href={s.url}>{s.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
