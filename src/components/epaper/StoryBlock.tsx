/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react'
import { AD_LABEL_H, adHeight, BODY_PX, bylinePx, colW, headlinePx, spanW, subPx, type EpStory } from '@/lib/epaper'
import { INK } from '@/lib/layout'
import { t, type Lang } from '@/lib/i18n'

const font = { body: 'var(--font-noto), "Noto Sans Devanagari", sans-serif', head: 'var(--font-mukta), var(--font-noto), sans-serif' }
const ink = (i: keyof typeof INK, fallback: string) => (i === 'default' ? fallback : INK[i])
const FRAC = { s: 0.5, m: 0.75, l: 1, full: 1 } as const

/** Tiny QR (server-made SVG) or a neutral square while the story is still unsaved. */
function Qr({ svg, size }: { svg?: string | null; size: number }) {
  return svg ? (
    <div style={{ width: size, height: size, flex: 'none' }} dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div style={{ width: size, height: size, flex: 'none', border: '1px dashed #aaa', fontSize: 8, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>QR</div>
  )
}

/**
 * One story as a newspaper block. Deterministic on purpose (fixed sizes, aspect-ratio photo frames) so the packer's
 * measured height equals the rendered height. No photo → no frame; missing sub-headline / reporter → no empty line.
 */
export function StoryBlock({ s, cols, scale, take, lang }: { s: EpStory; cols: number; scale: number; take?: number; lang: Lang }) {
  const d = t(lang)
  if (s.slot === 'ad' && s.ad && s.photo) return <AdBlock s={s} width={spanW(cols)} lang={lang} />
  const L = s.layout
  const width = spanW(cols)
  const paras = s.paragraphs.slice(0, take ?? s.paragraphs.length)
  const showPhoto = Boolean(s.photo) && L.showPhoto
  const side = showPhoto && L.photoPos !== 'top' && !s.link
  const photoW = side ? (cols >= 3 ? colW : Math.round(width * 0.42)) : Math.round(width * FRAC[L.photoSize])
  const bodyCols = side ? (cols >= 3 ? cols - 1 : 1) : cols
  const align = L.align === 'center' ? 'center' : L.align === 'left' ? 'left' : 'justify'
  const hAlign: CSSProperties['textAlign'] = L.align === 'center' ? 'center' : 'left'
  const byline = [s.reporter && `${d.reportBy}: ${s.reporter}`, s.location && `📍 ${s.location}`].filter(Boolean).join('  ·  ')

  const photo = showPhoto && (
    <figure style={{ margin: side ? 0 : '0 auto 8px', width: photoW, flex: 'none' }}>
      <div style={{ width: '100%', aspectRatio: L.photoSize === 'full' && !side ? '2 / 1' : side ? '4 / 5' : '3 / 2', overflow: 'hidden', background: '#e8e8e8' }}>
        <img src={s.photo!.src} alt={s.photo!.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      {s.photo!.credit && <figcaption style={{ fontSize: 8.5, color: '#777', marginTop: 2, lineHeight: 1.2, maxHeight: 12, overflow: 'hidden' }}>{s.photo!.credit}</figcaption>}
    </figure>
  )

  const head = (
    <>
      {s.category && !s.link && <div style={{ fontSize: 10, fontWeight: 700, color: '#c25a00', letterSpacing: 0.3, marginBottom: 2 }}>{s.category}</div>}
      {s.link && <div style={{ fontSize: 10, fontWeight: 700, color: '#0b1f4d', background: '#eef2fb', display: 'inline-block', padding: '1px 6px', marginBottom: 3 }}>{d.externalLink}{s.link.siteName ? ` · ${s.link.siteName}` : ''}</div>}
      <h2 style={{ margin: 0, fontFamily: font.head, fontWeight: 800, fontSize: headlinePx(L.headlineSize, cols) * (s.id.includes('~c') ? 0.7 : 1), lineHeight: 1.22, textAlign: hAlign, color: ink(L.headlineInk, '#0b1f4d') }}>{s.title}</h2>
      {s.subheadline && <p style={{ margin: '4px 0 0', fontSize: subPx(L.subheadlineSize, cols), lineHeight: 1.4, textAlign: hAlign, color: ink(L.subheadlineInk, '#333') }}>{s.subheadline}</p>}
      {byline && <p style={{ margin: '5px 0 0', fontSize: bylinePx(L.reporterSize), fontWeight: 600, color: ink(L.reporterInk, '#555') }}>{byline}</p>}
    </>
  )

  const body = s.link ? (
    <p style={{ margin: '6px 0 0', fontSize: BODY_PX * scale, lineHeight: 1.55, textAlign: 'left' }}>
      {s.link.description || paras.join(' ')}
      <span style={{ display: 'block', marginTop: 4, fontWeight: 700, color: '#0b1f4d', fontSize: 11 }}>{d.viewRelatedPortal}</span>
    </p>
  ) : (
    <div style={{ columnCount: bodyCols, columnGap: 14, columnRule: bodyCols > 1 ? '1px solid #d8d8d8' : undefined, fontSize: BODY_PX * scale, lineHeight: 1.62, textAlign: align, hyphens: 'auto', marginTop: 6 }}>
      {paras.map((p, i) => (
        <p key={i} style={{ margin: '0 0 5px' }}>
          {p}
        </p>
      ))}
    </div>
  )

  return (
    <article
      data-ep-block={s.id}
      style={{ width, boxSizing: 'border-box', background: s.slot === 'aina' ? '#fffaf2' : '#fff', color: '#111', fontFamily: font.body, borderBottom: '1px solid #bbb', paddingBottom: 6, ...(s.slot === 'aina' ? { borderTop: '2px solid #c25a00', borderLeft: '2px solid #c25a00', borderRight: '2px solid #c25a00', borderBottom: '2px solid #c25a00', paddingLeft: 8, paddingRight: 8 } : {}) }}
    >
      {s.slot === 'aina' && (
        <div style={{ margin: '0 -8px 8px', background: '#c25a00', color: '#fff', fontFamily: font.head, fontWeight: 800, fontSize: 20, lineHeight: '34px', textAlign: 'center' }}>{lang === 'hi' ? 'समाज का आइना' : 'Samaj Ka Aaina'}</div>
      )}
      {!side && photo}
      {head}
      {side ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: L.photoPos === 'right' ? 'row-reverse' : 'row', marginTop: 4 }}>
          {photo}
          <div style={{ flex: 1, minWidth: 0 }}>{body}</div>
        </div>
      ) : (
        body
      )}
      <footer style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, marginTop: 4, borderTop: '1px solid #ddd', paddingTop: 2 }}>
        <Qr svg={s.qrSvg} size={30} />
        <div style={{ fontSize: 9, lineHeight: 1.25, color: '#555', minWidth: 0 }}>
          {s.newsId && <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0b1f4d' }}>{s.newsId}</div>}
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: width - 48 }}>{s.link ? s.link.url.replace(/^https?:\/\//, '') : s.url.replace(/^https?:\/\//, '')}</div>
        </div>
      </footer>
    </article>
  )
}

/** Advertisement column: always under a visible “विज्ञापन” label, fixed height so the packer knows it exactly. */
function AdBlock({ s, width, lang }: { s: EpStory; width: number; lang: Lang }) {
  const H = adHeight(s.ad!.aspect)
  return (
    <aside data-ep-block="ad" style={{ width, height: H, boxSizing: 'border-box', background: '#fff', border: '1px dashed #999', paddingBottom: 8 }}>
      <div style={{ height: AD_LABEL_H, lineHeight: `${AD_LABEL_H}px`, fontSize: 11, fontWeight: 700, letterSpacing: 1, textAlign: 'center', color: '#666', borderBottom: '1px solid #ddd' }}>{lang === 'hi' ? 'विज्ञापन / ADVERTISEMENT' : 'ADVERTISEMENT'}</div>
      <img src={s.photo!.src} alt={s.photo!.alt} style={{ display: 'block', width: '100%', height: H - AD_LABEL_H - 10, objectFit: 'contain' }} />
    </aside>
  )
}
