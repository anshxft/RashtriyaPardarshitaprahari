'use client'

import { useState, type ReactNode } from 'react'

/** Footer column: a tap-to-open section on phones, always open on larger screens. */
export function FooterSection({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-t border-white/10 pt-3 md:border-0 md:pt-0 ${className}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left font-bold text-gold-300 md:pointer-events-none md:mb-3">
        {title}
        <span aria-hidden className={`text-sm transition-transform md:hidden ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <div className={`${open ? 'anim-fade mt-3 block' : 'hidden'} md:block`}>{children}</div>
    </div>
  )
}
