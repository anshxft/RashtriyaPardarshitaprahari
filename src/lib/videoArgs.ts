export type Watermark = { enabled?: boolean | null; position?: string | null; sizePercent?: number | null; opacity?: number | null; marginPercent?: number | null }

const POS: Record<string, string> = { tr: 'W-w-M:M', tl: 'M:M', br: 'W-w-M:H-h-M', bl: 'M:H-h-M' }

/** Pure: displayed video size (after phone rotation) from ffmpeg's stream line, e.g. "Video: h264, yuv420p, 1920x1080 [SAR 1:1 DAR 16:9]". */
export function videoSize(ffmpegInfo: string): { w: number; h: number } | null {
  const m = /Video:[^\n]*?\b(\d{3,5})x(\d{3,5})\b/.exec(ffmpegInfo)
  if (!m) return null
  const rot = Math.abs(Number(/rotat\w*[^\d-]*(-?\d+(?:\.\d+)?)/i.exec(ffmpegInfo)?.[1] ?? 0)) % 180
  return rot === 90 ? { w: +m[2], h: +m[1] } : { w: +m[1], h: +m[2] }
}

/**
 * Pure: the ffmpeg arguments that put the logo on the video (exported so it can be unit-checked).
 * `videoWidth` = displayed width of the source; the logo is sized in real pixels from it, so it never gets distorted.
 */
export function watermarkArgs(input: string, logo: string, output: string, wm: Watermark, videoWidth = 1280): string[] {
  const size = Math.min(30, Math.max(5, wm.sizePercent ?? 14)) / 100
  const alpha = Math.min(100, Math.max(20, wm.opacity ?? 90)) / 100
  const margin = (Math.min(10, Math.max(0, wm.marginPercent ?? 2.5)) / 100).toFixed(4)
  const pos = (POS[wm.position || 'tr'] || POS.tr).replaceAll('M', `${margin}*W`)
  const baseW = Math.min(1920, videoWidth) // the picture is never wider than 1920 px (1080p)
  const logoW = Math.max(24, Math.round((baseW * size) / 2) * 2)
  const graph = [
    `[0:v]scale='min(1920,iw)':-2,setsar=1[b]`, // even dimensions for H.264
    `[1:v]scale=${logoW}:-2,format=rgba,colorchannelmixer=aa=${alpha}[l]`, // logo width = % of the video width, own aspect kept
    `[b][l]overlay=${pos}:format=auto,format=yuv420p[v]`,
  ].join(';')
  return ['-y', '-i', input, '-i', logo, '-filter_complex', graph, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output]
}


export type SocialLayout = {
  W: number
  H: number
  /** source picture size (after rotation); 16:9 is assumed when unknown */
  src?: { w: number; h: number } | null
  durationSec: number
  hasAudio: boolean
  endSec?: number
  /** heights of the rendered PNG overlays */
  lowerH: number
  out: string
}

/**
 * Pure: ffmpeg arguments for the Social-Ready export. Inputs, in order:
 *   0 source video · 1 logo PNG · 2 name-tag PNG · 3 lower-third PNG · 4 end-card PNG (looped) · 5 silent audio
 * Landscape: video fitted into W×H, logo top-right, name tag top-left, lower third at the bottom, then the end card.
 * Vertical: the video sits in the middle band, the lower third right under it.
 */
