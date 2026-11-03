'use client'

import { useEffect } from 'react'

/**
 * Discourages lifting our reporting: on story pages the text can't be selected or right-clicked, pictures can't be
 * dragged out or right-click-saved, and anything copied anyway carries the source line and link. (Share, copy-link,
 * print and the e-paper's own download buttons keep working — they don't go through text selection.)
 */
export function ContentGuard({ lang }: { lang: 'hi' | 'en' }) {
  useEffect(() => {
    const inStory = (t: EventTarget | null) => t instanceof Element && Boolean(t.closest('#story, #story-body'))
    const isImg = (t: EventTarget | null) => t instanceof HTMLImageElement || (t instanceof Element && t.tagName === 'IMG')
    const allow = (t: EventTarget | null) => t instanceof Element && Boolean(t.closest('input, textarea, [contenteditable="true"], [data-allow-copy]'))
    const menu = (e: MouseEvent) => {
      if (allow(e.target)) return
      if (inStory(e.target) || isImg(e.target)) e.preventDefault()
    }
    const drag = (e: DragEvent) => isImg(e.target) && e.preventDefault()
    const copy = (e: ClipboardEvent) => {
      if (allow(e.target)) return
      const text = window.getSelection()?.toString() || ''
      if (!text.trim()) return
      const src = lang === 'hi' ? 'स्रोत: राष्ट्रीय पारदर्शिता प्रहरी' : 'Source: Rashtriya Pardarshita Prahari'
      // only a short quote leaves the page, always with the source and the link
      const quote = text.length > 300 ? `${text.slice(0, 300)}…` : text
      e.clipboardData?.setData('text/plain', `${quote}\n\n${src} — ${location.href}`)
      e.preventDefault()
    }
    document.addEventListener('contextmenu', menu)
    document.addEventListener('dragstart', drag)
    document.addEventListener('copy', copy)
    return () => {
      document.removeEventListener('contextmenu', menu)
      document.removeEventListener('dragstart', drag)
      document.removeEventListener('copy', copy)
    }
  }, [lang])
  return null
}
