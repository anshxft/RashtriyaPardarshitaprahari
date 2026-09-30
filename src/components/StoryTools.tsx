'use client'

import Link from 'next/link'
import { useRef, useState, type ReactNode } from 'react'

type Labels = { print: string; image: string; share: string; busy: string; fail: string; copied: string }

const btn = 'rounded-md border border-line bg-bg px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-60'

/**
 * Per-story actions: Print/PDF (opens the printable page), download a share image (rendered in the browser from
 * the hidden `children` card, which carries the QR + News ID), and a share link. Works the same on laptop and phone.
 */
export function StoryTools({ title, shortUrl, printHref, fileName, labels, children }: { title: string; shortUrl: string; printHref: string; fileName: string; labels: Labels; children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  async function image() {
    if (!card.current) return
    setBusy(true)
    setNote('')
    try {
      const { toBlob } = await import('html-to-image')
      const opts = { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true }
      await toBlob(card.current, opts) // warm-up: fonts/images are only inlined on the first pass
      const blob = await toBlob(card.current, opts)
      if (!blob) throw new Error('empty')
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' })
      const touch = /Android|iPhone|iPad/i.test(navigator.userAgent)
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, url: shortUrl })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setNote(labels.fail)
    } finally {
      setBusy(false)
    }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: shortUrl })
      else {
        await navigator.clipboard.writeText(shortUrl)
        setNote(labels.copied)
      }
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={printHref} target="_blank" className={btn}>
        🖨 {labels.print}
      </Link>
      <button type="button" onClick={image} disabled={busy} className={btn}>
        🖼 {busy ? labels.busy : labels.image}
      </button>
      <button type="button" onClick={share} className={btn}>
        🔗 {labels.share}
      </button>
      {note && (
        <span role="status" className="text-sm text-muted">
          {note}
        </span>
      )}
      {/* Off-screen capture target */}
      <div aria-hidden style={{ position: 'fixed', left: -12000, top: 0, width: 1080, height: 1350, pointerEvents: 'none' }}>
        <div ref={card}>{children}</div>
      </div>
    </div>
  )
}
