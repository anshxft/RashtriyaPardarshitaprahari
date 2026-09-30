/* eslint-disable @next/next/no-img-element */
import { asMedia } from '@/lib/data'
import type { Video } from '@/payload-types'

export type WM = { enabled?: boolean | null; position?: string | null; sizePercent?: number | null; opacity?: number | null; marginPercent?: number | null }

export const videoPoster = (v: Video) => v.posterUrl || asMedia(v.thumbnail)?.sizes?.card?.url || asMedia(v.thumbnail)?.url || undefined
export const videoThumb = (v: Video) => asMedia(v.thumbnail)?.sizes?.card?.url || asMedia(v.thumbnail)?.url || v.posterUrl || undefined

/**
 * Plays the published (logo already burned in) file. If processing is not finished or failed, the ORIGINAL plays and the
 * logo is laid over it at playback time, so publishing is never blocked.
 */
export function VideoPlayer({ v, wm }: { v: Video; wm: WM }) {
  const src = v.processedUrl || v.originalUrl
  if (!src) return null
  const burned = Boolean(v.processedUrl && v.processedUrl !== v.originalUrl)
  const overlay = !burned && wm.enabled !== false && v.processedUrl !== v.originalUrl
  const pos = wm.position || 'tr'
  const m = `${wm.marginPercent ?? 2.5}cqw`
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black" style={{ containerType: 'inline-size' }}>
      <video controls playsInline preload="metadata" poster={videoPoster(v)} className="h-full w-full" src={src} />
      {overlay && (
        <img
          src="/logo-watermark.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{ width: `${wm.sizePercent ?? 14}%`, opacity: (wm.opacity ?? 90) / 100, [pos.startsWith('t') ? 'top' : 'bottom']: m, [pos.endsWith('r') ? 'right' : 'left']: m }}
        />
      )}
    </div>
  )
}
