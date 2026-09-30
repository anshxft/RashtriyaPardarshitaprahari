/** Browser-side photo helpers: decode (respecting phone rotation), crop, shrink, re-encode as JPEG. */
export type Crop = { sx: number; sy: number; sw: number; sh: number }

export const loadBitmap = (file: Blob) => createImageBitmap(file, { imageOrientation: 'from-image' })

/** Largest crop rectangle of a given aspect ratio (w/h) that fits the image; `zoom` ≥ 1 shrinks it; centre in source px. */
export function cropRect(bmp: { width: number; height: number }, aspect: number | null, zoom: number, cx: number, cy: number): Crop {
  const a = aspect ?? bmp.width / bmp.height
  let w = bmp.width
  let h = w / a
  if (h > bmp.height) {
    h = bmp.height
    w = h * a
  }
  w /= zoom
  h /= zoom
  const sx = Math.min(bmp.width - w, Math.max(0, cx - w / 2))
  const sy = Math.min(bmp.height - h, Math.max(0, cy - h / 2))
  return { sx, sy, sw: w, sh: h }
}

/** Crop + shrink to `maxEdge` px and encode as JPEG (a phone photo of 6 MB becomes roughly 0.3–1 MB). */
export async function exportJpeg(bmp: ImageBitmap, crop: Crop = { sx: 0, sy: 0, sw: bmp.width, sh: bmp.height }, maxEdge = 2000, quality = 0.86): Promise<Blob> {
  const k = Math.min(1, maxEdge / Math.max(crop.sw, crop.sh))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(crop.sw * k))
  c.height = Math.max(1, Math.round(crop.sh * k))
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff' // transparent PNGs become white instead of black
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', quality))
}
