'use client'

import { useRef, useState } from 'react'
import { VIDEO_TICKER_DEFAULT } from '@/content/brand'

export type PackageInput = {
  src: string // the website version (with logo), a URL the browser may read (CORS)
  fileName: string // without extension
  top: string // headline (red band)
  bottom?: string | null // second headline
  script?: string | null // approved flash script (lines take turns in the lower band)
  breaking?: boolean
  place?: string | null
  name?: string | null
  role?: string | null
  ticker?: string | null // Desk lines for the white ticker (one per line)
}

const W = 1280
const H = 1080
const PAD = 12
const TOP_H = 112
const BAR_H = 70
const VID = { x: PAD, y: PAD + TOP_H + BAR_H, w: W - PAD * 2, h: Math.round(((W - PAD * 2) * 9) / 16) }
const LOW_Y = VID.y + VID.h + 6
const LOW_H = 118
const TICK_Y = LOW_Y + LOW_H + 6
const TICK_H = H - PAD - TICK_Y
const LINE_SEC = 4.5
const BUMP = '\u0000B'

/** Pick the size that fits `text` into `maxLines` lines of `maxW`, largest first. */
function fitLines(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, sizes: number[], maxW: number, maxLines: number) {
  for (const size of sizes) {
    ctx.font = `${weight} ${size}px ${family}`
    const words = text.split(/\s+/)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w
      if (ctx.measureText(t).width <= maxW || !cur) cur = t
      else (lines.push(cur), (cur = w))
    }
    if (cur) lines.push(cur)
    if (lines.length <= maxLines || size === sizes[sizes.length - 1]) return { size, lines: lines.slice(0, maxLines) }
  }
  return { size: sizes[0], lines: [text] }
}

/** The logo sting sound (same recipe as the website player), routed into the recording. */
function whoosh(ctx: AudioContext, out: AudioNode) {
  const now = ctx.currentTime
  const v = 0.35
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
  noise.connect(bp).connect(g).connect(out)
  noise.start(now)
  noise.stop(now + 1.4)
  const boom = ctx.createOscillator()
  boom.frequency.setValueAtTime(110, now + 0.5)
  boom.frequency.exponentialRampToValueAtTime(42, now + 1.1)
  const bg = ctx.createGain()
  bg.gain.setValueAtTime(0.0001, now + 0.48)
  bg.gain.exponentialRampToValueAtTime(v * 1.6, now + 0.52)
  bg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
  boom.connect(bg).connect(out)
  boom.start(now + 0.48)
  boom.stop(now + 1.25)
}

const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })

/**
 * Desk → Download for a video news: plays the video in this browser and records it with the whole on-screen package
 * (headline band, HEADLINE NEWS bar, BREAKING label, place / name tags, turning lower band, logo box, ticker, logo
 * sting with its sound). Runs in real time; the result is saved as one video file.
 */
