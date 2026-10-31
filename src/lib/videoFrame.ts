import sharp from 'sharp'

/** Where the video sits inside an L-shaped ad frame, as fractions of the frame (0–1). */
export type FrameWindow = { x: number; y: number; w: number; h: number }

/**
 * Finds the blank “window” of a TV-style L-band ad: the largest connected white (or transparent) area. A normal ad
 * (no big blank rectangle) returns null, so it never covers a video.
 */
export async function findFrameWindow(img: Buffer): Promise<FrameWindow | null> {
  const W = 200
  const { data, info } = await sharp(img).resize({ width: W }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const blank = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const [r, g, b, a] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]]
    blank[i] = a < 40 || (r > 228 && g > 228 && b > 228 && Math.max(r, g, b) - Math.min(r, g, b) < 22) ? 1 : 0
  }
  const seen = new Uint8Array(w * h)
  let best: { n: number; x0: number; y0: number; x1: number; y1: number } | null = null
  const stack: number[] = []
  for (let s = 0; s < w * h; s++) {
    if (!blank[s] || seen[s]) continue
    let n = 0
    let [x0, y0, x1, y1] = [w, h, 0, 0]
    stack.push(s)
    seen[s] = 1
    while (stack.length) {
      const p = stack.pop()!
      const x = p % w
      const y = (p - x) / w
      n++
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && blank[q] && !seen[q]) {
          seen[q] = 1
          stack.push(q)
        }
      }
    }
    if (!best || n > best.n) best = { n, x0, y0, x1, y1 }
  }
  if (!best) return null
  const bw = best.x1 - best.x0 + 1
  const bh = best.y1 - best.y0 + 1
  // Must be a big, nearly solid rectangle (≥ 25% of the ad, ≥ 85% filled) — otherwise it is just white in a normal ad.
  if (best.n < w * h * 0.25 || best.n < bw * bh * 0.85) return null
  return { x: best.x0 / w, y: best.y0 / h, w: bw / w, h: bh / h }
}
