import sharp from 'sharp'

/** Where the video sits inside an L-shaped ad frame, as fractions of the frame (0–1). */
export type FrameWindow = { x: number; y: number; w: number; h: number }

/**
 * Finds the blank “window” of a TV-style L-band ad: the largest connected white, transparent or black area. A normal ad
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
    // white / transparent (most frames) — or plain black, which some designers use for the video area
    blank[i] = a < 40 || (r > 228 && g > 228 && b > 228 && Math.max(r, g, b) - Math.min(r, g, b) < 22) ? 1 : r < 22 && g < 22 && b < 22 ? 2 : 0
  }
  const seen = new Uint8Array(w * h)
  let best: { n: number; x0: number; y0: number; x1: number; y1: number; kind: number } | null = null
  const stack: number[] = []
  for (let s = 0; s < w * h; s++) {
    if (!blank[s] || seen[s]) continue
    const kind = blank[s]
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
        if (q >= 0 && blank[q] === kind && !seen[q]) {
          seen[q] = 1
          stack.push(q)
        }
      }
    }
    if (!best || n > best.n) best = { n, x0, y0, x1, y1, kind }
  }
  if (!best) return null
  const bw = best.x1 - best.x0 + 1
  const bh = best.y1 - best.y0 + 1
  // Must be a big, nearly solid rectangle (≥ 25% of the ad, ≥ 85% filled) — otherwise it is just white in a normal ad.
  if (best.n < w * h * 0.25 || best.n < bw * bh * 0.85) return null
  // trim edges that are only partly blank (rounded corners of the band) so the video never overlaps the artwork
  const fill = (x0: number, y0: number, x1: number, y1: number) => {
    let n = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (blank[y * w + x] === best!.kind) n++
    return n / ((x1 - x0 + 1) * (y1 - y0 + 1))
  }
  let { x0, y0, x1, y1 } = best
  for (let k = 0; k < 4 * Math.max(w, h); k++) {
    const sides = [fill(x0, y0, x1, y0), fill(x0, y1, x1, y1), fill(x0, y0, x0, y1), fill(x1, y0, x1, y1)]
    const worst = Math.min(...sides)
    if (worst >= 0.97 || x1 - x0 < 10 || y1 - y0 < 10) break
    const i = sides.indexOf(worst)
    if (i === 0) y0++
    else if (i === 1) y1--
    else if (i === 2) x0++
    else x1--
  }
  return { x: x0 / w, y: y0 / h, w: (x1 - x0 + 1) / w, h: (y1 - y0 + 1) / h }
}
