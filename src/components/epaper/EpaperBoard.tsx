/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { reorderAction, saveLayoutAction } from '@/app/(frontend)/[lang]/epaper/actions'
import { DATELINE_CITY, HELPLINE, TAGLINE_SHORT } from '@/content/brand'
import { siteUrl } from '@/lib/paths'
import { GEO, pageNo, sortStories, type EpStory, type Placed } from '@/lib/epaper'
import { t, type Lang } from '@/lib/i18n'
import type { Layout } from '@/lib/layout'
import { TricolorName } from '../TricolorName'
import { MobileEdition } from './MobileEdition'
import { StoryBlock } from './StoryBlock'
import { Tula } from './Tula'
import { usePack } from './usePack'

type Props = {
  lang: Lang
  date: string
  dateLabel: string
  siteName: string
  trustName?: string | null
  /** standing blocks that fill leftover space (editor's message, send-your-issue) */
  fillers?: EpStory[]
  regNo?: string | null
  ad?: EpStory | null
  stories: EpStory[]
  editions: { date: string; label: string; count: number }[]
  canEdit: boolean
}

const btn = 'rounded-md border border-line bg-bg px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50'
const tool = 'h-6 min-w-6 rounded bg-navy-900 px-1 text-[11px] leading-none font-bold text-white hover:bg-navy-700'

