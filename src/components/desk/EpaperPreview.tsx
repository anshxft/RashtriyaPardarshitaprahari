'use client'

import { useEffect, useRef, useState } from 'react'
import { colW, GEO, sortStories, spanW, type EpStory } from '@/lib/epaper'
import type { Lang } from '@/lib/i18n'
import { StoryBlock } from '../epaper/StoryBlock'
import { usePack } from '../epaper/usePack'

const useDebounced = <T,>(v: T, ms: number) => {
  const [d, setD] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return d
}

/**
 * Exactly what the e-paper will draw for this story, plus where it lands: page, columns, free space and the next story.
 * It runs the same packer on today's real edition, so nothing here is an approximation.
 */
export function EpaperPreview({ draft, edition, lang }: { draft: EpStory; edition: EpStory[]; lang: Lang }) {
  const story = useDebounced(draft, 350)
  const all = [...edition.filter((s) => s.id !== story.id), story]
  const { ready, pages } = usePack(all, lang)
  const box = useRef<HTMLDivElement>(null)
  const [bw, setBw] = useState(360)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setBw(el.clientWidth))
    ro.observe(el)
    setBw(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  if (!ready || pages.length === 0) return <p className="py-10 text-center text-muted">प्रीव्यू बन रहा है…</p>
  const mine = pages.flatMap((p) => p.placed.map((pl) => ({ pl, page: p })).filter((x) => x.pl.id.split('~')[0] === story.id))
  const first = mine[0]
  if (!first) return <p className="py-10 text-center text-muted">यह खबर ई-पेपर में शामिल नहीं है।</p>

  const order = sortStories(all)
  const next = order[order.findIndex((s) => s.id === story.id) + 1]
  const nextAt = next && pages.flatMap((p) => p.placed.map((pl) => ({ pl, page: p.number }))).find((x) => x.pl.id.split('~')[0] === next.id)
  const { pl, page } = first
  const colStart = Math.round((pl.x - GEO.margin) / (colW + GEO.gutter)) + 1
  const lines = Math.floor(page.freeH / (13.5 * 1.62))
  const k = Math.min(1, (bw - 18) / spanW(pl.variant.cols))
  const MAP = 200
  const mk = MAP / GEO.pageW

  return (
    <div className="space-y-4">
      <div ref={box} className="overflow-hidden rounded-lg border border-line bg-white p-2" style={{ height: pl.h * k + 18 }}>
        <div style={{ transform: `scale(${k})`, transformOrigin: 'top left', width: spanW(pl.variant.cols) }}>
          <StoryBlock s={pl.story} cols={pl.variant.cols} scale={pl.variant.scale} take={pl.variant.take} lang={lang} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative shrink-0 rounded border border-line bg-white shadow-sm" style={{ width: MAP, height: GEO.pageH * mk }} aria-label={`पृष्ठ ${page.number}`}>
          {page.placed.map((x) => {
            const me = x.id.split('~')[0] === story.id
            return <div key={x.id} title={x.story.title} style={{ position: 'absolute', left: x.x * mk, top: x.y * mk, width: x.w * mk, height: x.h * mk, background: me ? '#f28c1b' : '#c7d2ea', border: me ? '1px solid #b45f00' : '1px solid #fff' }} />
          })}
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
          <li>
            📄 <b>पृष्ठ {page.number}</b> · कॉलम {colStart}–{colStart + pl.variant.cols - 1} <span className="text-muted">({pl.variant.cols} कॉलम की खबर)</span>
          </li>
          <li>📏 इस पृष्ठ पर बची जगह: <b>{Math.round(page.freeH)} px</b> (≈ {lines} पंक्तियाँ)</li>
          {pl.fitted && <li className="font-semibold text-saffron-600">⚡ ऑटो फिट: {pl.variant.cols} कॉलम, टेक्स्ट {Math.round(pl.variant.scale * 100)}%</li>}
          {pl.pinFailed && <li className="font-semibold text-alert-600">⚠ चुना हुआ पृष्ठ भरा था; खबर अगले खाली पृष्ठ पर गई</li>}
          {mine.length > 1 && <li className="font-semibold text-alert-600">↪ खबर बड़ी है: {mine.length} पृष्ठों पर जारी रहेगी</li>}
          <li>
            ➡ अगली खबर: {next ? <><b>{next.title.slice(0, 60)}</b>{nextAt ? <span className="text-muted"> — पृष्ठ {nextAt.page}, कॉलम {Math.round((nextAt.pl.x - GEO.margin) / (colW + GEO.gutter)) + 1}</span> : null}</> : <span className="text-muted">कोई नहीं (यह आख़िरी है)</span>}
          </li>
        </ul>
      </div>
    </div>
  )
}
