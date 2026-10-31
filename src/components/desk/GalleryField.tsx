/* eslint-disable @next/next/no-img-element */
'use client'

import { useRef } from 'react'
import { uploadPhotoAction } from '@/app/(desk)/desk/actions'
import { exportJpeg, loadBitmap } from '@/lib/image'

export type GalleryItem = { id: number | null; url: string | null; caption: string; key?: string; busy?: boolean; error?: string }

const chip = 'rounded-md border border-line bg-bg px-2.5 py-1 text-xs font-bold hover:bg-surface disabled:opacity-40'
let seq = 0

/**
 * “और फोटो”: pick many photos at once from phone or laptop. Each is shrunk in the browser and uploaded on its own,
 * so one slow or failed photo never blocks the rest. Order, captions and removal are editable.
 */
export function GalleryField({ items, onChange, alt }: { items: GalleryItem[]; onChange: (fn: (prev: GalleryItem[]) => GalleryItem[]) => void; alt: string }) {
  const input = useRef<HTMLInputElement>(null)
  const patch = (key: string, p: Partial<GalleryItem>) => onChange((prev) => prev.map((g) => (g.key === key ? { ...g, ...p } : g)))

  async function add(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const fresh = list.map((f) => ({ id: null, url: URL.createObjectURL(f), caption: '', key: `g${Date.now()}-${seq++}`, busy: true }))
    onChange((prev) => [...prev, ...fresh])
    await Promise.all(
      list.map(async (file, i) => {
        const key = fresh[i].key
        try {
          const bmp = await loadBitmap(file)
          const blob = await exportJpeg(bmp)
          bmp.close()
          const fd = new FormData()
          fd.set('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
          fd.set('alt', alt || 'फोटो')
          fd.set('credit', '')
          const r = await uploadPhotoAction(fd)
          patch(key, r.ok ? { id: r.id, busy: false } : { busy: false, error: r.error })
        } catch {
          patch(key, { busy: false, error: 'फोटो पढ़ी नहीं जा सकी' })
        }
      }),
    )
    if (input.current) input.current.value = ''
  }

  const move = (i: number, d: -1 | 1) =>
    onChange((prev) => {
      const next = [...prev]
      const j = i + d
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">और फोटो (गैलरी) {items.length > 0 && <span className="text-muted">· {items.length}</span>}</p>
        <button type="button" onClick={() => input.current?.click()} className="min-h-10 rounded-lg bg-navy-900 px-4 text-sm font-bold text-white">
          + एक साथ कई फोटो चुनें
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-line p-4 text-center text-sm text-muted">मुख्य फोटो के अलावा जितनी चाहें फोटो जोड़ें — खबर के नीचे गैलरी में दिखेंगी।</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((g, i) => (
            <li key={g.key || g.id || i} className="overflow-hidden rounded-lg border border-line bg-bg">
              <div className="relative aspect-[4/3] bg-surface">
                {g.url && <img src={g.url} alt="" className="h-full w-full object-cover" />}
                {g.busy && <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white">अपलोड हो रहा है…</span>}
                {g.error && <span className="absolute inset-x-0 bottom-0 bg-alert-600 px-1 py-0.5 text-[11px] font-bold text-white">{g.error}</span>}
              </div>
              <input value={g.caption} onChange={(e) => onChange((prev) => prev.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))} placeholder="कैप्शन (वैकल्पिक)" maxLength={160} className="w-full border-t border-line bg-bg px-2 py-1.5 text-xs" />
              <div className="flex gap-1 border-t border-line p-1.5">
                <button type="button" className={chip} disabled={i === 0} onClick={() => move(i, -1)} aria-label="पहले">◀</button>
                <button type="button" className={chip} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="बाद में">▶</button>
                <button type="button" className={`${chip} ml-auto text-alert-700`} onClick={() => onChange((prev) => prev.filter((_, k) => k !== i))}>
                  हटाएं
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
