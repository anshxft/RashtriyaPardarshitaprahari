/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'
import { VIDEO_TICKER_DEFAULT } from '@/content/brand'
import { flashTimes } from '@/lib/videoArgs'

export type FlashProps = { on: boolean; voice?: boolean; audio?: boolean; script: string; breaking?: boolean; repeat?: boolean; intervalSec?: number }

type Ad = { title: string; image: string; link?: string | null; win: { x: number; y: number; w: number; h: number } } | null

/** L-band ad (TV style): first at 10 s, then every 45 s, 12 s each. The video keeps playing, just smaller, inside the frame. */
export const adOn = (t: number) => t >= 10 && (t - 10) % 45 < 12

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

/** The spoken text starts this many seconds into the video (website player and downloaded video alike). */
export const VOICE_AT = 1

/** Name-logo in the top-right corner: 0.3–6 s, then 5 s every 30 s. */
export const wordmarkOn = (t: number) => (t >= 0.3 && t < 6) || (t >= 30 && t % 30 < 5)

/** Speaker name strap: from 3 s for 10 s, again every 45 s (like a news channel lower third). */
const nameOn = (t: number) => t >= 3 && (t - 3) % 45 < 10

export function VideoStage({ src, poster, flash, breaking, ads, voice, top, bottom, tags, lang = 'hi' }: { src: string; poster?: string; flash?: FlashProps | null; breaking?: boolean; ads?: NonNullable<Ad>[]; voice?: string; top?: string | null; bottom?: string | null; tags?: VideoTags; lang?: 'hi' | 'en' }) {
  const [nameShow, setNameShow] = useState(false)
  // Full screen keeps the whole package (bands, name-logo, ads, ticker), not just the bare video. Browsers that cannot
  // put a page element full screen (iPhone) get a fixed black layer over the page instead.
  const box = useRef<HTMLDivElement>(null)
  const [fs, setFs] = useState<'off' | 'real' | 'fake'>('off')
  useEffect(() => {
    const on = () => {
      const el = document.fullscreenElement
      // Android Chrome puts the bare <video> full screen by itself (its player button, or turning the phone sideways
      // while it plays): move the full screen to the whole package instead, or cover the page with it.
      if (el && box.current && el !== box.current && box.current.contains(el)) {
        box.current.requestFullscreen().catch(() => document.exitFullscreen().catch(() => {}).finally(() => setFs('fake')))
        return
      }
      setFs(el === box.current ? 'real' : (x) => (x === 'real' ? 'off' : x))
    }
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  useEffect(() => {
    if (fs !== 'fake') return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setFs('off')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', esc)
    return () => ((document.body.style.overflow = prev), window.removeEventListener('keydown', esc))
  }, [fs])
  // in full screen the package keeps its own layout and is scaled as a whole to fit the screen
  const inner = useRef<HTMLDivElement>(null)
  const [fsFit, setFit] = useState<{ w: number; s: number } | null>(null)
  useEffect(() => {
    if (fs === 'off') return setFit(null)
    const calc = () => {
      const el = inner.current
      if (!el) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = Math.min(vw, 1100)
      if (el.offsetWidth !== w) el.style.width = `${w}px`
      setFit({ w, s: Math.min(vw / w, vh / Math.max(1, el.offsetHeight)) })
    }
    calc()
    const ro = new ResizeObserver(calc)
    if (inner.current) ro.observe(inner.current)
    window.addEventListener('resize', calc)
    return () => (ro.disconnect(), window.removeEventListener('resize', calc))
  }, [fs])
  // iPhone: its own player full screen (bare video) is swapped for the package full screen
  const vid = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = vid.current as (HTMLVideoElement & { webkitExitFullscreen?: () => void }) | null
    if (!v) return
    const swap = () => {
      setTimeout(() => v.webkitExitFullscreen?.(), 0)
      setFs('fake')
    }
    v.addEventListener('webkitbeginfullscreen', swap)
    return () => v.removeEventListener('webkitbeginfullscreen', swap)
  }, [])
  // The written text read out (TTS) over the video: starts 1 s in, follows play / pause / seek, and the video's own
  // sound is lowered while it speaks.
  const voiceEl = useRef<HTMLAudioElement>(null)
  function syncVoice(v: HTMLVideoElement) {
    const a = voiceEl.current
    if (!a) return
    const at = v.currentTime - VOICE_AT
    const on = at >= 0 && (!a.duration || at < a.duration) && !v.paused
    a.muted = v.muted
    if (on) {
      if (Math.abs(a.currentTime - at) > 0.4) a.currentTime = at
      if (a.paused) void a.play().catch(() => {})
      v.volume = 0.3
    } else {
      if (!a.paused) a.pause()
      if (v.volume === 0.3) v.volume = 1
    }
  }
  function toggleFs() {
    if (fs === 'real') return void document.exitFullscreen().catch(() => {})
    if (fs === 'fake') return setFs('off')
    const el = box.current
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => setFs('fake'))
    else setFs('fake')
  }
  // tricolour name-logo: flashes in top-right as the video starts, then every 30 s
  const [wmShow, setWmShow] = useState(false)
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
  // L-frame ads take turns: each time the frame comes up, the next advertiser
  const [adIdx, setAdIdx] = useState(0)
  const ad = ads?.length ? ads[adIdx % ads.length] : null
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
  // Desk lines for this video (one per line) run first, then the paper's standing appeal (editorial text).
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
          ref={vid}
          controls
          playsInline
          preload="metadata"
          poster={poster}
          className="h-full w-full object-contain"
          src={src}
          controlsList="nodownload noremoteplayback nofullscreen"
          disablePictureInPicture
          onDoubleClick={toggleFs}
          onPause={() => voiceEl.current?.pause()}
          onSeeked={(e) => syncVoice(e.currentTarget)}
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={(e) => (times.current = flashTimes(e.currentTarget.duration || 0, showSec, flash?.repeat !== false, flash?.intervalSec || 20))}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime
            if (tags?.name) setNameShow(nameOn(t))
            syncVoice(e.currentTarget)
            setWmShow(wordmarkOn(t))
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
              if (t >= 10) setAdIdx(Math.floor((t - 10) / 45))
              if (!on && adClosed) setAdClosed(false)
              setAdShow(on)
            }
          }}
        />
        {/* place tag (top-left, under BREAKING when that is on) */}
        {tags?.place && (
          <span className={`tv-place pointer-events-none absolute left-2 flex items-center text-[11px] font-extrabold text-white sm:left-3 sm:text-sm ${breaking ? 'top-8 sm:top-11' : 'top-2 sm:top-3'}`}>
            <span className="flex items-center self-stretch bg-[#c8102e] px-1.5 sm:px-2">
              <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3 fill-white sm:h-4 sm:w-4">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
            </span>
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
        {voice && <audio ref={voiceEl} src={voice} preload="auto" className="hidden" />}
        {wmShow && <img src="/wordmark.png" alt="" aria-hidden className="tv-wm pointer-events-none absolute top-2 right-2 z-10 w-[26%] max-w-64 sm:top-3 sm:right-3" />}
        {/* logo sting */}
        {sting > 0 && (
          <div key={sting} className="tv-sting pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <img src="/wordmark.png" alt="" className="tv-sting-logo w-[52%] max-w-lg drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={toggleFs}
        aria-label={fs === 'off' ? (lang === 'hi' ? 'फुल स्क्रीन' : 'Full screen') : lang === 'hi' ? 'फुल स्क्रीन बंद' : 'Exit full screen'}
        className="absolute right-2 bottom-12 z-30 flex h-9 w-9 items-center justify-center rounded-md bg-black/55 text-white opacity-80 hover:opacity-100 sm:bottom-14"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white stroke-[2.5]">
          {fs === 'off' ? <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /> : <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />}
        </svg>
      </button>
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
  // full screen: the package is scaled to fit the screen (bands ≈ 230 px tall at large sizes), centred on black
  // same element tree on and off (only styles change), so the playing video is never re-created
  const fsWrap = (content: React.ReactNode) => (
    <div ref={box} className={fs === 'off' ? '' : `overflow-hidden bg-black ${fs === 'fake' ? 'fixed inset-0 z-[100]' : 'relative h-full w-full'}`}>
      <div
        ref={inner}
        className={fs === 'off' ? '' : 'absolute top-1/2 left-1/2'}
        style={fs === 'off' ? undefined : { width: fsFit?.w ?? '100vw', transform: `translate(-50%, -50%) scale(${fsFit?.s ?? 1})`, visibility: fsFit ? 'visible' : 'hidden' }}
      >
        {content}
      </div>
    </div>
  )
  if (!banded) return fsWrap(stage)
  // News-channel look: red headline band + blue “HEADLINE NEWS” bar on top; under the video a big red band whose lines
  // take turns (BREAKING NEWS · second headline · flash sentences), a “देखें” box with the logo, and a white ticker.
  const cur = lines[li % Math.max(1, nLines)]
  return fsWrap(
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
            <img src="/wordmark.png" alt="" className="w-14 sm:w-24" />
            <span className="text-[9px] leading-tight font-bold sm:text-xs">{lang === 'hi' ? 'देखें वेबसाइट' : 'Visit website'}</span>
          </div>
        </div>
      )}
      <div className="mt-1 overflow-hidden bg-white py-0.5 text-[11px] font-bold whitespace-nowrap text-[#7a0000] sm:text-sm">
        <span ref={tickerRef} className="tv-ticker inline-block" style={{ animationDuration: `${tickerSec}s` }}>
          {ticker.repeat(2)}
        </span>
      </div>
    </div>,
  )
}