export function PackageRecorder({ input, onDownload }: { input: PackageInput; onDownload?: (kind: string) => Promise<unknown> }) {
  const [state, setState] = useState<'idle' | 'rec' | 'done' | 'err'>('idle')
  const [pct, setPct] = useState(0)
  const [msg, setMsg] = useState('')
  const [file, setFile] = useState<{ url: string; name: string } | null>(null)
  const stop = useRef<() => void>(() => {})
  const preview = useRef<HTMLCanvasElement>(null)

  async function start() {
    setState('rec')
    setPct(0)
    setMsg('तैयारी…')
    try {
      await document.fonts.ready
      const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
      const logo = await load('/logo-watermark.png')
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.playsInline = true
      video.preload = 'auto'
      video.src = input.src
      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res()
        video.onerror = () => rej(new Error('वीडियो फ़ाइल खुल नहीं पाई'))
      })
      const dur = video.duration || 1

      const canvas = preview.current!
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!

      // audio: video sound + sting whoosh → the recording (not to the speakers)
      const ac = new AudioContext()
      const dest = ac.createMediaStreamDestination()
      ac.createMediaElementSource(video).connect(dest)

      const stream = canvas.captureStream(30)
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
      const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || ''
      const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 160_000 })
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)

      const script = (input.script || '').split(/[।!?\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, 6)
      const lines = [...(input.breaking ? [BUMP] : []), ...(input.bottom ? [input.bottom] : []), ...script]
      if (!lines.length) lines.push(input.top)
      const own = (input.ticker || '').split(/\n+/).map((x) => x.trim()).filter(Boolean)
      const tickText = [...own, ...VIDEO_TICKER_DEFAULT].join('   ✦   ') + '   ✦   '
      ctx.font = `700 22px ${family}`
      const tickW = ctx.measureText(tickText).width
      const topFit = fitLines(ctx, input.top, family, 800, [44, 40, 36, 32, 28], W - PAD * 2 - 40, 2)
      let lastSting = -1
      let stingAt = -10

      const frame = () => {
        const t = video.currentTime
        // sting: start and every 60 s
        const minute = Math.floor(t / 60)
        if (t % 60 < 0.8 && minute !== lastSting) {
          lastSting = minute
          stingAt = t
          whoosh(ac, dest)
        }
        // background frame
        const bg = ctx.createRadialGradient(W * 0.2, H * 0.1, 50, W * 0.5, H * 0.5, W)
        bg.addColorStop(0, '#e3171b')
        bg.addColorStop(0.5, '#a80d10')
        bg.addColorStop(1, '#5c0003')
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, W, H)
        // top band
        let g = ctx.createLinearGradient(0, PAD, 0, PAD + TOP_H)
        g.addColorStop(0, '#ff2a1a')
        g.addColorStop(0.45, '#e10600')
        g.addColorStop(1, '#a80000')
        ctx.fillStyle = g
        ctx.fillRect(PAD, PAD, W - PAD * 2, TOP_H - 4)
        ctx.fillStyle = '#ffd23f'
        ctx.fillRect(PAD, PAD + TOP_H - 4, W - PAD * 2, 4)
        ctx.font = `800 ${topFit.size}px ${family}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const lh = topFit.size * 1.25
        const ty = PAD + (TOP_H - 4) / 2 - ((topFit.lines.length - 1) * lh) / 2
        topFit.lines.forEach((l, i) => {
          ctx.fillStyle = 'rgba(0,0,0,0.45)'
          ctx.fillText(l, W / 2, ty + i * lh + 2)
          ctx.fillStyle = '#fff'
          ctx.fillText(l, W / 2, ty + i * lh)
        })
        // HEADLINE NEWS bar (maroon, gold rules, gold 3-D letters with a turning wave)
        const by = PAD + TOP_H
        g = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
        g.addColorStop(0, '#120000')
        g.addColorStop(0.28, '#3d0306')
        g.addColorStop(0.5, '#6b0a0f')
        g.addColorStop(0.72, '#3d0306')
        g.addColorStop(1, '#120000')
        ctx.fillStyle = g
        ctx.fillRect(PAD, by, W - PAD * 2, BAR_H)
        ctx.fillStyle = '#e8b931'
        ctx.fillRect(PAD, by, W - PAD * 2, 2)
        ctx.fillRect(PAD, by + BAR_H - 2, W - PAD * 2, 2)
        const word = 'HEADLINE NEWS'
        ctx.font = `900 46px Anton, Impact, 'Arial Narrow', ${family}`
        const spacing = 6
        const total = [...word].reduce((s, ch) => s + ctx.measureText(ch).width + spacing, -spacing)
        let x = W / 2 - total / 2
        const wave = (t % 5) / 5
        ;[...word].forEach((ch, i) => {
          const cw = ctx.measureText(ch).width
          const p = (wave - 0.62 - i * 0.014) / 0.16 // a short flip per letter, one after another
          const sy = p > 0 && p < 1 ? Math.cos(p * Math.PI * 2) : 1
          ctx.save()
          ctx.translate(x + cw / 2, by + BAR_H / 2 + 2)
          ctx.scale(1, sy)
          ctx.textAlign = 'center'
          ;['#7a0a0a', '#b06a10', '#d99a1e', '#f5c84c'].forEach((c, k) => {
            ctx.fillStyle = c
            ctx.fillText(ch, 0, 5 - k)
          })
          ctx.shadowColor = 'rgba(255,200,80,0.8)'
          ctx.shadowBlur = 12
          ctx.fillStyle = '#fff'
          ctx.fillText(ch, 0, 0)
          ctx.restore()
          x += cw + spacing
        })
        // video
        ctx.fillStyle = '#000'
        ctx.fillRect(VID.x, VID.y, VID.w, VID.h)
        const vr = video.videoWidth / video.videoHeight || 16 / 9
        let vw = VID.w
        let vh = vw / vr
        if (vh > VID.h) (vh = VID.h), (vw = vh * vr)
        ctx.drawImage(video, VID.x + (VID.w - vw) / 2, VID.y + (VID.h - vh) / 2, vw, vh)
        // BREAKING label (flips over every 6 s)
        let ly = VID.y + 18
        if (input.breaking) {
          const ph = (t % 6) / 6
          const back = ph >= 0.45 && ph < 0.95
          const turning = (ph > 0.4 && ph < 0.5) || ph > 0.9
          const sy = turning ? Math.abs(Math.cos(((ph % 0.5) / 0.1) * Math.PI)) : 1
          const label = back ? '● ब्रेकिंग न्यूज़' : '● BREAKING NEWS'
          ctx.font = `800 22px ${family}`
          const lw = ctx.measureText(label).width + 24
          ctx.save()
          ctx.translate(VID.x + 18, ly + 18)
          ctx.scale(1, Math.max(0.05, sy))
          ctx.shadowColor = back ? 'rgba(232,185,49,0.9)' : 'rgba(255,40,30,0.9)'
          ctx.shadowBlur = 14 + 6 * Math.sin(t * 4)
          ctx.fillStyle = back ? '#3a0306' : '#c8102e'
          ctx.fillRect(0, -18, lw, 36)
          ctx.shadowBlur = 0
          if (back) {
            ctx.strokeStyle = '#e8b931'
            ctx.lineWidth = 2
            ctx.strokeRect(0, -18, lw, 36)
          }
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'left'
          ctx.fillText(label, 12, 1)
          ctx.restore()
          ly += 46
        }
        if (input.place) {
          ctx.font = `800 22px ${family}`
          const pw = ctx.measureText(input.place).width + 24
          ctx.fillStyle = '#c8102e'
          ctx.fillRect(VID.x + 18, ly, 34, 34)
          ctx.fillStyle = 'rgba(0,0,0,0.8)'
          ctx.fillRect(VID.x + 52, ly, pw, 34)
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'left'
          ctx.fillText('📍', VID.x + 22, ly + 18)
          ctx.fillText(input.place, VID.x + 64, ly + 18)
        }
        // speaker name strap: from 3 s for 10 s, every 45 s
        if (input.name && t >= 3 && (t - 3) % 45 < 10) {
          const nx = VID.x + 24
          const nyy = VID.y + VID.h - (input.role ? 110 : 76)
          ctx.font = `900 34px ${family}`
          const nw = ctx.measureText(input.name).width + 32
          ctx.shadowColor = 'rgba(255,255,255,0.7)'
          ctx.shadowBlur = 12
          ctx.fillStyle = '#fff'
          ctx.fillRect(nx, nyy, nw, 50)
          ctx.shadowBlur = 0
          ctx.fillStyle = '#0b1f4d'
          ctx.textAlign = 'left'
          ctx.fillText(input.name, nx + 16, nyy + 26)
          if (input.role) {
            ctx.font = `700 22px ${family}`
            const rw = ctx.measureText(input.role).width + 28
            ctx.fillStyle = '#c8102e'
            ctx.fillRect(nx, nyy + 50, rw, 34)
            ctx.fillStyle = '#fff'
            ctx.fillText(input.role, nx + 14, nyy + 68)
          }
        }
        // logo sting
        const st = t - stingAt
        if (st >= 0 && st < 2) {
          const k = st / 2
          const flash = k < 0.22 ? k / 0.22 : k > 0.8 ? (1 - k) / 0.2 : 1
          const rg = ctx.createRadialGradient(VID.x + VID.w / 2, VID.y + VID.h / 2, 10, VID.x + VID.w / 2, VID.y + VID.h / 2, VID.w * 0.6)
          rg.addColorStop(0, `rgba(255,255,255,${0.5 * flash})`)
          rg.addColorStop(0.45, `rgba(200,16,46,${0.5 * flash})`)
          rg.addColorStop(1, `rgba(0,0,0,${0.4 * flash})`)
          ctx.fillStyle = rg
          ctx.fillRect(VID.x, VID.y, VID.w, VID.h)
          const sc = k < 0.28 ? 0.15 + (k / 0.28) * 0.95 : k < 0.38 ? 1.1 - ((k - 0.28) / 0.1) * 0.13 : k < 0.78 ? 1 : 1 + ((k - 0.78) / 0.22) * 0.5
          const op = k < 0.28 ? k / 0.28 : k > 0.78 ? 1 - (k - 0.78) / 0.22 : 1
          const lw2 = VID.w * 0.46 * sc
          const lh2 = (lw2 * logo.height) / logo.width
          ctx.save()
          ctx.globalAlpha = Math.max(0, Math.min(1, op))
          ctx.shadowColor = 'rgba(255,210,63,0.9)'
          ctx.shadowBlur = 30
          ctx.drawImage(logo, VID.x + VID.w / 2 - lw2 / 2, VID.y + VID.h / 2 - lh2 / 2, lw2, lh2)
          ctx.restore()
        }
        // lower band: lines take turns
        const li = Math.floor(t / LINE_SEC) % lines.length
        const into = (t % LINE_SEC) / LINE_SEC
        const boxW = 170
        const mainW = W - PAD * 2 - boxW - 6
        g = ctx.createLinearGradient(0, LOW_Y, 0, LOW_Y + LOW_H)
        g.addColorStop(0, '#ff2b1f')
        g.addColorStop(0.55, '#d40c0c')
        g.addColorStop(1, '#9e0000')
        ctx.fillStyle = g
        ctx.fillRect(PAD, LOW_Y, mainW, LOW_H)
        ctx.save()
        ctx.beginPath()
        ctx.rect(PAD, LOW_Y, mainW, LOW_H)
        ctx.clip()
        const cur = lines[li]
        ctx.textAlign = 'center'
        if (cur === BUMP) {
          const s = into < 0.12 ? 2.2 - (into / 0.12) * 1.25 : into < 0.18 ? 0.95 + ((into - 0.12) / 0.06) * 0.09 : 1
          ctx.save()
          ctx.translate(PAD + mainW / 2, LOW_Y + LOW_H / 2)
          ctx.scale(s, s)
          ctx.font = `italic 900 64px ${family}`
          ctx.shadowColor = 'rgba(255,216,74,0.85)'
          ctx.shadowBlur = 16
          ctx.fillStyle = '#7a0000'
          ctx.fillText('BREAKING NEWS', 0, 3)
          ctx.fillStyle = '#ffd84a'
          ctx.fillText('BREAKING NEWS', 0, 0)
          ctx.restore()
        } else {
          const f = fitLines(ctx, cur, family, 800, [42, 38, 34, 30, 26], mainW - 40, 2)
          const off = into < 0.12 ? (1 - into / 0.12) * LOW_H * 0.7 : 0
          ctx.font = `800 ${f.size}px ${family}`
          const lh3 = f.size * 1.25
          const y0 = LOW_Y + LOW_H / 2 - ((f.lines.length - 1) * lh3) / 2 + off
          f.lines.forEach((l, i) => {
            ctx.fillStyle = 'rgba(0,0,0,0.45)'
            ctx.fillText(l, PAD + mainW / 2, y0 + i * lh3 + 2)
            ctx.fillStyle = '#fff'
            ctx.fillText(l, PAD + mainW / 2, y0 + i * lh3)
          })
        }
        ctx.restore()
        // logo box
        const bx = PAD + mainW + 6
        ctx.fillStyle = '#c8102e'
        ctx.fillRect(bx, LOW_Y, boxW, LOW_H)
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'
        ctx.lineWidth = 3
        ctx.strokeRect(bx + 1.5, LOW_Y + 1.5, boxW - 3, LOW_H - 3)
        const lgw = 110
        ctx.drawImage(logo, bx + (boxW - lgw) / 2, LOW_Y + 10, lgw, (lgw * logo.height) / logo.width)
        ctx.font = `700 18px ${family}`
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.fillText('देखें वेबसाइट', bx + boxW / 2, LOW_Y + LOW_H - 16)
        // ticker
        ctx.fillStyle = '#fff'
        ctx.fillRect(PAD, TICK_Y, W - PAD * 2, TICK_H)
        ctx.save()
        ctx.beginPath()
        ctx.rect(PAD, TICK_Y, W - PAD * 2, TICK_H)
        ctx.clip()
        ctx.font = `700 22px ${family}`
        ctx.fillStyle = '#7a0000'
        ctx.textAlign = 'left'
        const tx = W - PAD - ((t * 110) % (tickW + W))
        ctx.fillText(tickText, tx, TICK_Y + TICK_H / 2 + 1)
        ctx.fillText(tickText, tx + tickW, TICK_Y + TICK_H / 2 + 1)
        ctx.restore()

        setPct(Math.min(99, Math.round((t / dur) * 100)))
        if (!video.ended && !video.paused) raf = requestAnimationFrame(frame)
      }
      let raf = 0
      let cancelled = false
      stop.current = () => {
        cancelled = true
        video.pause()
        if (rec.state !== 'inactive') rec.stop()
      }
      const finished = new Promise<void>((res) => (rec.onstop = () => res()))
      video.onended = () => rec.state !== 'inactive' && rec.stop()
      await ac.resume()
      rec.start(1000)
      setMsg('रिकॉर्डिंग चल रही है — यह टैब खुला रखें')
      await video.play()
      raf = requestAnimationFrame(frame)
      await finished
      cancelAnimationFrame(raf)
      ac.close().catch(() => {})
      if (cancelled) return setState('idle')
      const ext = (rec.mimeType || mime).includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunks, { type: rec.mimeType || mime || 'video/webm' })
      const url = URL.createObjectURL(blob)
      setFile({ url, name: `${input.fileName}_news.${ext}` })
      setPct(100)
      setState('done')
      onDownload?.('video-package').catch(() => {})
      const a = document.createElement('a')
      a.href = url
      a.download = `${input.fileName}_news.${ext}`
      a.click()
    } catch (e) {
      const m = (e as Error).name === 'SecurityError' ? 'ब्राउज़र ने वीडियो फ़ाइल को रिकॉर्ड करने की अनुमति नहीं दी (फ़ाइल-सर्वर की CORS सेटिंग)। “सिर्फ वीडियो” वाला डाउनलोड लें और हमें बताएं।' : (e as Error).message || 'कुछ गड़बड़ हुई'
      setMsg(m)
      setState('err')
    }
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-[#c8102e] bg-bg p-4">
      <p className="font-display text-lg font-bold">🎬 पूरे डिज़ाइन के साथ वीडियो</p>
      <p className="text-sm text-muted">ऊपर की हेडलाइन, HEADLINE NEWS पट्टी, BREAKING, जगह / नाम, नीचे की बदलती लाल पट्टी, लोगो बॉक्स, चलती पट्टी और लोगो-इंट्रो (आवाज़ के साथ) — सब वीडियो में छपकर डाउनलोड होगा। जितना लंबा वीडियो, उतना समय लगेगा (3 मिनट का वीडियो ≈ 3 मिनट)। इस दौरान यह टैब खुला और सामने रखें।</p>
      {state === 'idle' || state === 'err' ? (
        <button type="button" onClick={start} className="min-h-12 w-full rounded-lg bg-[#c8102e] px-5 font-extrabold text-white sm:w-auto">
          🎬 पूरे डिज़ाइन के साथ वीडियो बनाएं और डाउनलोड करें
        </button>
      ) : state === 'rec' ? (
        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded bg-line">
            <div className="h-full bg-[#c8102e] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm font-semibold">
            {pct}% · {msg}
          </p>
          <button type="button" onClick={() => stop.current()} className="rounded-md border border-line px-3 py-1.5 text-sm font-bold">
            रोकें
          </button>
        </div>
      ) : (
        file && (
          <a href={file.url} download={file.name} className="inline-block rounded-lg bg-india-600 px-5 py-3 font-extrabold text-white">
            ⬇ फिर से सेव करें ({file.name})
          </a>
        )
      )}
      {state === 'err' && <p className="rounded bg-alert-600/10 p-2 text-sm font-semibold text-alert-700">{msg}</p>}
      <canvas ref={preview} className={`w-full rounded ring-1 ring-line ${state === 'idle' ? 'hidden' : ''}`} />
    </div>
  )
}
