'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition, type PointerEvent as RPointerEvent } from 'react'
import { resetEpaperLayoutAction, saveEpaperLayoutAction } from '@/app/(desk)/desk/epaper-layout/actions'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { clampItem, colW, colX, compactUp, contentBottom, contentTop, flowLayout, GEO, settleDown, manualStory, MAX_PAGES, spanW, toManual, type EpStory, type ManualItem, type ManualLayout } from '@/lib/epaper'
import { StoryBlock } from './StoryBlock'
import { usePack } from './usePack'

type Props = {
  date: string
  dateLabel: string
  editions: { date: string; label: string; count: number }[]
  stories: EpStory[]
  ads: EpStory[]
  fillers: EpStory[]
  saved: ManualLayout | null
}
type Drag = { ref: string; mode: 'move' | 'size'; px: number; py: number; offX: number; offY: number; start: ManualItem }

const btn = 'rounded-lg border border-line bg-bg px-3 py-2 text-sm font-bold hover:bg-surface disabled:opacity-40'
const small = 'rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm font-bold hover:bg-surface disabled:opacity-40'
const STEP = colW + GEO.gutter
const snapY = (y: number) => Math.round(y / 4) * 4
const overlaps = (a: ManualItem, b: ManualItem) => a.col < b.col + b.span && b.col < a.col + a.span && a.y < b.y + b.h && b.y < a.y + a.h

/**
 * Hand layout for one edition: every story / ad is a block on the 6-column A3 grid. Drag a block to move it, drag its
 * corner to change width (columns) and height; the panel moves it to another page, changes text size or fits the
 * height to its text. Starts from today's automatic layout; “सेव करें” makes the website e-paper use it.
 */
