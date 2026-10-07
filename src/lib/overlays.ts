/**
 * Text overlays for videos, drawn by sharp (Pango + HarfBuzz) so Hindi conjuncts and matras are always correct —
 * ffmpeg's own text filters get Devanagari wrong. Each function returns a transparent PNG to lay over the video.
 * Font: VIDEO_FONT (default "Noto Sans Devanagari"; the worker image installs it, Windows dev can use "Nirmala UI").
 */
import sharp, { type OverlayOptions } from 'sharp'

const FONT = () => process.env.VIDEO_FONT || 'Noto Sans Devanagari'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function text(markup: string, size: number, width: number, opts: { bold?: boolean; align?: 'left' | 'centre' } = {}) {
  const { data, info } = await sharp({ text: { text: markup, font: `${FONT()}${opts.bold ? ' Bold' : ''} ${size}`, rgba: true, width, dpi: 72, wrap: 'word', align: opts.align || 'left' } })
    .png()
    .toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}
/** '#0b1f4d' + alpha 0–1 → solid panel. */
const panel = (w: number, h: number, hex: string, alpha = 1) =>
  sharp({ create: { width: Math.max(1, w), height: Math.max(1, h), channels: 4, background: { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16), alpha } } })

export type Meta = { headline: string; reporter?: string | null; location?: string | null; date?: string | null; newsId?: string | null; siteName: string; url?: string | null; tagline?: string | null; descriptor?: string | null }

/** Lower third: navy band with the headline + one line of reporter · place · date · News ID. Width = video width. */
export async function lowerThird(m: Meta, W: number): Promise<Buffer> {
  const pad = Math.round(W * 0.025)
  const big = Math.round(W * (W > 1200 ? 0.03 : 0.045))
  const h1 = await text(`<span foreground="white">${esc(m.headline)}</span>`, big, W - pad * 2, { bold: true })
  const metaLine = [m.reporter && `रिपोर्ट: ${m.reporter}`, m.location, m.date, m.newsId].filter(Boolean).join('  •  ')
  const h2 = await text(`<span foreground="#f4c542">${esc(metaLine)}</span>`, Math.round(big * 0.55), W - pad * 2)
  const H = pad + h1.h + Math.round(pad / 2) + h2.h + pad
  return panel(W, H, '#0b1f4d', 0.9)
    .composite([
      { input: h1.data, left: pad, top: pad },
      { input: h2.data, left: pad, top: pad + h1.h + Math.round(pad / 2) },
    ])
    .png()
    .toBuffer()
}

/** Top-left name tag: "राष्ट्रीय पारदर्शिता प्रहरी". */
export async function nameTag(m: Meta, W: number): Promise<Buffer> {
  const pad = Math.round(W * 0.012)
  const t = await text(`<span foreground="white">${esc(m.siteName)}</span>`, Math.round(W * (W > 1200 ? 0.02 : 0.03)), W, { bold: true })
  return panel(t.w + pad * 2, t.h + pad * 2, '#c8102e', 0.9).composite([{ input: t.data, left: pad, top: pad }]).png().toBuffer()
}

/** Red "🔴 FLASH NEWS" strip carrying the approved script (the same text the voice reads). */
export async function flashStrip(script: string, W: number, label = 'FLASH NEWS'): Promise<Buffer> {
  const pad = Math.round(W * 0.018)
  const size = Math.round(W * (W > 1200 ? 0.026 : 0.04))
  const tag = await text(`<span foreground="#c8102e">● ${esc(label)}</span>`, Math.round(size * 0.8), W, { bold: true })
  const body = await text(`<span foreground="white">${esc(script)}</span>`, size, W - pad * 4 - tag.w, { bold: true })
  const H = Math.max(tag.h, body.h) + pad * 2
  const tagBox = await panel(tag.w + pad, tag.h + Math.round(pad / 2), '#ffffff').composite([{ input: tag.data, left: Math.round(pad / 2), top: Math.round(pad / 4) }]).png().toBuffer()
  return panel(W, H, '#c8102e', 0.94)
    .composite([
      { input: tagBox, left: pad, top: Math.round((H - tag.h - pad / 2) / 2) },
      { input: body.data, left: pad * 3 + tag.w, top: pad },
    ])
    .png()
    .toBuffer()
}

/** Full-frame end screen with the official identity. `logo` = PNG buffer of the round logo. */
export async function endCard(m: Meta, W: number, H: number, logo: Buffer): Promise<Buffer> {
  const logoW = Math.round(Math.min(W, H) * 0.32)
  const lg = await sharp(logo).resize(logoW).png().toBuffer()
  const lgH = (await sharp(lg).metadata()).height || logoW
  const name = await text(`<span foreground="#f4c542">${esc(m.siteName)}</span>`, Math.round(Math.min(W, H) * 0.06), W - 80, { bold: true, align: 'centre' })
  const sub = [m.descriptor, m.tagline].filter(Boolean).map((s) => esc(s!)).join('\n')
  const line2 = sub ? await text(`<span foreground="white">${sub}</span>`, Math.round(Math.min(W, H) * 0.03), W - 80, { align: 'centre' }) : null
  const foot = await text(`<span foreground="#cfd6e6">${esc([m.url, m.newsId && `News ID: ${m.newsId}`].filter(Boolean).join('   •   '))}</span>`, Math.round(Math.min(W, H) * 0.028), W - 80, { align: 'centre' })
  const gap = Math.round(H * 0.03)
  const total = lgH + gap + name.h + (line2 ? gap + line2.h : 0) + gap * 2 + foot.h
  let y = Math.round((H - total) / 2)
  const layers: OverlayOptions[] = [{ input: lg, left: Math.round((W - logoW) / 2), top: y }]
  y += lgH + gap
  layers.push({ input: name.data, left: Math.round((W - name.w) / 2), top: y })
  y += name.h + gap
  if (line2) {
    layers.push({ input: line2.data, left: Math.round((W - line2.w) / 2), top: y })
    y += line2.h + gap
  }
  layers.push({ input: foot.data, left: Math.round((W - foot.w) / 2), top: y + gap })
  return sharp({ create: { width: W, height: H, channels: 4, background: '#0b1f4d' } }).composite(layers).png().toBuffer()
}