export function socialArgs(input: string, logo: string, tag: string, lower: string, end: string, L: SocialLayout): string[] {
  const { W, H } = L
  const endSec = L.endSec ?? 4
  const M = Math.round(W * 0.025)
  const logoW = Math.round(W * (W > H ? 0.12 : 0.2) / 2) * 2
  const vertical = H > W
  const src = L.src || { w: 16, h: 9 }
  const vh = vertical ? Math.round((W * src.h) / src.w / 2) * 2 : H
  const vy = vertical ? Math.round((H - vh) / 2 / 2) * 2 : 0
  const lowerY = vertical ? Math.min(H - L.lowerH, vy + vh + M) : H - L.lowerH - M
  const fit = vertical
    ? `scale=${W}:${vh}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:${vy}+(${vh}-ih)/2:color=0x0b1f4d`
    : `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0b1f4d`
  const graph = [
    `[0:v]${fit},setsar=1,fps=30[b]`,
    `[1:v]scale=${logoW}:-2[l]`,
    `[b][l]overlay=W-w-${M}:${M}[b1]`,
    `[b1][2:v]overlay=${M}:${M}[b2]`,
    `[b2][3:v]overlay=0:${lowerY},format=yuv420p[main]`,
    `[4:v]scale=${W}:${H},setsar=1,fps=30,format=yuv420p,trim=duration=${endSec},setpts=PTS-STARTPTS[end]`,
    `[5:a]asplit=2[s1][s2]`,
    L.hasAudio ? `[0:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=${L.durationSec}[a0]` : `[s1]atrim=duration=${L.durationSec}[a0]`,
    `[s2]atrim=duration=${endSec},asetpts=PTS-STARTPTS[a1]`,
    `[main][a0][end][a1]concat=n=2:v=1:a=1[v][a]`,
  ]
  if (L.hasAudio) graph[6] = `[5:a]asplit=2[s1][s2];[s1]anullsink`
  return [
    '-y', '-i', input, '-i', logo, '-i', tag, '-i', lower,
    '-loop', '1', '-t', String(endSec), '-i', end,
    '-f', 'lavfi', '-t', String(L.durationSec + endSec), '-i', 'anullsrc=r=48000:cl=stereo',
    '-filter_complex', graph.join(';'),
    '-map', '[v]', '-map', '[a]', '-t', String(L.durationSec + endSec),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', L.out,
  ]
}

/** Pure: when the Flash strip (and the voice) appear — first at 1 s, then every `intervalSec` while Repeat is ON. */
export function flashTimes(durationSec: number, showSec: number, repeat: boolean, intervalSec: number): number[] {
  const start = Math.min(1, Math.max(0, durationSec - showSec))
  if (!repeat) return [start]
  const every = Math.max(showSec + 2, intervalSec)
  const out: number[] = []
  for (let t = start; t + Math.min(showSec, 3) <= durationSec && out.length < 30; t += every) out.push(Math.round(t * 10) / 10)
  return out.length ? out : [start]
}

/**
 * Pure: ffmpeg arguments for the "Final video with Flash + Voice". Inputs: 0 website version, 1 flash-strip PNG,
 * 2 voice MP3 (optional). The strip sits at the bottom while shown; the voice plays at each appearance and the
 * original sound is lowered underneath it.
 */
export function flashArgs(input: string, strip: string, voice: string | null, out: string, o: { times: number[]; showSec: number; hasAudio: boolean; voiceVolume?: number }): string[] {
  const enable = o.times.map((t) => `between(t,${t},${t + o.showSec})`).join('+')
  const graph = [`[0:v][1:v]overlay=0:H-h:enable='${enable}',format=yuv420p[v]`]
  const n = o.times.length
  if (voice) {
    const vol = Math.max(0.1, Math.min(1, (o.voiceVolume ?? 100) / 100))
    graph.push(`[2:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},asplit=${n}${o.times.map((_, i) => `[s${i}]`).join('')}`)
    o.times.forEach((t, i) => graph.push(`[s${i}]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[d${i}]`))
    const base = o.hasAudio ? '[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.25[o];' : ''
    // amix divides by the number of inputs; multiply back so the voice keeps its loudness (works on old and new ffmpeg).
    const k = n + (o.hasAudio ? 1 : 0)
    graph.push(`${base}${o.hasAudio ? '[o]' : ''}${o.times.map((_, i) => `[d${i}]`).join('')}amix=inputs=${k}:duration=${o.hasAudio ? 'first' : 'longest'}:dropout_transition=0,volume=${k}[a]`)
  }
  const audioMap = voice ? ['-map', '[a]'] : o.hasAudio ? ['-map', '0:a'] : []
  return ['-y', '-i', input, '-i', strip, ...(voice ? ['-i', voice] : []), '-filter_complex', graph.join(';'), '-map', '[v]', ...audioMap, '-shortest', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out]
}
