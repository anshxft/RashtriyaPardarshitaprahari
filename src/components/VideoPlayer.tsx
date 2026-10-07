import type { Video } from '@/payload-types'
import { VideoStage, type FlashProps } from './VideoStage'

export type WM = { enabled?: boolean | null; position?: string | null; sizePercent?: number | null; opacity?: number | null; marginPercent?: number | null }

/** Poster / thumbnail through the checking route (never a raw storage address). */
export const videoPoster = (v: Pick<Video, 'id' | 'posterUrl' | 'thumbnail'>) => (v.posterUrl || v.thumbnail ? `/api/v/${v.id}/poster` : undefined)
export const videoThumb = videoPoster

/**
 * Public player: Watch + Share only. The source is /api/v/<id>/play (a short-lived link to the logo-watermarked website
 * version, or the final Flash + Voice version) — no file address in the page, no download button, original never served.
 */
export function VideoPlayer({ v, flash, aiNote }: { v: Video; wm?: WM; flash?: FlashProps | null; aiNote?: boolean }) {
  if (!v.processedUrl) return <p className="rounded-lg bg-surface p-6 text-center text-muted">वीडियो तैयार हो रहा है…</p>
  const burned = Boolean(v.flashUrl && flash && (flash.on || flash.voice))
  return (
    <div>
      <VideoStage src={`/api/v/${v.id}/play`} poster={videoPoster(v)} flash={burned ? null : flash} breaking={Boolean(flash?.breaking)} />
      {aiNote && flash?.voice && <p className="mt-1 text-xs text-muted">🔊 इस वीडियो में कृत्रिम (AI) आवाज़ का उपयोग किया गया है / AI voice</p>}
    </div>
  )
}
