import { getVideoFrameAds } from '@/lib/data'
import type { Video } from '@/payload-types'
import { VideoStage, type FlashProps, type VideoTags } from './VideoStage'

export type WM = { enabled?: boolean | null; position?: string | null; sizePercent?: number | null; opacity?: number | null; marginPercent?: number | null }

/** Poster / thumbnail through the checking route (never a raw storage address). */
// ?t= changes when the thumbnail is changed, so browsers never keep showing the old picture.
export const videoPoster = (v: Pick<Video, 'id' | 'posterUrl' | 'thumbnail'>) => {
  const t = typeof v.thumbnail === 'object' && v.thumbnail ? v.thumbnail.id : v.thumbnail
  return v.posterUrl || t ? `/api/v/${v.id}/poster?t=${t || 'auto'}` : undefined
}
export const videoThumb = videoPoster

/**
 * Public player: Watch + Share only. The source is /api/v/<id>/play (a short-lived link to the logo-watermarked website
 * version, or the final Flash + Voice version) — no file address in the page, no download button, original never served.
 */
export async function VideoPlayer({ v, flash, aiNote, top, bottom, tags, lang = 'hi' }: { v: Video; wm?: WM; flash?: FlashProps | null; aiNote?: boolean; top?: string | null; bottom?: string | null; tags?: VideoTags; lang?: 'hi' | 'en' }) {
  if (!v.processedUrl) return <p className="rounded-lg bg-surface p-6 text-center text-muted">{lang === 'hi' ? 'वीडियो तैयार हो रहा है…' : 'The video is being prepared…'}</p>
  const ads = await getVideoFrameAds()
  const burned = Boolean(v.flashUrl && flash && (flash.on || flash.voice))
  return (
    <div>
      <VideoStage src={`/api/v/${v.id}/play`} poster={videoPoster(v)} flash={burned ? null : flash} breaking={Boolean(flash?.breaking)} ads={ads} top={top} bottom={bottom} tags={tags} lang={lang} />
      {aiNote && flash?.voice && <p className="mt-1 text-xs text-muted">{lang === 'hi' ? 'इस वीडियो में कृत्रिम (AI) आवाज़ का उपयोग किया गया है।' : 'This video uses an artificial (AI) voice.'}</p>}
    </div>
  )
}
