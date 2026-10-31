/* eslint-disable @next/next/no-img-element */
'use client'

import { useRef, useState } from 'react'
import { flashTimes } from '@/lib/videoArgs'

export type FlashProps = { on: boolean; voice?: boolean; script: string; breaking?: boolean; repeat?: boolean; intervalSec?: number }

type Ad = { title: string; image: string; link?: string | null; win: { x: number; y: number; w: number; h: number } } | null

/** L-band ad (TV style): first at 10 s, then every 45 s, 12 s each. The video keeps playing, just smaller, inside the frame. */
const adOn = (t: number) => t >= 10 && (t - 10) % 45 < 12

/** The <video> with the red FLASH strip shown over the bottom while it plays (when not already burned in). */
export function VideoStage({ src, poster, flash, breaking, ad }: { src: string; poster?: string; flash?: FlashProps | null; breaking?: boolean; ad?: Ad }) {
  const times = useRef<number[]>([])
  const [show, setShow] = useState(false)
  const [adShow, setAdShow] = useState(false)
  const [adClosed, setAdClosed] = useState(false)
  const strip = Boolean(flash?.on && flash.script.trim())
  // One-line TV-style ticker: long scripts scroll across instead of covering the whole picture (phones especially),
  // and the strip stays up long enough for the full line to pass once.
  const showSec = strip ? Math.max(7, Math.ceil(flash!.script.trim().length / 9)) : 7
  const framed = Boolean(ad && adShow && !adClosed)
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`
  const screen = framed && ad ? { left: pct(ad.win.x), top: pct(ad.win.y), width: pct(ad.win.w), height: pct(ad.win.h) } : { left: '0%', top: '0%', width: '100%', height: '100%' }
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      {ad && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${framed ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!framed}>
          {ad.link ? (
            <a href={ad.link} target="_blank" rel="sponsored noopener noreferrer" tabIndex={framed ? 0 : -1}>
              <img src={ad.image} alt={ad.title} className="block h-full w-full" style={{ objectFit: 'fill' }} />
            </a>
          ) : (
            <img src={ad.image} alt={ad.title} className="block h-full w-full" style={{ objectFit: 'fill' }} />
          )}
        </div>
      )}
      <div className="absolute overflow-hidden bg-black transition-all duration-500 ease-out" style={screen}>
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster}
          className="h-full w-full object-contain"
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
        {breaking && <span className="pointer-events-none absolute top-2 left-2 animate-pulse rounded bg-[#c8102e] px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white motion-reduce:animate-none sm:top-3 sm:left-3 sm:px-2 sm:py-1 sm:text-xs">● BREAKING NEWS</span>}
        {strip && show && (
          <div className="anim-strip pointer-events-none absolute inset-x-0 bottom-1 flex items-center gap-2 bg-[#c8102e]/95 px-2 py-1 text-xs font-bold text-white sm:bottom-2 sm:px-3 sm:py-2 sm:text-base">
            <style>{`@keyframes vs-tick { from { transform: translateX(0) } to { transform: translateX(-100%) } }`}</style>
            <span className="shrink-0 rounded bg-white px-1 py-0.5 text-[10px] text-[#c8102e] sm:px-1.5 sm:text-xs">● {flash?.breaking ? 'BREAKING' : 'FLASH'}</span>
            <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
              <span className="inline-block pl-[100%] motion-reduce:pl-0" style={{ animation: `vs-tick ${showSec}s linear forwards` }}>
                {flash!.script.replace(/\s*\n+\s*/g, ' • ')}
              </span>
            </span>
          </div>
        )}
      </div>
      {framed && (
        <div className="absolute top-1 right-1 z-10 flex items-center gap-1 rounded bg-black/60 px-1.5 text-[10px] font-bold text-white">
          विज्ञापन / AD
          <button type="button" onClick={() => setAdClosed(true)} aria-label="विज्ञापन बंद करें" className="px-1 text-sm leading-none">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
