/**
 * A3 e-paper layout engine (pure, no React). Every story is an independent block with its own measured height;
 * blocks are placed on a 6-column page grid so one story can never flow into another story's space.
 * The browser measures the real rendering (see components/epaper/EpaperBoard) and passes it in via `measure`.
 */
import type { ResolvedLayout, Size } from './layout'

export type EpPhoto = { src: string; alt: string; credit?: string | null }
export type EpStory = {
  id: string
  title: string
  subheadline?: string | null
  reporter?: string | null
  location?: string | null
  category?: string | null
  newsId?: string | null
  url: string // public page (used in the block footer)
  paragraphs: string[]
  photo?: EpPhoto
  layout: ResolvedLayout
  format?: string | null
  link?: { url: string; siteName?: string | null; description?: string | null } | null
  qrSvg?: string | null
  publishedAt: string
  categorySlug?: string | null
  /** fixed column slots on page 1: the “समाज का आइना” column and the advertisement column */
  /** filler = the paper's own standing material, used only to fill space left over on existing pages */
  slot?: 'aina' | 'ad' | 'filler' | null
  ad?: { link?: string | null; aspect: number } | null
}

/** A3 portrait at 96 dpi. */
export const GEO = {
  pageW: 1123,
  pageH: 1587,
  margin: 36,
  gutter: 16,
  cols: 6,
  footerH: 30,
  mastheadH: 246, // page-1 masthead: info strip + map / name / तुला + “मुख्य समाचार” strip
  blockGap: 24,
} as const

export const contentW = GEO.pageW - GEO.margin * 2
export const colW = (contentW - GEO.gutter * (GEO.cols - 1)) / GEO.cols
export const spanW = (span: number) => span * colW + (span - 1) * GEO.gutter
export const pageBottom = GEO.pageH - GEO.margin - GEO.footerH

/** Headline px by (chosen size, block span). Narrow blocks get smaller type so words don't break badly. */
const HEAD: Record<number, Record<Size, number>> = {
  1: { sm: 15, md: 18, lg: 22, xl: 26 },
  2: { sm: 20, md: 25, lg: 31, xl: 38 },
  3: { sm: 24, md: 31, lg: 40, xl: 50 },
  4: { sm: 28, md: 36, lg: 48, xl: 62 },
}
export const headlinePx = (size: Size, span: number) => HEAD[Math.min(4, Math.max(1, span))][size]
export const subPx = (size: Size, span: number) => Math.round(headlinePx(size, span) * (span === 1 ? 0.62 : 0.5) + 2)
export const bylinePx = (size: Size) => ({ sm: 11, md: 12.5, lg: 14, xl: 16 })[size]
export const BODY_PX = 20
/** Readable floor: body text is never drawn smaller than this (Round 4: never shrink text just to fit more). */
export const MIN_BODY_PX = 19.5
export const bodyScaleOf = (s: EpStory) => Math.max(MIN_BODY_PX / BODY_PX, s.layout.bodyScale / 100)

/** Page-1 column slots (right-hand side). */
export const SLOT_COLS = 2
export const AINA_SLUG = 'samaj-ka-aina'
export const AD_LABEL_H = 26
export const adHeight = (aspect: number) => Math.min(640, Math.round(spanW(SLOT_COLS) * aspect) + AD_LABEL_H + 8)

export const MAX_PAGES = 40

export type Variant = { cols: number; scale: number; take?: number }
export type Placed = { story: EpStory; id: string; page: number; x: number; y: number; w: number; h: number; variant: Variant; cont?: boolean; pinFailed?: boolean; fitted?: boolean }
export type PackedPage = { number: number; placed: Placed[]; freeH: number }

/** Reading order: explicit order first, then lead > big > rest, newest first. */
export function sortStories(list: EpStory[]): EpStory[] {
  const rank = (s: EpStory) => (s.layout.template === '3' ? 0 : s.layout.template === '2' ? 1 : 2)
  return [...list].sort((a, b) => {
    const ao = a.layout.epaperOrder,
      bo = b.layout.epaperOrder
    if (ao != null && bo != null && ao !== bo) return ao - bo
    if (ao != null && bo == null) return -1
    if (ao == null && bo != null) return 1
    return rank(a) - rank(b) || +new Date(b.publishedAt) - +new Date(a.publishedAt)
  })
}

