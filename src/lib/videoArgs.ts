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

