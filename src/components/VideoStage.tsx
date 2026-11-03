/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'
import { VIDEO_TICKER_DEFAULT } from '@/content/brand'
import { flashTimes } from '@/lib/videoArgs'

export type FlashProps = { on: boolean; voice?: boolean; script: string; breaking?: boolean; repeat?: boolean; intervalSec?: number }

type Ad = { title: string; image: string; link?: string | null; win: { x: number; y: number; w: number; h: number } } | null

/** L-band ad (TV style): first at 10 s, then every 45 s, 12 s each. The video keeps playing, just smaller, inside the frame. */
const adOn = (t: number) => t >= 10 && (t - 10) % 45 < 12

/** The <video> with the red FLASH strip shown over the bottom while it plays (when not already burned in). */
export type VideoTags = { place?: string | null; name?: string | null; role?: string | null; ticker?: string | null } | null

const BUMP = '\u0000BREAKING'

/**
 * Logo “sting” sound, made in the browser (no audio file): a filtered-noise whoosh rising and falling, a soft low hit
 * and a short bright shimmer. Plays only when the viewer has the video's sound on.
 */
function whoosh(volume: number) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const now = ctx.currentTime
    const v = Math.max(0.05, Math.min(1, volume)) * 0.35
    const len = Math.floor(ctx.sampleRate * 1.4)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.2
    bp.frequency.setValueAtTime(300, now)
    bp.frequency.exponentialRampToValueAtTime(3200, now + 0.55)
    bp.frequency.exponentialRampToValueAtTime(500, now + 1.3)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(v, now + 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.35)
    noise.connect(bp).connect(g).connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 1.4)
    // low hit when the logo lands
    const boom = ctx.createOscillator()
    boom.type = 'sine'
    boom.frequency.setValueAtTime(110, now + 0.5)
    boom.frequency.exponentialRampToValueAtTime(42, now + 1.1)
    const bg = ctx.createGain()
    bg.gain.setValueAtTime(0.0001, now + 0.48)
    bg.gain.exponentialRampToValueAtTime(v * 1.6, now + 0.52)
    bg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
    boom.connect(bg).connect(ctx.destination)
    boom.start(now + 0.48)
    boom.stop(now + 1.25)
    // shimmer
    const sh = ctx.createOscillator()
    sh.type = 'triangle'
    sh.frequency.setValueAtTime(1400, now + 0.5)
    sh.frequency.exponentialRampToValueAtTime(2400, now + 0.9)
    const sg = ctx.createGain()
    sg.gain.setValueAtTime(0.0001, now + 0.5)
    sg.gain.exponentialRampToValueAtTime(v * 0.25, now + 0.55)
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.0)
    sh.connect(sg).connect(ctx.destination)
    sh.start(now + 0.5)
    sh.stop(now + 1.05)
    setTimeout(() => ctx.close().catch(() => {}), 1800)
  } catch {
    /* no Web Audio — silent sting */
  }
}

/** Speaker name strap: from 3 s for 10 s, again every 45 s (like a news channel lower third). */
const nameOn = (t: number) => t >= 3 && (t - 3) % 45 < 10

