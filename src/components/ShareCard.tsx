/* eslint-disable @next/next/no-img-element */
import { TAGLINE_SHORT } from '@/content/brand'
import { formatDate, t, type Lang } from '@/lib/i18n'
import type { Img } from '@/lib/data'
import { Qr } from './Qr'

/** Same-origin URL through Next's optimiser, so the browser can rasterise the card without CORS trouble. */
export const proxied = (src: string, w = 1080) => (src.startsWith('/_next/') ? src : `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`)

/**
 * 1080×1350 share card: what people forward on WhatsApp / Facebook / Telegram. Always carries the QR code and the
 * News ID so the original verified story is one scan away. No photo → no empty frame: the text simply gets the space.
 */
export async function ShareCard({ lang, title, subtitle, category, date, img, newsId, shortUrl, siteName }: {
  lang: Lang
  title: string
  subtitle?: string | null
  category?: string | null
  date: string
  img?: Img
  newsId?: string | null
  shortUrl: string
  siteName: string
}) {
  const d = t(lang)
  const font = 'var(--font-mukta), var(--font-noto), sans-serif'
  const body = 'var(--font-noto), sans-serif'
  const clamp = (n: number) => ({ display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' })
  return (
    <div style={{ width: 1080, height: 1350, background: '#ffffff', color: '#111831', display: 'flex', flexDirection: 'column', fontFamily: body }}>
      <div style={{ background: '#0b1f4d', padding: '28px 44px', display: 'flex', alignItems: 'center', gap: 28, borderBottom: '8px solid #e2b63f' }}>
        <img src="/logo-160.webp" alt="" width={104} height={104} />
        <div>
          <div style={{ fontFamily: font, fontWeight: 800, fontSize: 52, color: '#f1d27a', lineHeight: 1.15 }}>{siteName}</div>
          <div style={{ fontSize: 26, color: '#ffffff', marginTop: 4 }}>{TAGLINE_SHORT}</div>
        </div>
      </div>

      <div style={{ padding: '32px 48px 0', display: 'flex', alignItems: 'center', gap: 16, fontSize: 28 }}>
        {category && <span style={{ background: '#f28c1b', color: '#061231', fontWeight: 700, padding: '4px 18px', borderRadius: 999 }}>{category}</span>}
        <span style={{ color: '#566078' }}>{date}</span>
      </div>

      {img && <img src={proxied(img.src)} alt="" style={{ margin: '24px 48px 0', width: 984, height: 500, objectFit: 'cover', borderRadius: 14 }} />}

      <div style={{ padding: '28px 48px 0', flex: 1, minHeight: 0 }}>
        <div style={{ fontFamily: font, fontWeight: 800, fontSize: img ? 58 : 76, lineHeight: 1.25, color: '#0b1f4d', ...clamp(img ? 4 : 6) }}>{title}</div>
        {subtitle && <div style={{ marginTop: 18, fontSize: img ? 32 : 38, lineHeight: 1.55, color: '#334', ...clamp(img ? 4 : 9) }}>{subtitle}</div>}
      </div>

      <div style={{ margin: '0 48px 40px', padding: 22, border: '3px solid #0b1f4d', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 28 }}>
        <Qr value={shortUrl} size={210} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 28, color: '#566078' }}>{d.newsId}</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 40, color: '#0b1f4d' }}>{newsId || '—'}</div>
          <div style={{ marginTop: 10, fontSize: 27, lineHeight: 1.4 }}>{d.verifyScan}</div>
          <div style={{ marginTop: 8, fontSize: 23, color: '#566078', wordBreak: 'break-all' }}>{shortUrl.replace(/^https?:\/\//, '')}</div>
        </div>
      </div>
    </div>
  )
}

export { formatDate }
