/* eslint-disable @next/next/no-img-element */
'use client'

import { useRef, useState } from 'react'
import { flashTimes } from '@/lib/videoArgs'

export type FlashProps = { on: boolean; voice?: boolean; script: string; breaking?: boolean; repeat?: boolean; intervalSec?: number }

/** The <video> with the red FLASH strip shown over the bottom while it plays (when not already burned in). */
type Ad = { title: string; image: string; link?: string | null } | null

/** Video ad: first at 15 s, then every 45 s, 8 s each; the viewer can close it (the video never stops). */
const adOn = (t: number) => t >= 15 && (t - 15) % 45 < 8

export function VideoStage({ src, poster, flash, breaking, ad }: { src: string; poster?: string; flash?: FlashProps | null; breaking?: boolean; ad?: Ad }) {
  const times = useRef<number[]>([])
  const [show, setShow] = useState(false)
  const [adShow, setAdShow] = useState(false)
  const [adClosed, setAdClosed] = useState(false)
  const showSec = 7
  const strip = Boolean(flash?.on && flash.script.trim())
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className="h-full w-full"
        src={src}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => (times.current = flashTimes(e.currentTarget.duration || 0, showSec, flash?.repeat !== false, flash?.intervalSec || 20))}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          if (strip) setShow(times.current.some((x) => t >= x && t < x + showSec))
          if (ad) {
            const on = adOn(t)
            if (!on && adClosed) setAdClosed(false)
            setAdShow(on)
          }
        }}
      />
      {breaking && <span className="pointer-events-none absolute top-3 left-3 animate-pulse rounded bg-[#c8102e] px-2 py-1 text-xs font-extrabold tracking-wide text-white motion-reduce:animate-none">● BREAKING NEWS</span>}
      {ad && adShow && !adClosed && (
        <div className="anim-fade absolute top-3 right-3 w-[42%] max-w-72 overflow-hidden rounded-md bg-white shadow-xl">
          <div className="flex items-center justify-between bg-black/70 px-1.5 text-[10px] font-bold text-white">
            <span>विज्ञापन / AD</span>
            <button type="button" onClick={() => setAdClosed(true)} aria-label="बंद करें" className="px-1 text-sm leading-none">
              ×
            </button>
          </div>
          {ad.link ? (
            <a href={ad.link} target="_blank" rel="sponsored noopener noreferrer">
              <img src={ad.image} alt={ad.title} className="block w-full" />
            </a>
          ) : (
            <img src={ad.image} alt={ad.title} className="block w-full" />
          )}
        </div>
      )}
      {strip && show && (
        <div className="anim-strip pointer-events-none absolute inset-x-0 bottom-12 flex items-center gap-2 bg-[#c8102e]/95 px-3 py-2 text-sm font-bold text-white sm:text-base">
          <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-xs text-[#c8102e]">● {flash?.breaking ? 'BREAKING NEWS' : 'FLASH NEWS'}</span>
          <span>{flash!.script}</span>
        </div>
      )}
    </div>
  )
}
