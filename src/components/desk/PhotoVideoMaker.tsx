/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'

const W = 1280
const H = 720
const INTRO = 0.6 // seconds before the voice starts
const OUTRO = 1.2 // seconds after the voice ends
const XFADE = 0.5 // cross-fade between photos
const FLASH = 0.3 // white flash as each photo comes in

type Voice = 'female' | 'male' | 'none'
const chip = 'min-h-11 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50'

/** Draw `img` to cover / fit the box, zoomed by `z` and nudged by (dx, dy) (fractions of the spare room). */
function draw(ctx: CanvasRenderingContext2D, img: ImageBitmap, mode: 'cover' | 'contain', z: number, dx = 0, dy = 0) {
  const r = img.width / img.height
  let w = mode === 'cover' ? Math.max(W, H * r) : Math.min(W, H * r)
  let h = w / r
  if (mode === 'contain' && h > H) (h = H), (w = h * r)
  w *= z
  h *= z
  ctx.drawImage(img, (W - w) / 2 + dx * Math.abs(W - w) * 0.5, (H - h) / 2 + dy * Math.abs(H - h) * 0.5, w, h)
}

/** One photo with a soft blurred copy behind it (no black bars) and a slow zoom. */
function scene(ctx: CanvasRenderingContext2D, img: ImageBitmap, local: number, i: number) {
  ctx.save()
  if ('filter' in ctx) ctx.filter = 'blur(28px) brightness(0.55)'
  draw(ctx, img, 'cover', 1.15)
  ctx.restore()
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, W, H)
  const dir = i % 2 ? -1 : 1
  draw(ctx, img, 'contain', 1 + 0.08 * local, dir * 0.15 * local, 0)
}

/**
 * Desk: make a video news from photos. The photos come in one after another with a white flash and a slow zoom; the
 * written script is read out by the chosen voice (female / male) in the same video. The result is an ordinary video
 * file, handed to the normal upload — so the website player and the downloaded video add the same headline bands,
 * logo, ads and ticker on top of it.
 */
