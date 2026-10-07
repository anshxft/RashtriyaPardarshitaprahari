'use client'

import { useRef, useState } from 'react'
import { flashTimes } from '@/lib/videoArgs'

export type FlashProps = { on: boolean; voice?: boolean; script: string; breaking?: boolean; repeat?: boolean; intervalSec?: number }

/** The <video> with the red FLASH strip shown over the bottom while it plays (when not already burned in). */
export function VideoStage({ src, poster, flash, breaking }: { src: string; poster?: string; flash?: FlashProps | null; breaking?: boolean }) {
  const times = useRef<number[]>([])
  const [show, setShow] = useState(false)
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
        onTimeUpdate={(e) => strip && setShow(times.current.some((t) => e.currentTarget.currentTime >= t && e.currentTarget.currentTime < t + showSec))}
      />
      {breaking && <span className="pointer-events-none absolute top-3 left-3 animate-pulse rounded bg-[#c8102e] px-2 py-1 text-xs font-extrabold tracking-wide text-white motion-reduce:animate-none">● BREAKING NEWS</span>}
      {strip && show && (
        <div className="anim-strip pointer-events-none absolute inset-x-0 bottom-12 flex items-center gap-2 bg-[#c8102e]/95 px-3 py-2 text-sm font-bold text-white sm:text-base">
          <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-xs text-[#c8102e]">● {flash?.breaking ? 'BREAKING NEWS' : 'FLASH NEWS'}</span>
          <span>{flash!.script}</span>
        </div>
      )}
    </div>
  )
}
