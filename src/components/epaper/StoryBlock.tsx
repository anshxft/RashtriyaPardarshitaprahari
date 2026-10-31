/* eslint-disable @next/next/no-img-element */
import { AD_LABEL_H, adHeight, BODY_PX, bylinePx, headlinePx, spanW, subPx, type EpStory } from '@/lib/epaper'
import { INK } from '@/lib/layout'
import { t, type Lang } from '@/lib/i18n'
import { HELPLINE } from '@/content/brand'
import { siteUrl } from '@/lib/paths'

const font = { body: 'var(--font-noto), "Noto Sans Devanagari", sans-serif', head: 'var(--font-head), var(--font-noto), sans-serif' }
const ink = (i: keyof typeof INK, fallback: string) => (i === 'default' ? fallback : INK[i])
const FRAC = { s: 0.5, m: 0.75, l: 1, full: 1 } as const

/** Tiny QR (server-made SVG) or a neutral square while the story is still unsaved. */
function Qr({ svg, size }: { svg?: string | null; size: number }) {
  return svg ? (
    // The SVG is generated at 60px; scale it to the box so it never spills over the News ID text.
    <div style={{ width: size, height: size, flex: 'none', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: svg.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') }} />
  ) : (
    <div style={{ width: size, height: size, flex: 'none', border: '1px dashed #aaa', fontSize: 8, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>QR</div>
  )
}

/**
 * One story as a newspaper block. Deterministic on purpose (fixed sizes, aspect-ratio photo frames) so the packer's
 * measured height equals the rendered height. No photo → no frame; missing sub-headline / reporter → no empty line.
 */
export function StoryBlock({ s, cols, scale, take, lang, height }: { s: EpStory; cols: number; scale: number; take?: number; lang: Lang; height?: number }) {
  const d = t(lang)
  if (s.slot === 'ad' && s.ad && s.photo) return <AdBlock s={s} width={spanW(cols)} lang={lang} />
  if (s.slot === 'promo') return <PromoBlock s={s} width={spanW(cols)} height={height ?? 200} lang={lang} />
  const L = s.layout
  const width = spanW(cols)
  const paras = s.paragraphs.slice(0, take ?? s.paragraphs.length)
  const showPhoto = Boolean(s.photo) && L.showPhoto
  // Client: a photo sits at the side with the text running beside it (no empty margins around a centred photo);
  // only a full-width photo stays on top.
  const side = showPhoto && !s.link && (L.photoPos !== 'top' || L.photoSize !== 'full')
  // Client: no empty space under a side photo — the photo sits at the top of the first text column and the text runs
  // on underneath it, then through the other columns (newspaper wrap). One column wide, so the columns stay level.
  const photoW = side ? '100%' : Math.round(width * FRAC[L.photoSize])
  const bodyCols = cols
  // Client: text edges even on both sides (newspaper style)
  const align = 'justify'
  // Editor-in-Chief's pieces already say “प्रधान संपादक के कलम से” — no “रिपोर्ट: प्रधान संपादक…” line under them
  const reporter = s.reporter && !/^प्रधान संपादक|^Editor-in-Chief/.test(s.reporter) ? s.reporter : null
  const byline = [reporter && `${d.reportBy}: ${reporter}`, s.location && `${s.location}`].filter(Boolean).join('  ·  ')

  const photo = showPhoto && (
    <figure style={{ margin: side ? '0 0 8px' : '0 auto 8px', width: photoW, flex: 'none', breakInside: 'avoid' }}>
      <div style={{ width: '100%', aspectRatio: L.photoSize === 'full' && !side ? '2 / 1' : side ? '4 / 3' : '3 / 2', overflow: 'hidden', background: side ? '#f4f4f4' : '#e8e8e8' }}>
        <img src={s.photo!.src} alt={s.photo!.alt} style={{ width: '100%', height: '100%', objectFit: side ? 'contain' : 'cover', display: 'block' }} />
      </div>
      {s.photo!.credit && <figcaption style={{ fontSize: 8.5, color: '#777', marginTop: 2, lineHeight: '11px', height: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.photo!.credit}</figcaption>}
    </figure>
  )

  const head = (
    <>
      {s.category && !s.link && <div style={{ fontSize: 10, fontWeight: 700, color: '#8f1d1f', letterSpacing: 0.3, marginBottom: 2 }}>{s.category}</div>}
      {s.link && <div style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a', background: '#f1efec', display: 'inline-block', padding: '1px 6px', marginBottom: 3 }}>{d.externalLink}{s.link.siteName ? ` · ${s.link.siteName}` : ''}</div>}
      <h2 style={{ margin: 0, fontFamily: L.headlineFont === 'sans' ? font.body : font.head, fontWeight: L.headlineWeight === 'normal' ? 500 : 800, fontSize: headlinePx(L.headlineSize, cols) * (s.id.includes('~c') ? 0.7 : 1), lineHeight: 1.22, textAlign: L.headlineAlign, color: ink(L.headlineInk, '#1a1a1a') }}>{s.title}</h2>
      {s.subheadline && <p style={{ margin: '4px 0 0', fontSize: subPx(L.subheadlineSize, cols), fontWeight: L.subheadlineWeight === 'bold' ? 700 : 400, lineHeight: 1.4, textAlign: 'justify', color: ink(L.subheadlineInk, '#333') }}>{s.subheadline}</p>}
      {byline && <p style={{ margin: '5px 0 0', fontSize: bylinePx(L.reporterSize), fontWeight: L.reporterWeight === 'normal' ? 400 : 600, textAlign: L.reporterAlign, color: ink(L.reporterInk, '#555') }}>{byline}</p>}
    </>
  )

  const body = s.link ? (
    <p style={{ margin: '6px 0 0', fontSize: BODY_PX * scale, lineHeight: 1.55, textAlign: 'left' }}>
      {s.link.description || paras.join(' ')}
      <span style={{ display: 'block', marginTop: 4, fontWeight: 700, color: '#1a1a1a', fontSize: 11 }}>{d.viewRelatedPortal}</span>
    </p>
  ) : (
    // Columns end level: every line is the same height (no gaps between paragraphs — a newspaper indent marks them instead)
    <div style={{ columnCount: bodyCols, columnGap: 20, columnFill: 'balance', columnRule: bodyCols > 1 ? '1px solid #d8d8d8' : undefined, fontSize: BODY_PX * scale, fontWeight: 500, lineHeight: 1.7, textAlign: align, hyphens: 'auto', marginTop: 6, orphans: 1, widows: 1 }}>
      {side && photo}
      {paras.map((p, i) => (
        <p key={i} style={{ margin: 0, textIndent: i ? '1.2em' : 0 }}>
          {p}
        </p>
      ))}
    </div>
  )

  return (
    <article
      data-ep-block={s.id}
      style={{ width, boxSizing: 'border-box', background: s.slot === 'aina' ? '#fffaf2' : s.slot === 'filler' ? '#f6f5f3' : '#fff', ...(s.slot === 'filler' ? { borderTop: '3px solid #8f1d1f', padding: '8px 10px 6px' } : {}), color: '#111', fontFamily: font.body, borderBottom: '1px solid #bbb', paddingBottom: 6, ...(s.slot === 'aina' ? { borderTop: '2px solid #c25a00', borderLeft: '2px solid #c25a00', borderRight: '2px solid #c25a00', borderBottom: '2px solid #c25a00', paddingLeft: 8, paddingRight: 8 } : {}) }}
    >
      {s.slot === 'aina' && (
        <div style={{ margin: '0 -8px 8px', background: '#c25a00', color: '#fff', fontFamily: font.head, fontWeight: 800, fontSize: 20, lineHeight: '34px', textAlign: 'center' }}>{lang === 'hi' ? 'समाज का आइना' : 'Samaj Ka Aaina'}</div>
      )}
      {head}
      {/* Newspaper order: headline → photo → text */}
      {!side && photo && <div style={{ marginTop: 8 }}>{photo}</div>}
      {body}
      <footer style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, marginTop: 4, borderTop: '1px solid #ddd', paddingTop: 2 }}>
        <Qr svg={s.qrSvg} size={30} />
        <div style={{ fontSize: 9, lineHeight: 1.25, color: '#555', minWidth: 0 }}>
          {s.newsId && <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1a1a1a' }}>{s.newsId}</div>}
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

/** The paper's own box that fills whatever space is left at the foot of a column. Three sizes, chosen by height. */
function PromoBlock({ s, width, height, lang }: { s: EpStory; width: number; height: number; lang: Lang }) {
  const hi = lang === 'hi'
  const web = siteUrl().replace(/^https?:\/\/(www\.)?/, 'www.')
  const help = `${hi ? 'हेल्पलाइन' : 'Helpline'} (24x7): ${HELPLINE}`
  const box = { width, height: '100%', boxSizing: 'border-box', border: '2px solid #13294b', borderRadius: 6, background: 'linear-gradient(180deg,#f4f6fb,#e9eef5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: font.body, color: '#13294b', textAlign: 'center' } as const
  if (height < 90)
    // thin strip: one line
    return (
      <aside data-ep-block="promo" style={{ ...box, padding: '0 10px', fontSize: Math.min(16, Math.max(12, height * 0.32)), fontWeight: 700, whiteSpace: 'nowrap' }}>
        {help}
        {width > 500 ? `  ·  ${web}` : ''}
      </aside>
    )
  const showQr = Boolean(s.qrSvg) && height >= 160
  return (
    <aside data-ep-block="promo" style={{ ...box, gap: 14, padding: '8px 12px' }}>
      {showQr && <div style={{ height: '100%', maxHeight: 90, aspectRatio: '1', flex: 'none' }} dangerouslySetInnerHTML={{ __html: s.qrSvg!.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: font.head, fontWeight: 800, fontSize: 20, lineHeight: 1.25 }}>{hi ? 'अपनी खबर / समस्या हमें भेजें' : 'Send us your news or issue'}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{help}</div>
        <div style={{ fontSize: 15, marginTop: 2 }}>{web}</div>
      </div>
    </aside>
  )
}