export function EpaperBoard({ lang, date, dateLabel, siteName, trustName, regNo, fillers, ad, stories, editions, canEdit }: Props) {
  const d = t(lang)
  // Masthead name stays on one line: Latin letters are wider, so the long English name gets a smaller size.
  const nameSize = /[a-z]/i.test(siteName) ? Math.min(72, Math.floor(1450 / siteName.length)) : 76
  const weekday = new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(new Date(`${date}T12:00:00+05:30`))
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
  const packed = usePack(eff, lang, ad, fillers)
  const ready = packed.ready
  const pages = stories.length ? packed.pages : [] // no stories that day → no empty masthead-only page
  const [zoom, setZoom] = useState(1)
  // Phones open the readable card view (client's layout); the A3 pages are one tap away.
  const [reading, setReading] = useState(false)
  useEffect(() => setReading(!canEdit && window.innerWidth < 768), [canEdit])

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
        {/* Readers: the whole story block opens only that story's own page (Read / Download / Print / Share live there). */}
        {!canEdit && pl.story.slot !== 'ad' && pl.story.url && <a href={pl.story.url} className="ep-open no-print" aria-label={pl.story.title} />}
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
            <button type="button" className={tool} title="Auto Fit" onClick={() => patch(baseId, { autoFit: !cur.layout.autoFit })}>{cur.layout.autoFit ? 'on' : 'off'}</button>
            <button type="button" className={tool} title="Reset" onClick={() => patch(baseId, { columns: null, bodyScale: 100, epaperPage: null, epaperOrder: null, autoFit: true })}>↺</button>
            <Link href={`/desk/news/${baseId}`} className={`${tool} inline-flex items-center`} title="Edit in Desk">✎</Link>
            {pl.story.url && (
              <a href={pl.story.url} target="_blank" rel="noreferrer" className={`${tool} inline-flex items-center`} title={d.openStory}>
                ↗
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <style>{`
        .ep-cell .ep-tools { opacity: 0; transition: opacity .15s }
        .ep-open { position: absolute; inset: 0; z-index: 1; border-radius: 2px }
        .ep-open:hover, .ep-open:focus-visible { outline: 2px solid #8f1d1f; outline-offset: -2px; background: rgba(143, 29, 31, .04) }
        .ep-cell:hover .ep-tools, .ep-cell:focus-within .ep-tools { opacity: 1 }
        @media (hover: none) { .ep-cell .ep-tools { opacity: 1 } }
        @media print {
          @page { size: A3 portrait; margin: 0 }
          .ep-sheet { display: block !important; break-after: page }
          .ep-wrap { width: ${GEO.pageW}px !important; height: ${GEO.pageH}px !important }
          .ep-page { transform: none !important; box-shadow: none !important; outline: none !important }
        }
      `}</style>

      <div className="no-print mb-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-navy-900 dark:text-white">{d.epaper}</h1>
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
          <button type="button" onClick={() => setReading(!reading)} className={`${btn} !bg-navy-900 !text-white`}>
            {reading ? (lang === 'hi' ? 'पूरा पेज (अखबार) देखें' : 'Full newspaper page') : lang === 'hi' ? 'मोबाइल पर पढ़ने का रूप' : 'Easy reading view'}
          </button>
          {!reading && <>
          {pages.map((p, i) => (
            <button key={p.number} type="button" onClick={() => (setView('page'), setIdx(i))} className={`${btn} ${view === 'page' && idx === i ? '!bg-navy-900 !text-white' : ''}`}>
              {pageNo(p.number)}
            </button>
          ))}
          <button type="button" onClick={() => setView(view === 'all' ? 'page' : 'all')} className={`${btn} ${view === 'all' ? '!bg-navy-900 !text-white' : ''}`}>
            {d.allPages}
          </button>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
          <button type="button" className={btn} onClick={() => window.print()}>
            {d.printA3}
          </button>
          <button type="button" className={btn} onClick={() => pageImage(pages[idx]?.number ?? 1)} disabled={!pages.length}>
            {d.pageImage}
          </button>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
          {[1, 1.5, 2].map((z) => (
            <button key={z} type="button" className={`${btn} ${zoom === z ? '!bg-navy-900 !text-white' : ''}`} onClick={() => setZoom(z)} aria-label={`zoom ${z}x`}>
              {z}×
            </button>
          ))}
          </>}
          {canEdit && (
            <Link href={`/desk/epaper-share?date=${date}`} className={btn}>
              {lang === 'hi' ? 'शेयर करें' : 'Share'}
            </Link>
          )}
          {canEdit && <span className="text-sm font-semibold text-brand-600">{d.layoutTools}</span>}
          {note && (
            <span role="status" className="text-sm font-semibold text-india-600">
              ✓ {note}
            </span>
          )}
        </div>
      </div>

      {reading && ready && (
        <MobileEdition lang={lang} siteName={siteName} dateLabel={dateLabel} weekday={weekday} regNo={regNo} ad={ad} stories={sortStories(eff).filter((s) => !s.slot)} />
      )}
      {/* Grey “desk” behind the white A3 sheets so the page edges are always clear (not printed). */}
      <div className={`${reading ? 'hidden print:block' : ''} rounded-xl bg-[#dcd8d1] p-2 sm:p-5 print:bg-transparent print:p-0 dark:bg-[#2b2925]`}>
      <div ref={wrap} className="w-full overflow-x-auto">
        {!ready && <p className="animate-pulse py-16 text-center text-muted motion-reduce:animate-none">{d.preparing}</p>}
        {ready && stories.length === 0 && <p className="py-16 text-center text-muted">{d.noEdition}</p>}
        {pages.map((pg, i) => (
          <section key={pg.number} className="ep-sheet anim-fade mb-6 last:mb-0" style={{ display: view === 'all' || idx === i ? 'block' : 'none' }} aria-label={`${d.pageWord} ${pg.number}`}>
            <div className="ep-wrap mx-auto" style={{ width: GEO.pageW * scale, height: GEO.pageH * scale }}>
              <div id={`ep-page-${pg.number}`} className="ep-page" style={{ position: 'relative', width: GEO.pageW, height: GEO.pageH, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#fff', color: '#111', boxShadow: '0 1px 2px rgba(0,0,0,.18), 0 6px 24px rgba(0,0,0,.22)', outline: '1px solid rgba(0,0,0,.12)', overflow: 'hidden' }}>
                {/* same masthead on every page */ pg.number > 0 && (
                  <header style={{ position: 'absolute', left: GEO.margin, top: GEO.margin - 8, width: GEO.pageW - GEO.margin * 2, height: GEO.mastheadH - 20, display: 'flex', flexDirection: 'column', background: '#e9eef5' }}>
                    {/* Client's banner (map · name · तुला); its own small text rows were cleaned off, so the trust line and the
                        correctly spelt tagline are live text here, and the date strip below is always today's. */}
                    <div style={{ position: 'relative', flex: 1, backgroundImage: 'url(/epaper-masthead.png)', backgroundSize: '100% 100%' }} role="img" aria-label={siteName}>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: 4, textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: '#13294b' }}>{siteUrl().replace(/^https?:\/\/(www\.)?/, 'www.')}</div>
                      <div style={{ position: 'absolute', left: '20%', right: '17%', top: '61%', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                          {trustName && <span>{lang === 'hi' ? `${trustName} द्वारा संचालित एवं प्रकाशित ` : `Run and published by ${trustName} · `}</span>}
                          {lang === 'hi' ? 'आधिकारिक ई-पेपर संस्करण' : 'Official E-Paper Edition'}
                        </div>
                        <div style={{ fontSize: 21, fontWeight: 700, color: '#b8860b', marginTop: 3 }}>
                          <span style={{ fontSize: 13, letterSpacing: 2 }}>····◆ </span>
                          {TAGLINE_SHORT}
                          <span style={{ fontSize: 13, letterSpacing: 2 }}> ◆····</span>
                        </div>
                      </div>
                    </div>
                    {/* Info line under the name: dateline left · registration / trust centre · price right */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, height: 28, flexShrink: 0, padding: '0 10px', background: '#13294b', fontSize: 13, whiteSpace: 'nowrap', fontWeight: 700, color: '#fff' }}>
                      <span>
                        {lang === 'hi' ? `${DATELINE_CITY.hi} से प्रकाशित` : `Published from ${DATELINE_CITY.en}`} · {weekday}, {dateLabel}
                      </span>
                      <span>{regNo ? `${lang === 'hi' ? 'पंजीकरण सं.' : 'Regd. No.'}: ${regNo}` : ''}</span>
                      <span style={{ textAlign: 'right' }}>{lang === 'hi' ? 'हेल्पलाइन' : 'Helpline'} (24x7): {HELPLINE}</span>
                    </div>
                  </header>
                )}
                {pg.placed.map((pl) => cell(pl, pg.number))}
                <div style={{ position: 'absolute', left: GEO.margin, right: GEO.margin, bottom: 12, height: 18, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#666', borderTop: '1px solid #ccc', paddingTop: 3 }}>
                  <span>
                    {siteName} · {dateLabel}
                  </span>
                  <span>{siteUrl().replace(/^https?:\/\//, '')}</span>
                  <span>
                    {d.pageWord} {pageNo(pg.number)} / {pageNo(pages.length)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
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