export function VideoStage({ src, poster, flash, breaking, ad, top, bottom, tags, lang = 'hi' }: { src: string; poster?: string; flash?: FlashProps | null; breaking?: boolean; ad?: Ad; top?: string | null; bottom?: string | null; tags?: VideoTags; lang?: 'hi' | 'en' }) {
  const [nameShow, setNameShow] = useState(false)
  // Logo sting (intro): when the video starts and then once a minute.
  const [sting, setSting] = useState(0)
  const lastSting = useRef(-1)
  // Lower band: lines take turns (BREAKING NEWS · second headline · each sentence of the approved flash script).
  const script = (flash?.on ? flash.script : '').split(/[।!?\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, 6)
  const lines = [...(breaking ? [BUMP] : []), ...(bottom ? [bottom] : []), ...script]
  if (!lines.length && top) lines.push(top)
  const [li, setLi] = useState(0)
  const nLines = lines.length
  useEffect(() => {
    if (nLines < 2) return
    const t = setInterval(() => setLi((i) => (i + 1) % nLines), 4500)
    return () => clearInterval(t)
  }, [nLines])
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
  const banded = Boolean(top || bottom)
  // Bands stay 1–2 lines: longer text gets smaller letters (the full headline is written above the player anyway).
  const fit = (t: string) => (t.length <= 55 ? 'text-xl sm:text-3xl' : t.length <= 100 ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl')
  // Desk lines for this video (one per line) run first, then the paper's standing appeal (client's text).
  const own = (tags?.ticker || '').split(/\n+/).map((x) => x.trim()).filter(Boolean)
  const ticker = [...own, ...VIDEO_TICKER_DEFAULT].join('   ✦   ') + '   ✦   '
  // Fixed speed whatever the text length: the real width is measured and the run takes width ÷ speed seconds.
  const tickerRef = useRef<HTMLSpanElement>(null)
  const [tickerSec, setTickerSec] = useState(60)
  useEffect(() => {
    const el = tickerRef.current
    if (!el) return
    const pxPerSec = window.innerWidth < 640 ? 70 : 110
    setTickerSec(Math.max(8, Math.round(el.scrollWidth / pxPerSec)))
  }, [ticker])
  const stage = (
    <div className={`relative aspect-video overflow-hidden bg-black ${banded ? '' : 'rounded-lg'}`}>
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
            if (tags?.name) setNameShow(nameOn(t))
            const minute = Math.floor(t / 60)
            if (banded && t % 60 < 0.8 && lastSting.current !== minute && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
              lastSting.current = minute
              setSting(Date.now())
              setTimeout(() => setSting(0), 2000)
              const vid = e.currentTarget
              if (!vid.muted && vid.volume > 0) whoosh(vid.volume)
            }
            // The video's details can load before the page wakes up (then onLoadedMetadata is missed): work the times out here.
            if (strip && !times.current.length && e.currentTarget.duration) times.current = flashTimes(e.currentTarget.duration, showSec, flash?.repeat !== false, flash?.intervalSec || 20)
            if (strip) setShow(times.current.some((x) => t >= x && t < x + showSec))
            if (ad) {
              const on = adOn(t)
              if (!on && adClosed) setAdClosed(false)
              setAdShow(on)
            }
          }}
        />
        {/* place tag (top-left, under BREAKING when that is on) */}
        {tags?.place && (
          <span className={`tv-place pointer-events-none absolute left-2 flex items-center text-[11px] font-extrabold text-white sm:left-3 sm:text-sm ${breaking ? 'top-8 sm:top-11' : 'top-2 sm:top-3'}`}>
            <span className="bg-[#c8102e] px-1.5 py-0.5 sm:px-2">📍</span>
            <span className="bg-black/80 px-2 py-0.5 sm:px-3">{tags.place}</span>
          </span>
        )}
        {/* speaker name strap (lower third, above the red ticker) */}
        {tags?.name && nameShow && (
          <div className={`tv-name pointer-events-none absolute left-2 max-w-[75%] sm:left-4 ${banded ? 'bottom-3 sm:bottom-5' : 'bottom-10 sm:bottom-14'}`}>
            <p className="bg-white px-2 py-0.5 text-sm leading-snug font-black text-[#0b1f4d] shadow-lg sm:px-3 sm:py-1 sm:text-xl">{tags.name}</p>
            {tags.role && <p className="inline-block bg-[#c8102e] px-2 py-0.5 text-[11px] font-bold text-white sm:px-3 sm:text-sm">{tags.role}</p>}
          </div>
        )}
        {/* BREAKING label: keeps flipping over — “BREAKING NEWS” on one side, “ब्रेकिंग न्यूज़” on the other */}
        {breaking && (
          <span className="tv-flipbox pointer-events-none absolute top-2 left-2 sm:top-3 sm:left-3" aria-label="BREAKING NEWS">
            <span className="tv-flipcard">
              <span className="tv-face rounded bg-[#c8102e] px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide whitespace-nowrap text-white sm:px-2 sm:py-1 sm:text-xs">● BREAKING NEWS</span>
              <span className="tv-face tv-back rounded px-1.5 py-0.5 text-[10px] font-extrabold whitespace-nowrap text-white sm:px-2 sm:py-1 sm:text-xs">● ब्रेकिंग न्यूज़</span>
            </span>
          </span>
        )}
        {strip && show && !banded && (
          <div className="anim-strip tv-strip pointer-events-none absolute inset-x-0 bottom-1 flex items-center gap-2 bg-[#c8102e]/95 px-2 py-1 text-xs font-bold text-white sm:bottom-2 sm:px-3 sm:py-2 sm:text-base">
            <style>{`@keyframes vs-tick { from { transform: translateX(0) } to { transform: translateX(-100%) } }`}</style>
            <span className="tv-pill shrink-0 rounded bg-white px-1 py-0.5 text-[10px] font-black text-[#c8102e] sm:px-1.5 sm:text-xs">● {flash?.breaking ? 'BREAKING' : 'FLASH'}</span>
            <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
              <span className="inline-block pl-[100%] motion-reduce:pl-0" style={{ animation: `vs-tick ${Math.max(4, showSec - 2.4)}s linear 2.2s both` }}>
                {flash!.script.replace(/\s*\n+\s*/g, ' • ')}
              </span>
            </span>
            {/* opening bumper: “BREAKING” flips to “NEWS”, then the scrolling line takes over */}
            <span className="tv-bump absolute inset-0 items-center justify-center bg-[#c8102e] text-base font-black tracking-[0.25em] text-white italic sm:text-2xl" aria-hidden>
              <span>{flash?.breaking ? 'BREAKING' : 'FLASH'}</span>
              <span>NEWS</span>
            </span>
          </div>
        )}
        {/* logo sting */}
        {sting > 0 && (
          <div key={sting} className="tv-sting pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <img src="/logo-watermark.png" alt="" className="tv-sting-logo w-[46%] max-w-md drop-shadow-[0_0_30px_rgba(255,210,63,0.9)]" />
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
  if (!banded) return stage
  // News-channel look: red headline band + blue “HEADLINE NEWS” bar on top; under the video a big red band whose lines
  // take turns (BREAKING NEWS · second headline · flash sentences), a “देखें” box with the logo, and a white ticker.
  const cur = lines[li % Math.max(1, nLines)]
  return (
    <div className="tv-frame tv-redframe overflow-hidden rounded-lg p-1 sm:p-1.5">
      {top && (
        <>
          <p className={`tv-top line-clamp-2 px-3 py-1.5 text-center font-display leading-snug font-black text-white sm:px-5 sm:py-2 ${fit(top)}`} title={top}>
            {top}
          </p>
          <p className="tv-bar py-1 text-center text-xl text-white sm:py-1.5 sm:text-4xl" aria-label="HEADLINE NEWS">
            <span className="tv-bar-text tv-3d" aria-hidden>
              {'HEADLINE NEWS'.split('').map((ch, i) => (
                <span key={i} className="tv-3d-ch" style={{ animationDelay: `${i * 0.07}s` }}>
                  {ch === ' ' ? '\u00a0' : ch}
                </span>
              ))}
            </span>
          </p>
        </>
      )}
      {stage}
      {cur && (
        <div className="tv-lower mt-1 flex items-stretch gap-1">
          <div className="tv-lower-main relative flex min-h-12 flex-1 items-center justify-center overflow-hidden px-2 sm:min-h-20 sm:px-4">
            {cur === BUMP ? (
              <span key={`b${li}`} className="tv-bnews text-2xl font-black tracking-wide text-[#ffd84a] italic sm:text-5xl">
                BREAKING NEWS
              </span>
            ) : (
              <span key={`l${li}`} className={`tv-line line-clamp-2 text-center font-display leading-snug font-black text-white ${fit(cur)}`}>
                {cur}
              </span>
            )}
          </div>
          <div className="tv-see flex w-16 shrink-0 flex-col items-center justify-center border-2 border-white/90 bg-[#c8102e] px-1 text-center text-white sm:w-28">
            <img src="/logo-watermark.png" alt="" className="w-10 sm:w-16" />
            <span className="text-[9px] leading-tight font-bold sm:text-xs">{lang === 'hi' ? 'देखें वेबसाइट' : 'Visit website'}</span>
          </div>
        </div>
      )}
      <div className="mt-1 overflow-hidden bg-white py-0.5 text-[11px] font-bold whitespace-nowrap text-[#7a0000] sm:text-sm">
        <span ref={tickerRef} className="tv-ticker inline-block" style={{ animationDuration: `${tickerSec}s` }}>
          {ticker.repeat(2)}
        </span>
      </div>
    </div>
  )
}
