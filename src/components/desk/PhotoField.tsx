/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'
import { uploadPhotoAction } from '@/app/(desk)/desk/actions'
import { cropRect, exportJpeg, loadBitmap } from '@/lib/image'

export type Photo = { id: number | null; url: string | null; busy?: boolean; error?: string }

const chip = 'rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-semibold hover:bg-surface'
const ASPECTS: [string, number | null][] = [['मूल', null], ['16:9', 16 / 9], ['3:2', 3 / 2], ['4:3', 4 / 3], ['1:1', 1]]

/** Upload / replace / delete / crop from laptop or phone. Everything is shrunk in the browser before upload. */
export function PhotoField({ photo, onChange, alt, credit, onCredit }: { photo: Photo; onChange: (p: Photo) => void; alt: string; credit: string; onCredit: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const source = useRef<ImageBitmap | null>(null) // keeps the original so cropping can be redone
  const [crop, setCrop] = useState(false)

  async function send(bmp: ImageBitmap, c?: Parameters<typeof exportJpeg>[1]) {
    onChange({ ...photo, busy: true, error: undefined })
    try {
      const blob = await exportJpeg(bmp, c)
      const local = URL.createObjectURL(blob)
      onChange({ id: photo.id, url: local, busy: true })
      const fd = new FormData()
      fd.set('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      fd.set('alt', alt)
      fd.set('credit', credit)
      const r = await uploadPhotoAction(fd)
      onChange(r.ok ? { id: r.id, url: local } : { id: null, url: null, error: r.error })
    } catch {
      onChange({ id: null, url: null, error: 'फोटो पढ़ी नहीं जा सकी' })
    }
  }

  async function pick(file?: File | null) {
    if (!file) return
    try {
      source.current?.close()
      source.current = await loadBitmap(file)
      await send(source.current)
    } catch {
      onChange({ id: null, url: null, error: 'यह फाइल फोटो नहीं लगती' })
    }
  }

  return (
    <div className="space-y-3">
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      {photo.url ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg bg-surface">
            <img src={photo.url} alt="" className="max-h-64 w-full object-contain" />
            {photo.busy && <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-bold text-white">अपलोड हो रही है…</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip} onClick={() => input.current?.click()}>🔄 बदलें</button>
            {source.current && <button type="button" className={chip} onClick={() => setCrop(true)}>✂ क्रॉप</button>}
            <button type="button" className={`${chip} text-alert-700`} onClick={() => (source.current = null, onChange({ id: null, url: null }))}>🗑 हटाएं</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line bg-bg text-muted hover:bg-surface">
          <span className="text-3xl">📷</span>
          <span className="font-semibold">फोटो जोड़ें (वैकल्पिक)</span>
          <span className="text-xs">फोटो न हो तो पूरा पाठ-आधारित लेआउट बनेगा</span>
        </button>
      )}
      {photo.error && <p className="text-sm font-semibold text-alert-600">{photo.error}</p>}
      <label className="block text-sm font-semibold">
        फोटो क्रेडिट
        <input value={credit} onChange={(e) => onCredit(e.target.value)} placeholder="जैसे: फोटो: राजेश कुमार" className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2 font-normal" />
      </label>
      {crop && source.current && (
        <CropModal
          bmp={source.current}
          onCancel={() => setCrop(false)}
          onDone={(c) => {
            setCrop(false)
            send(source.current!, c)
          }}
        />
      )}
    </div>
  )
}

function CropModal({ bmp, onDone, onCancel }: { bmp: ImageBitmap; onDone: (c: ReturnType<typeof cropRect>) => void; onCancel: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ai, setAi] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: bmp.width / 2, y: bmp.height / 2 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const aspect = ASPECTS[ai][1]
  const rect = cropRect(bmp, aspect, zoom, center.x, center.y)
  const W = 320
  const H = Math.round(W / (rect.sw / rect.sh))

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    c.width = W
    c.height = H
    c.getContext('2d')!.drawImage(bmp, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, W, H)
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3" role="dialog" aria-modal="true" aria-label="क्रॉप">
      <div className="w-full max-w-md space-y-3 rounded-xl bg-bg p-4">
        <p className="font-bold">फोटो क्रॉप — खींचकर स्थिति बदलें</p>
        <canvas
          ref={canvas}
          className="mx-auto max-w-full touch-none rounded bg-surface"
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => ((e.target as HTMLElement).setPointerCapture(e.pointerId), (drag.current = { x: e.clientX, y: e.clientY }))}
          onPointerUp={() => (drag.current = null)}
          onPointerMove={(e) => {
            if (!drag.current) return
            const k = rect.sw / (e.currentTarget.getBoundingClientRect().width || W)
            setCenter((c) => ({ x: c.x - (e.clientX - drag.current!.x) * k, y: c.y - (e.clientY - drag.current!.y) * k }))
            drag.current = { x: e.clientX, y: e.clientY }
          }}
        />
        <div className="flex flex-wrap justify-center gap-2">
          {ASPECTS.map(([label], i) => (
            <button key={label} type="button" onClick={() => setAi(i)} className={`${chip} ${ai === i ? '!bg-navy-900 !text-white' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold">
          ज़ूम
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={chip}>रद्द</button>
          <button type="button" onClick={() => onDone(rect)} className="rounded-full bg-navy-900 px-5 py-1.5 font-bold text-white">✓ लगाएं</button>
        </div>
      </div>
    </div>
  )
}