export function EpaperDesigner({ date, dateLabel, editions, stories, ads, fillers, saved }: Props) {
  const router = useRouter()
  const auto = usePack(stories, 'hi', ads[0] ?? null, fillers, ads)
  const [layout, setLayout] = useState<ManualLayout | null>(saved)
  const [pageIdx, setPageIdx] = useState(0)
  const [view, setView] = useState<'all' | 'one'>('all')
  const pageEls = useRef<(HTMLDivElement | null)[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const [natural, setNatural] = useState<Record<string, number>>({})
  const [toFit, setToFit] = useState<Set<string>>(new Set())
  const drag = useRef<Drag | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)

  // No saved design yet → start from what the automatic layout gives today.
  useEffect(() => {
    if (!layout && auto.ready && auto.pages.length) setLayout(toManual(auto.pages))
  }, [layout, auto.ready, auto.pages])

  // Saved design + stories it doesn't hold (published later / left out): the website lays them out automatically on
  // extra pages after the design — show exactly those pages here too, so every page can be seen and changed.
  const leftover = useMemo(() => {
    if (!saved) return [] as EpStory[]
    const inSaved = new Set(saved.pages.flat().map((i) => i.ref.split('~')[0]))
    return stories.filter((s) => !inSaved.has(s.id))
  }, [saved, stories])
  const none = useMemo<EpStory[]>(() => [], [])
  const rest = usePack(leftover, 'hi', null, none, none)
  const [restAdded, setRestAdded] = useState(false)
  useEffect(() => {
    if (restAdded || !saved || !leftover.length || !rest.ready || !rest.pages.length) return
    const extra = toManual(rest.pages).pages
    if (!extra.length) return
    setRestAdded(true)
    setLayout((l) => (l ? { pages: [...l.pages, ...extra] } : l))
    setDirty(true)
    setNote({ ok: true, text: `डिज़ाइन के बाद अपने-आप बने ${extra.length} पेज भी यहाँ जोड़ दिए — बदलकर “सेव करें”।` })
  }, [restAdded, saved, leftover, rest.ready, rest.pages])

  // Once the pages are there, flow every long story through its blocks (fixes text cut off in older designs).
  const [flowed, setFlowed] = useState(false)
  useEffect(() => {
    if (flowed || !layout || (saved && leftover.length && !restAdded)) return
    setFlowed(true)
    reflow(Boolean(saved))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowed, layout, restAdded])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = Math.min(1, width / GEO.pageW)

  const pool = useMemo(() => new Map([...stories, ...ads, ...fillers].map((s) => [s.id, s])), [stories, ads, fillers])
  const pages = layout?.pages ?? []
  const page = pages[pageIdx] ?? []
  const used = new Set(pages.flat().map((i) => i.ref.split('~')[0]))
  const unplaced = [...stories, ...ads, ...fillers].filter((s) => !used.has(s.id))
  const selPage = pages.findIndex((p) => p.some((i) => i.ref === sel))
  const selItem = selPage >= 0 ? pages[selPage].find((i) => i.ref === sel) || null : null
  const selStory = selItem ? manualStory(selItem, pool) : undefined

  const layoutRef = useRef(layout)
  layoutRef.current = layout
  // Undo / redo: a snapshot before every change (a whole drag counts as one change).
  const past = useRef<string[]>([])
  const future = useRef<string[]>([])
  const [, bump] = useState(0)
  const snapshot = () => {
    if (!layoutRef.current) return
    past.current = [...past.current.slice(-59), JSON.stringify(layoutRef.current)]
    future.current = []
    bump((n) => n + 1)
  }
  const undo = () => {
    const prev = past.current.pop()
    if (!prev || !layoutRef.current) return
    future.current.push(JSON.stringify(layoutRef.current))
    setLayout(JSON.parse(prev))
    setDirty(true)
    bump((n) => n + 1)
  }
  const redo = () => {
    const next = future.current.pop()
    if (!next || !layoutRef.current) return
    past.current.push(JSON.stringify(layoutRef.current))
    setLayout(JSON.parse(next))
    setDirty(true)
    bump((n) => n + 1)
  }
  const update = (fn: (l: ManualLayout) => ManualLayout, record = true) => {
    if (record && !drag.current) snapshot()
    setLayout((l) => (l ? fn(l) : l))
    setDirty(true)
  }
  /** After a block moved / changed size: blocks it now covers slide down below it, then the text re-flows. */
  const settle = (ref: string) => {
    update((l) => ({ pages: l.pages.map((p) => (p.some((i) => i.ref === ref) ? settleDown(p, ref) : p)) }), false)
    reflow()
  }
  // Re-flow text after a size change: each block keeps the size given to it and takes the paragraphs that fit; the rest
  // moves on to the story's next “(जारी)” block (a new one is opened on the next page when needed).
  const reflow = (markDirty = true) =>
    setTimeout(async () => {
      await document.fonts.ready // measure with the real newspaper fonts
      const l = layoutRef.current
      if (!l) return
      const host = document.createElement('div')
      host.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none'
      document.body.appendChild(host)
      const root = createRoot(host)
      const height = (s: EpStory, span: number, scale: number) => {
        flushSync(() => root.render(<StoryBlock s={s} cols={span} scale={scale} lang="hi" />))
        return (host.firstElementChild as HTMLElement).getBoundingClientRect().height
      }
      try {
        const next = flowLayout(l, pool, (s, from, span, scale, h) => {
          const part = (k: number) => manualStory({ ref: from > 0 ? `${s.id}~c1` : s.id, col: 0, span, y: 0, h, from, take: k }, pool)!
          let lo = 1
          let hi = s.paragraphs.length - from
          if (height(part(hi), span, scale) <= h) return hi
          while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2)
            if (height(part(mid), span, scale) <= h) lo = mid
            else hi = mid - 1
          }
          return lo
        }, (s, from, take, span, scale) => height(manualStory({ ref: from > 0 ? `${s.id}~c1` : s.id, col: 0, span, y: 0, h: 0, from, take }, pool)!, span, scale))
        if (JSON.stringify(next) !== JSON.stringify(l)) {
          setLayout(next)
          if (markDirty) setDirty(true)
        }
      } finally {
        setTimeout(() => (root.unmount(), host.remove()), 0)
      }
    }, 30)
  const setItem = (ref: string, patch: Partial<ManualItem>) =>
    update((l) => ({ pages: l.pages.map((p) => p.map((i) => (i.ref === ref ? clampItem({ ...i, ...patch }) : i))) }))

  // Measure each block's real text height (unscaled) so we can warn about cut text and “fit” heights.
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const next: Record<string, number> = {}
    el.querySelectorAll<HTMLElement>('[data-inner]').forEach((n) => (next[n.dataset.inner!] = n.offsetHeight))
    const changed = Object.keys(next).some((k) => Math.abs((natural[k] ?? -1) - next[k]) > 1)
    if (changed) setNatural((cur) => ({ ...cur, ...next }))
    if (toFit.size) {
      const fits = [...toFit].filter((r) => next[r])
      if (fits.length) {
        setToFit((s) => new Set([...s].filter((r) => !fits.includes(r))))
        update((l) => ({ pages: l.pages.map((p) => p.map((i) => (fits.includes(i.ref) ? clampItem({ ...i, h: next[i.ref] + 4 }) : i))) }), false)
      }
    }
  })

  // Dragging listens on the whole window, so a block can be carried from one page onto another.
  const onDown = (e: RPointerEvent, ref: string, mode: Drag['mode'], pg: number) => {
    const it = pages[pg]?.find((i) => i.ref === ref)
    const el = pageEls.current[pg]
    if (!it || !el) return
    e.preventDefault()
    e.stopPropagation()
    const r = el.getBoundingClientRect()
    snapshot()
    drag.current = { ref, mode, px: e.clientX, py: e.clientY, offX: (e.clientX - r.left) / scale - colX(it.col), offY: (e.clientY - r.top) / scale - it.y, start: it }
    setSel(ref)
    setPageIdx(pg)
    const move = (ev: PointerEvent) => {
      const d = drag.current
      if (!d) return
      if (d.mode === 'size') {
        const dx = (ev.clientX - d.px) / scale
        const dy = (ev.clientY - d.py) / scale
        // widening stops at the page edge (the block stays where it is instead of sliding left)
        setItem(d.ref, { span: Math.min(GEO.cols - d.start.col, d.start.span + Math.round(dx / STEP)), h: snapY(d.start.h + dy) })
        return
      }
      // which page is under the pointer?
      let target = -1
      let best = Infinity
      pageEls.current.forEach((pe, i) => {
        if (!pe) return
        const rr = pe.getBoundingClientRect()
        const dist = ev.clientY < rr.top ? rr.top - ev.clientY : ev.clientY > rr.bottom ? ev.clientY - rr.bottom : 0
        if (dist < best) (best = dist), (target = i)
      })
      if (target < 0) return
      const rr = pageEls.current[target]!.getBoundingClientRect()
      const col = Math.round(((ev.clientX - rr.left) / scale - d.offX - GEO.margin) / STEP)
      const y = snapY((ev.clientY - rr.top) / scale - d.offY)
      update((l) => {
        const from = l.pages.findIndex((p) => p.some((i) => i.ref === d.ref))
        if (from < 0) return l
        const cur = l.pages[from].find((i) => i.ref === d.ref)!
        const next = clampItem({ ...cur, col, y })
        if (from === target) return { pages: l.pages.map((p, i) => (i === from ? p.map((x) => (x.ref === d.ref ? next : x)) : p)) }
        return { pages: l.pages.map((p, i) => (i === from ? p.filter((x) => x.ref !== d.ref) : i === target ? [...p, next] : p)) }
      })
      setPageIdx(target)
    }
    const up = () => {
      const d = drag.current
      drag.current = null
      if (d) settle(d.ref)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const addToPage = (s: EpStory) => {
    const bottom = Math.max(contentTop, ...page.map((i) => i.y + i.h + GEO.blockGap))
    const span = s.slot === 'ad' ? 2 : Math.max(1, Math.min(4, s.layout?.columns ?? 2))
    update((l) => {
      const ps = l.pages.length ? l.pages.map((p) => [...p]) : [[]]
      ps[pageIdx] = [...(ps[pageIdx] ?? []), clampItem({ ref: s.id, col: 0, span, y: Math.min(bottom, contentBottom - 200), h: 400 })]
      return { pages: ps }
    })
    setToFit((t) => new Set(t).add(s.id))
    setSel(s.id)
  }
  const remove = (ref: string) => (update((l) => ({ pages: l.pages.map((p) => p.filter((i) => i.ref !== ref)) })), setSel(null))
  const toPage = (ref: string, target: number) =>
    update((l) => {
      const it = l.pages.flat().find((i) => i.ref === ref)
      if (!it) return l
      const ps = l.pages.map((p) => p.filter((i) => i.ref !== ref))
      while (ps.length <= target) ps.push([])
      const bottom = Math.max(contentTop, ...ps[target].map((i) => i.y + i.h + GEO.blockGap))
      ps[target] = [...ps[target], clampItem({ ...it, y: Math.min(bottom, contentBottom - it.h) })]
      return { pages: ps }
    })

  const save = () =>
    start(async () => {
      if (!layout) return
      const r = await saveEpaperLayoutAction(date, { pages: layout.pages.filter((p, i) => p.length || i < layout.pages.length - 1) })
      setNote(r.ok ? { ok: true, text: 'डिज़ाइन सेव ✔ — वेबसाइट के ई-पेपर में यही दिखेगा' } : { ok: false, text: r.error })
      if (r.ok) setDirty(false)
    })
  const backToAuto = () => {
    if (!window.confirm('हाथ से बना डिज़ाइन हटाकर ई-पेपर को फिर से अपने-आप (ऑटो) बनने दें?')) return
    start(async () => {
      const r = await resetEpaperLayoutAction(date)
      setNote(r.ok ? { ok: true, text: 'ऑटो लेआउट वापस चालू ✔' } : { ok: false, text: r.error })
      if (r.ok) {
        setLayout(auto.pages.length ? toManual(auto.pages) : null)
        setDirty(false)
      }
    })
  }

  // Keyboard: arrows move the chosen block (Shift = bigger steps), Delete takes it off the page, Ctrl+Z / Ctrl+Y.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,select,textarea')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') return e.preventDefault(), e.shiftKey ? redo() : undo()
      if (mod && e.key.toLowerCase() === 'y') return e.preventDefault(), redo()
      const it = selItem
      if (!it) return
      const step = e.shiftKey ? 40 : 8
      const moves: Record<string, Partial<ManualItem>> = { ArrowLeft: { col: it.col - 1 }, ArrowRight: { col: it.col + 1 }, ArrowUp: { y: it.y - step }, ArrowDown: { y: it.y + step } }
      if (moves[e.key]) {
        e.preventDefault()
        setItem(it.ref, moves[e.key])
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        remove(it.ref)
      } else if (e.key === 'Escape') setSel(null)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })
  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const bad = new Set<string>()
  pages.forEach((pg) => pg.forEach((a, i) => pg.slice(i + 1).forEach((b) => overlaps(a, b) && (bad.add(a.ref), bad.add(b.ref)))))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">ई-पेपर डिज़ाइनर</h1>
          <p className="text-sm text-muted">खबर या विज्ञापन को खींचकर जगह बदलें (एक पेज से दूसरे पेज पर भी) · नीचे-दाएं कोने ◢ को खींचकर चौड़ाई (कॉलम) और लंबाई बदलें · फिर “सेव करें”। कॉलम के नीचे बची खाली जगह ई-पेपर में अपने-आप हेल्पलाइन / “अपनी खबर भेजें” बॉक्स से भर जाएगी। कीबोर्ड: ← → ↑ ↓ से खिसकाएं (Shift के साथ ज़्यादा), Delete से हटाएं, Ctrl+Z वापस।</p>
        </div>
        <label className="text-sm font-semibold">
          अंक (तारीख)
          <select className="mt-1 block rounded-md border border-line bg-bg px-3 py-2" value={date} onChange={(e) => router.push(`/desk/epaper-layout?date=${e.target.value}`)}>
            {!editions.some((e) => e.date === date) && <option value={date}>{dateLabel}</option>}
            {editions.map((e) => (
              <option key={e.date} value={e.date}>
                {e.label} ({e.count})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg/95 p-2 shadow-sm backdrop-blur">
        <button type="button" onClick={save} disabled={pending || !layout || !dirty} className="rounded-lg bg-india-600 px-5 py-2 font-extrabold text-white disabled:opacity-50">
          {pending ? 'सेव हो रहा है…' : dirty ? 'सेव करें' : 'सेव है ✔'}
        </button>
        <button type="button" className={btn} onClick={undo} disabled={!past.current.length} title="Ctrl+Z">
          ↶ वापस
        </button>
        <button type="button" className={btn} onClick={redo} disabled={!future.current.length} title="Ctrl+Y">
          ↷ आगे
        </button>
        <button type="button" className={btn} disabled={!auto.ready} onClick={() => window.confirm('अभी के बदलाव हटाकर ऑटो लेआउट से दोबारा शुरू करें?') && (update(() => toManual(auto.pages)), setPageIdx(0), reflow())}>
          ↺ ऑटो से दोबारा शुरू
        </button>
        {saved && (
          <button type="button" className={btn} onClick={backToAuto} disabled={pending}>
            ऑटो पर वापस जाएँ
          </button>
        )}
        <a href={`/hi/epaper/${date}`} target="_blank" rel="noreferrer" className={btn}>
          ई-पेपर देखें ↗
        </a>
        {note && <span className={`text-sm font-semibold ${note.ok ? 'text-india-700' : 'text-alert-700'}`}>{note.text}</span>}
        {saved ? <span className="ml-auto rounded bg-navy-900 px-2 py-1 text-xs font-bold text-white">हाथ से बना डिज़ाइन चालू</span> : <span className="ml-auto rounded bg-slate-200 px-2 py-1 text-xs font-bold">अभी ऑटो लेआउट</span>}
      </div>

      {!layout ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">{stories.length ? 'पेज तैयार हो रहे हैं…' : 'इस तारीख की कोई ई-पेपर खबर नहीं है।'}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {pages.map((p, i) => (
                <button key={i} type="button" onClick={() => (setPageIdx(i), setSel(null), view === 'all' && pageEls.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))} className={`${small} ${i === pageIdx ? '!border-navy-900 !bg-navy-900 text-white' : ''}`}>
                  पेज {i + 1} <span className="opacity-70">({p.length})</span>
                </button>
              ))}
              <button type="button" className={`${small} ${view === 'all' ? '!border-navy-900 !bg-navy-900 text-white' : ''}`} onClick={() => setView(view === 'all' ? 'one' : 'all')}>
                {view === 'all' ? '✔ सभी पेज एक साथ' : 'सभी पेज एक साथ दिखाएं'}
              </button>
              <button type="button" className={small} disabled={pages.length >= MAX_PAGES} onClick={() => (update((l) => ({ pages: [...l.pages, []] })), setPageIdx(pages.length), setSel(null))}>
                + नया पेज
              </button>
            </div>

            <div ref={box} className="w-full space-y-6">
              {pages.map((pg, pi) =>
                view === 'one' && pi !== pageIdx ? null : (
                  <div key={pi}>
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <p className={`mr-1 text-sm font-bold ${pi === pageIdx ? 'text-[#1f6fd1]' : 'text-muted'}`}>
                        पेज {pi + 1} <span className="font-normal">({pg.length} ब्लॉक)</span>
                      </p>
                      <button type="button" className={small} disabled={!pg.length} title="सभी ब्लॉक ऊपर खिसकाकर बीच की खाली जगह हटाएं" onClick={() => (update((l) => ({ pages: l.pages.map((p, i) => (i === pi ? compactUp(p) : p)) })), reflow())}>
                        ⬆ खाली जगह भरें
                      </button>
                      <button type="button" className={small} disabled={pi === 0} title="इस पेज को एक नंबर पहले करें" onClick={() => (update((l) => ({ pages: l.pages.map((p, i) => (i === pi - 1 ? l.pages[pi] : i === pi ? l.pages[pi - 1] : p)) })), setPageIdx(pi - 1), reflow())}>
                        पेज ↑
                      </button>
                      <button type="button" className={small} disabled={pi === pages.length - 1} title="इस पेज को एक नंबर बाद करें" onClick={() => (update((l) => ({ pages: l.pages.map((p, i) => (i === pi + 1 ? l.pages[pi] : i === pi ? l.pages[pi + 1] : p)) })), setPageIdx(pi + 1), reflow())}>
                        पेज ↓
                      </button>
                      {!pg.length && pages.length > 1 && (
                        <button type="button" className={`${small} text-alert-700`} onClick={() => (update((l) => ({ pages: l.pages.filter((_, i) => i !== pi) })), setPageIdx(Math.max(0, pi - 1)))}>
                          खाली पेज हटाएं
                        </button>
                      )}
                    </div>
                    <div style={{ width: GEO.pageW * scale, height: GEO.pageH * scale }} className="mx-auto">
                      <div
                        ref={(el) => {
                          pageEls.current[pi] = el
                        }}
                        onPointerDown={() => (setSel(null), setPageIdx(pi))}
                        style={{ position: 'relative', width: GEO.pageW, height: GEO.pageH, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#fff', color: '#111', boxShadow: pi === pageIdx ? '0 0 0 6px #1f6fd1, 0 2px 12px rgba(0,0,0,.25)' : '0 2px 12px rgba(0,0,0,.25)' }}
                      >
                        {/* column guides */}
                        {Array.from({ length: GEO.cols }, (_, c) => (
                          <div key={c} style={{ position: 'absolute', left: colX(c), top: contentTop, width: colW, height: contentBottom - contentTop, background: 'rgba(19,41,75,.04)', borderLeft: '1px dashed rgba(19,41,75,.15)', borderRight: '1px dashed rgba(19,41,75,.15)' }} />
                        ))}
                        <div style={{ position: 'absolute', left: GEO.margin, top: GEO.margin, right: GEO.margin, height: contentTop - GEO.margin - 12, background: '#e9eef5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, color: '#13294b', opacity: 0.8 }}>
                          मास्टहेड (नाम · तारीख) — पेज {pi + 1}
                        </div>
                        <div style={{ position: 'absolute', left: GEO.margin, right: GEO.margin, top: contentBottom, borderTop: '2px dashed #bbb' }} />

                        {pg.map((it) => {
                          const s = manualStory(it, pool)
                          if (!s) return null
                          const over = (natural[it.ref] ?? 0) > it.h + 2
                          const on = sel === it.ref
                          return (
                            <div
                              key={it.ref}
                              onPointerDown={(e) => onDown(e, it.ref, 'move', pi)}
                              style={{ position: 'absolute', left: colX(it.col), top: it.y, width: spanW(it.span), height: it.h, overflow: 'hidden', cursor: 'move', touchAction: 'none', outline: bad.has(it.ref) ? '4px solid #d0201a' : on ? '4px solid #1f6fd1' : '2px dashed rgba(19,41,75,.35)', outlineOffset: 2, background: '#fff', zIndex: on ? 2 : 1 }}
                            >
                              <div data-inner={it.ref} style={{ pointerEvents: 'none' }}>
                                <StoryBlock s={s} cols={it.span} scale={it.scale ?? 1} lang="hi" height={it.h} />
                              </div>
                              {over && <span style={{ position: 'absolute', left: 0, bottom: 0, background: '#f28c1b', color: '#000', fontSize: 20, fontWeight: 800, padding: '4px 10px' }}>✂ टेक्स्ट कट रहा है</span>}
                              <span
                                onPointerDown={(e) => onDown(e, it.ref, 'size', pi)}
                                title="खींचकर चौड़ाई / लंबाई बदलें"
                                style={{ position: 'absolute', right: 0, bottom: 0, width: 44, height: 44, background: on ? '#1f6fd1' : 'rgba(19,41,75,.75)', cursor: 'nwse-resize', touchAction: 'none', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            {selItem && selStory ? (
              <section className="space-y-3 rounded-xl border-2 border-[#1f6fd1] bg-bg p-3">
                <p className="line-clamp-2 font-bold">{selStory.slot === 'ad' ? `विज्ञापन: ${selStory.title}` : selStory.title}</p>
                {bad.has(selItem.ref) && <p className="rounded bg-alert-600/10 p-2 text-xs font-bold text-alert-700">यह किसी दूसरे ब्लॉक के ऊपर चढ़ा है — खिसकाकर अलग करें।</p>}
                {(natural[selItem.ref] ?? 0) > selItem.h + 2 && <p className="rounded bg-saffron-500/20 p-2 text-xs font-bold">टेक्स्ट पूरा नहीं आ रहा — “ऊंचाई फिट करें” दबाएं, या कॉलम / अक्षर का आकार बदलें।</p>}
                <Row label={`कॉलम (चौड़ाई): ${selItem.span}`}>
                  <button type="button" className={small} onClick={() => (setItem(selItem.ref, { span: selItem.span - 1 }), settle(selItem.ref))}>−</button>
                  <button type="button" className={small} onClick={() => (setItem(selItem.ref, { span: selItem.span + 1 }), settle(selItem.ref))}>+</button>
                </Row>
                <Row label={`ऊंचाई: ${selItem.h}`}>
                  <button type="button" className={small} onClick={() => (setItem(selItem.ref, { h: selItem.h - 40 }), settle(selItem.ref))}>−</button>
                  <button type="button" className={small} onClick={() => (setItem(selItem.ref, { h: selItem.h + 40 }), settle(selItem.ref))}>+</button>
                  <button type="button" className={small} onClick={() => natural[selItem.ref] && setItem(selItem.ref, { h: natural[selItem.ref] + 4 })}>फिट करें</button>
                </Row>
                {selStory.slot !== 'ad' && (
                  <Row label={`अक्षर का आकार: ${Math.round((selItem.scale ?? 1) * 100)}%`}>
                    <button type="button" className={small} onClick={() => (setItem(selItem.ref, { scale: (selItem.scale ?? 1) - 0.05 }), settle(selItem.ref))}>A−</button>
                    <button type="button" className={small} onClick={() => (setItem(selItem.ref, { scale: (selItem.scale ?? 1) + 0.05 }), settle(selItem.ref))}>A+</button>
                  </Row>
                )}
                <Row label="बाएं / दाएं · ऊपर / नीचे">
                  <button type="button" className={small} onClick={() => setItem(selItem.ref, { col: selItem.col - 1 })}>◀</button>
                  <button type="button" className={small} onClick={() => setItem(selItem.ref, { col: selItem.col + 1 })}>▶</button>
                  <button type="button" className={small} onClick={() => setItem(selItem.ref, { y: selItem.y - 20 })}>▲</button>
                  <button type="button" className={small} onClick={() => setItem(selItem.ref, { y: selItem.y + 20 })}>▼</button>
                </Row>
                <label className="block text-sm font-semibold">
                  दूसरे पेज पर भेजें
                  <select className="mt-1 block w-full rounded-md border border-line bg-bg px-2 py-1.5" value={selPage} onChange={(e) => (toPage(selItem.ref, Number(e.target.value)), setPageIdx(Number(e.target.value)))}>
                    {[...pages.map((_, i) => i), pages.length].map((i) => (
                      <option key={i} value={i}>
                        {i < pages.length ? `पेज ${i + 1}` : `नया पेज ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={`${small} w-full text-alert-700`} onClick={() => remove(selItem.ref)}>
                  इस पेज से हटाएं (नीचे की सूची में चला जाएगा)
                </button>
              </section>
            ) : (
              <p className="rounded-xl border border-dashed border-line bg-bg p-3 text-sm text-muted">किसी खबर / विज्ञापन पर क्लिक करें — यहाँ उसके बटन आएंगे।</p>
            )}

            <section className="rounded-xl border border-line bg-bg p-3">
              <h2 className="mb-2 font-bold">पेज पर नहीं लगी ({unplaced.length})</h2>
              {unplaced.length === 0 ? (
                <p className="text-sm text-muted">सब कुछ किसी न किसी पेज पर लगा है ✔</p>
              ) : (
                <ul className="max-h-96 space-y-2 overflow-y-auto">
                  {unplaced.map((s) => (
                    <li key={s.id} className="rounded-lg border border-line p-2 text-sm">
                      <p className="line-clamp-2 font-semibold">{s.slot === 'ad' ? `📢 विज्ञापन: ${s.title}` : s.slot === 'filler' ? `📌 ${s.title}` : s.title}</p>
                      <button type="button" className={`${small} mt-1`} onClick={() => addToPage(s)}>
                        पेज {pageIdx + 1} पर लगाएं
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {unplaced.some((s) => !s.slot) && <p className="mt-2 text-xs text-muted">जो खबर किसी पेज पर नहीं लगी, वह ई-पेपर में आखिर के पेजों पर अपने-आप लग जाएगी।</p>}
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="min-w-36 text-sm font-semibold">{label}</span>
      {children}
    </div>
  )
}
