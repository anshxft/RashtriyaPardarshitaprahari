'use client'

import { useState } from 'react'
import type { ContactNumber } from '@/lib/contact'

/** Floating click-to-chat button. One number → opens WhatsApp directly; several → the visitor picks an office first. */
export function WhatsAppFloat({ numbers, text, label, choose }: { numbers: ContactNumber[]; text: string; label: string; choose: string }) {
  const [open, setOpen] = useState(false)
  if (!numbers.length) return null
  const href = (n: string) => `https://wa.me/91${n}?text=${encodeURIComponent(text)}`
  const icon = (
    <svg viewBox="0 0 32 32" aria-hidden className="h-7 w-7 fill-current">
      <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6a.6.6 0 0 0 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8 1 3.9.8a3.3 3.3 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.3Z" />
    </svg>
  )
  const cls =
    'anim-pop fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg ring-2 ring-white/70 hover:bg-[#1ebe5b] print:hidden'
  if (numbers.length === 1)
    return (
      <a href={href(numbers[0].number)} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
        {icon}
      </a>
    )
  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={choose}
          className="anim-pop fixed right-4 bottom-20 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-bg shadow-2xl print:hidden"
        >
          <p className="bg-[#075e54] px-4 py-2.5 text-sm font-bold text-white">{choose}</p>
          <ul className="divide-y divide-line">
            {numbers.map((n) => (
              <li key={n.number}>
                <a href={href(n.number)} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 hover:bg-surface" onClick={() => setOpen(false)}>
                  <span className="block text-sm font-semibold">{n.office}</span>
                  <span className="text-xs text-muted tabular-nums">{n.number}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cls}>
        {open ? <span className="text-2xl leading-none">×</span> : icon}
      </button>
    </>
  )
}