export function PhotoVideoMaker({ defaultScript, onMade }: { defaultScript: string; onMade: (file: File, script: string) => void }) {
  const [files, setFiles] = useState<{ file: File; url: string }[]>([])
  const [script, setScript] = useState(defaultScript)
  const [voice, setVoice] = useState<Voice>('female')
  const [per, setPer] = useState(4)
  const [state, setState] = useState<'idle' | 'busy' | 'err'>('idle')
  const [msg, setMsg] = useState('')
  const [pct, setPct] = useState(0)
  const pick = useRef<HTMLInputElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files])

  function add(list: FileList | null) {
    const imgs = [...(list || [])].filter((f) => f.type.startsWith('image/'))
    setFiles((x) => [...x, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 30))
  }
  const move = (i: number, d: number) =>
    setFiles((x) => {
      const j = i + d
      if (j < 0 || j >= x.length) return x
      const y = [...x]
      ;[y[i], y[j]] = [y[j], y[i]]
      return y
    })

  async function make() {
    setState('busy')
    setPct(0)
    setMsg('तैयारी…')
    let ac: AudioContext | null = null
    try {
      const text = script.trim()
      // 1 · the voice (made on the server from exactly this text)
      let mp3: ArrayBuffer | null = null
      if (voice !== 'none') {
        if (!text) throw new Error('बोलने के लिए खबर का लिखा हुआ विवरण डालें')
        setMsg('आवाज़ बन रही है…')
        const r = await fetch('/api/desk/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ script: text, gender: voice, raw: true }) })
        if (r.status === 501) throw new Error('आवाज़ बनाने की सेवा (TTS) अभी चालू नहीं है। “बिना आवाज़” चुनकर वीडियो बना सकते हैं, या एडमिन से आवाज़ सेवा चालू कराएं।')
        if (!r.ok) throw new Error(`आवाज़ नहीं बनी: ${(await r.json().catch(() => ({}))).error || r.status}`)
        mp3 = await r.arrayBuffer()
      }
      setMsg('फोटो खुल रही हैं…')
      const imgs = await Promise.all(files.map((f) => createImageBitmap(f.file)))

      ac = new AudioContext()
      const dest = ac.createMediaStreamDestination()
      const buf = mp3 ? await ac.decodeAudioData(mp3) : null
      const total = Math.max(imgs.length * (buf ? 2.5 : per), buf ? INTRO + buf.duration + OUTRO : 0)
      const seg = total / imgs.length

      const cv = canvas.current!
      cv.width = W
      cv.height = H
      const ctx = cv.getContext('2d')!
      const stream = cv.captureStream(30)
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
      const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || ''
      const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 5_000_000, audioBitsPerSecond: 128_000 })
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      const done = new Promise<void>((res) => (rec.onstop = () => res()))

      const frame = (t: number) => {
        const i = Math.min(imgs.length - 1, Math.floor(t / seg))
        const local = Math.min(1, (t - i * seg) / seg)
        scene(ctx, imgs[i], local, i)
        // cross-fade into the next photo
        const left = (i + 1) * seg - t
        if (i < imgs.length - 1 && left < XFADE) {
          ctx.save()
          ctx.globalAlpha = 1 - left / XFADE
          scene(ctx, imgs[i + 1], 0, i + 1)
          ctx.restore()
        }
        // white flash as each photo comes in
        const since = t - i * seg
        if (since < FLASH) {
          ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - since / FLASH)})`
          ctx.fillRect(0, 0, W, H)
        }
        // fade to black at the very end
        if (total - t < 0.4) {
          ctx.fillStyle = `rgba(0,0,0,${1 - (total - t) / 0.4})`
          ctx.fillRect(0, 0, W, H)
        }
      }

      await ac.resume()
      frame(0)
      rec.start(1000)
      const t0 = ac.currentTime + 0.05
      if (buf) {
        const src = ac.createBufferSource()
        src.buffer = buf
        src.connect(dest)
        src.connect(ac.destination) // heard while it is made
        src.start(t0 + INTRO)
      }
      setMsg('वीडियो बन रहा है — यह टैब खुला और सामने रखें')
      await new Promise<void>((res) => {
        const tick = () => {
          const t = ac!.currentTime - t0
          if (t >= total) return res()
          frame(Math.max(0, t))
          setPct(Math.min(99, Math.round((t / total) * 100)))
          requestAnimationFrame(tick)
        }
        tick()
      })
      rec.stop()
      await done
      imgs.forEach((b) => b.close())
      const type = rec.mimeType || mime || 'video/webm'
      const ext = type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([new Blob(chunks, { type })], `photo-video-${Date.now()}.${ext}`, { type: type.split(';')[0] })
      setPct(100)
      setState('idle')
      setMsg('')
      onMade(file, text)
    } catch (e) {
      setMsg((e as Error).message || 'वीडियो नहीं बन पाया')
      setState('err')
    } finally {
      ac?.close().catch(() => {})
    }
  }

  const busy = state === 'busy'
  return (
    <div className="space-y-3">
      <input ref={pick} type="file" accept="image/*" multiple className="hidden" onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <div key={f.url} className="relative w-24">
            <img src={f.url} alt="" className="aspect-video w-24 rounded object-cover ring-1 ring-line" />
            <span className="absolute top-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] font-bold text-white">{i + 1}</span>
            <div className="mt-0.5 flex justify-between text-xs">
              <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="पहले" className="px-1 disabled:opacity-30">
                ◀
              </button>
              <button type="button" disabled={busy} onClick={() => setFiles((x) => x.filter((_, k) => k !== i))} aria-label="हटाएं" className="px-1 font-bold text-alert-700">
                ✕
              </button>
              <button type="button" disabled={busy || i === files.length - 1} onClick={() => move(i, 1)} aria-label="बाद में" className="px-1 disabled:opacity-30">
                ▶
              </button>
            </div>
          </div>
        ))}
        <button type="button" disabled={busy} onClick={() => pick.current?.click()} className="flex aspect-video w-24 items-center justify-center rounded border-2 border-dashed border-line text-sm font-bold text-muted hover:bg-surface">
          + फोटो
        </button>
      </div>
      <label className="block">
        <span className="text-sm font-semibold">बोली जाने वाली खबर (लिखा हुआ विवरण)</span>
        <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={4} maxLength={1200} disabled={busy} className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 text-base" placeholder="संक्षेप में खबर लिखें — आवाज़ ठीक यही पढ़ेगी, कुछ जोड़ा नहीं जाएगा।" />
        <span className="text-xs text-muted">आवाज़ सिर्फ यही लिखा हुआ पढ़ती है। किसी व्यक्ति का बयान इसमें न लिखें (बयान वाली खबर के लिए असली वीडियो डालें)। {script.length}/1200</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['female', 'महिला आवाज़'],
            ['male', 'पुरुष आवाज़'],
            ['none', 'बिना आवाज़'],
          ] as [Voice, string][]
        ).map(([k, l]) => (
          <button key={k} type="button" disabled={busy} onClick={() => setVoice(k)} className={`${chip} ${voice === k ? 'border-navy-900 bg-navy-900 text-white hover:bg-navy-900' : ''}`}>
            {l}
          </button>
        ))}
        {voice === 'none' && (
          <label className="flex items-center gap-2 text-sm">
            हर फोटो
            <select value={per} onChange={(e) => setPer(Number(e.target.value))} disabled={busy} className="rounded border border-line bg-bg px-2 py-1">
              {[3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} सेकंड
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {voice !== 'none' && <p className="text-xs text-muted">आवाज़ जितनी लंबी होगी, वीडियो उतना लंबा बनेगा; फोटो बराबर समय के लिए बारी-बारी आएंगी।</p>}
      <button type="button" disabled={busy || !files.length} onClick={make} className="min-h-12 w-full rounded-lg bg-[#c8102e] px-5 font-extrabold text-white disabled:opacity-50 sm:w-auto">
        {busy ? `बन रहा है… ${pct}%` : '🎬 फोटो से वीडियो बनाएं'}
      </button>
      {msg && <p className={`rounded p-2 text-sm font-semibold ${state === 'err' ? 'bg-alert-600/10 text-alert-700' : 'bg-surface'}`}>{msg}</p>}
      <canvas ref={canvas} className={`w-full rounded ring-1 ring-line ${busy ? '' : 'hidden'}`} />
    </div>
  )
}
