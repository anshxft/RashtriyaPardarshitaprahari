'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { pack, type EpStory, type PackedPage } from '@/lib/epaper'
import type { Lang } from '@/lib/i18n'
import { StoryBlock } from './StoryBlock'

/** Wait until the newspaper fonts have really loaded, so measurements match what is drawn. */
async function fontsReady() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;font-family:var(--font-noto),sans-serif;font-size:13px'
  probe.innerHTML = '<span>नमूना पाठ ऑनलाइन</span><b style="font-family:var(--font-mukta),sans-serif;font-weight:800">शीर्षक</b>'
  document.body.appendChild(probe)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  await document.fonts.ready
  probe.remove()
}

/**
 * Packs stories onto A3 pages using the browser's real text layout: each story is rendered off-screen at its block
 * width, measured, and placed by the pure packer in lib/epaper. Re-runs whenever the stories change.
 */
export function usePack(stories: EpStory[], lang: Lang) {
  const [ready, setReady] = useState(false)
  const [pages, setPages] = useState<PackedPage[]>([])

  useEffect(() => {
    fontsReady().then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    // flushSync must not run inside React's own commit/effect phase, so measure from a fresh macrotask.
    const timer = setTimeout(() => {
      const host = document.createElement('div')
      host.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none'
      document.body.appendChild(host)
      const root = createRoot(host)
      const measure = (s: EpStory, v: { cols: number; scale: number; take?: number }) => {
        flushSync(() => root.render(<StoryBlock s={s} cols={v.cols} scale={v.scale} take={v.take} lang={lang} />))
        return (host.firstElementChild as HTMLElement).getBoundingClientRect().height
      }
      try {
        setPages(pack(stories, measure))
      } finally {
        setTimeout(() => {
          root.unmount()
          host.remove()
        }, 0)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [ready, stories, lang])

  return { ready, pages }
}