/** What Auto Fit may try, in order: only wider blocks (max 4 columns). The text size is never reduced to fit more. */
export function variantsFor(s: EpStory, take?: number): Variant[] {
  const base = s.layout.columns
  const scale0 = bodyScaleOf(s)
  const out: Variant[] = [{ cols: base, scale: scale0, take }]
  if (!s.layout.autoFit) return out
  for (let c = base + 1; c <= 4; c++) out.push({ cols: c, scale: scale0, take })
  return out
}

type Measure = (s: EpStory, v: Variant) => number

export function pack(stories: EpStory[], measure: Measure, extra: { ad?: EpStory | null; fillers?: EpStory[] } = {}): PackedPage[] {
  type PG = { colTop: number[]; placed: Placed[] }
  const pages: PG[] = []
  const newPage = (): PG => {
    const pg = { colTop: Array<number>(GEO.cols).fill(GEO.margin + GEO.mastheadH), placed: [] as Placed[] }
    pages.push(pg)
    return pg
  }
  newPage()
  const cache = new Map<string, number>()
  const h = (s: EpStory, v: Variant) => {
    const k = `${s.id}|${v.cols}|${v.scale.toFixed(3)}|${v.take ?? 'all'}`
    let x = cache.get(k)
    if (x == null) cache.set(k, (x = s.slot === 'ad' && s.ad ? adHeight(s.ad.aspect) : Math.ceil(measure(s, v)) + 2))
    return x
  }

  /** Best (lowest, then leftmost) slot on a page for a block spanning `span` columns and `height` tall. */
  const slot = (pg: PG, span: number, height: number) => {
    let best: { c: number; y: number } | null = null
    for (let c = 0; c + span <= GEO.cols; c++) {
      const y = Math.max(...pg.colTop.slice(c, c + span))
      if (y + height <= pageBottom && (!best || y < best.y)) best = { c, y }
    }
    return best
  }
  const put = (pg: PG, pageNo: number, s: EpStory, v: Variant, height: number, at: { c: number; y: number }, extra: Partial<Placed> = {}) => {
    for (let i = at.c; i < at.c + v.cols; i++) pg.colTop[i] = at.y + height + GEO.blockGap
    pg.placed.push({ story: s, id: s.id, page: pageNo, x: GEO.margin + at.c * (colW + GEO.gutter), y: at.y, w: spanW(v.cols), h: height, variant: v, ...extra })
  }

  // Pinned stories are placed first (so their page is reserved); everything else then flows around them, first-fit from page 1.
  const sorted = sortStories(stories).map((s) => ({ s, pin: s.layout.epaperPage ? Math.min(s.layout.epaperPage, MAX_PAGES) : (null as number | null | undefined), cont: false }))
  const queue = [...sorted.filter((x) => x.pin).sort((a, b) => a.pin! - b.pin!), ...sorted.filter((x) => !x.pin)]

  // Page 1, right-hand columns: the dedicated “समाज का आइना” column, then the advertisement column. Nothing to show =
  // no slot (the space goes back to the news). A column story too long for the slot simply joins the normal flow.
  const c0 = GEO.cols - SLOT_COLS
  let slotY = GEO.margin + GEO.mastheadH
  const ainaAt = queue.findIndex((x) => x.s.categorySlug === AINA_SLUG && !x.pin)
  if (ainaAt >= 0) {
    const s = { ...queue[ainaAt].s, slot: 'aina' as const }
    const v = { cols: SLOT_COLS, scale: bodyScaleOf(s) }
    const height = h(s, v)
    if (slotY + height <= GEO.margin + GEO.mastheadH + (pageBottom - GEO.margin - GEO.mastheadH) * 0.7) {
      put(pages[0], 1, s, v, height, { c: c0, y: slotY })
      slotY += height + GEO.blockGap
      queue.splice(ainaAt, 1)
    }
  }
  // Client grid (6 columns): lead story 4 columns, every other story 2 columns (2 + 2 + 2); wider only if it can't fit.
  let lead = true
  while (queue.length) {
    const { s, pin, cont } = queue.shift()!
    const vs = cont ? variantsFor({ ...s, layout: { ...s.layout, columns: 4, autoFit: false } }) : variantsFor({ ...s, layout: { ...s.layout, columns: lead ? 4 : 2, autoFit: true } })
    if (!cont) lead = false
    const target = pin || 1
    let done = false
    for (let p = target; !done; p++) {
      while (pages.length < p) newPage()
      const pg = pages[p - 1]
      for (const v of vs) {
        const height = h(s, v)
        const at = slot(pg, v.cols, height)
        if (at) {
          put(pg, p, s, v, height, at, { cont, fitted: v !== vs[0], pinFailed: !cont && pin != null && p !== target })
          done = true
          break
        }
      }
      if (done) break
      // Doesn't fit whole: fill the largest free area of this page with the start of the story (as many columns as are
      // free side by side, up to the full width) and carry the rest to the next page — so no page is left half empty.
      // A fresh story keeps the client grid (at most 4 columns); its carried-over part may take the full width.
      const maxSpan = cont ? GEO.cols : vs[vs.length - 1].cols
      let area: { c: number; y: number; span: number } | null = null
      for (let c = 0; c < GEO.cols; c++)
        for (let e = c + 1; e < Math.min(GEO.cols, c + maxSpan); e++) {
          const y = Math.max(...pg.colTop.slice(c, e + 1))
          const span = e - c + 1
          if (pageBottom - y >= 160 && (!area || span * (pageBottom - y) > area.span * (pageBottom - area.y))) area = { c, y, span }
        }
      if (area) {
        const v = { ...vs[0], cols: area.span }
        const room = pageBottom - area.y
        let fit = 0
        for (let k = 1; k <= s.paragraphs.length; k++) if (h(s, { ...v, take: k }) <= room) fit = k
        const empty = pg.placed.length === 0
        if (fit >= (empty || cont ? 1 : 2) || empty) {
          const take = Math.max(1, fit)
          const height = Math.min(h(s, { ...v, take }), room)
          put(pg, p, s, { ...v, take }, height, { c: area.c, y: area.y }, { cont })
          if (take < s.paragraphs.length) {
            const rest: EpStory = { ...s, id: `${s.id.split('~')[0]}~c${p}`, title: `${s.title.replace(/ (जारी)$/, '')} (जारी)`, paragraphs: s.paragraphs.slice(take), photo: undefined, subheadline: null }
            queue.unshift({ s: rest, pin: p + 1, cont: true })
          }
          done = true
        }
      }
    }
  }
  // Advertisement: page 1, first 2-column slot left after the news (else the first page with room).
  if (extra.ad?.ad) {
    const s = { ...extra.ad, slot: 'ad' as const }
    const v = { cols: SLOT_COLS, scale: 1 }
    const height = h(s, v)
    for (const [i, pg] of pages.entries()) {
      const at = slot(pg, SLOT_COLS, height)
      if (at) {
        put(pg, i + 1, s, v, height, at)
        break
      }
    }
  }
  // Leftover space (few stories that day): drop in standing blocks — editor's message, “send your issue” — wherever
  // they fit on pages that already exist. Never opens a new page, never moves a news story.
  for (const f of extra.fillers || []) {
    let done = false
    for (const [i, pg] of pages.entries()) {
      for (const cols of [2, 3, 4]) {
        const v = { cols, scale: 1 }
        const height = h(f, v)
        const at = slot(pg, cols, height)
        if (at) {
          put(pg, i + 1, { ...f, slot: 'filler' }, v, height, at)
          done = true
          break
        }
      }
      if (done) break
    }
  }
  return pages.map((pg, i) => ({
    number: i + 1,
    placed: pg.placed,
    freeH: Math.max(0, pageBottom - Math.min(...pg.colTop)),
  }))
}

/** Page numbers are generated from the order of the pages (never typed): 1 → "01", 2 → "02" … no gaps after a reorder. */
export const pageNo = (n: number) => String(n).padStart(2, '0')
