'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/i18n'

type NavCat = { slug: string; title: string; group?: string | null; children: { slug: string; title: string }[] }
type Groups = { key: string; label: string; items: NavCat[] }[]

/** Swaps the /hi or /en prefix of the current URL. */
export function LangSwitch({ lang }: { lang: Lang }) {
  const path = usePathname() || `/${lang}`
  const target = lang === 'hi' ? 'en' : 'hi'
  const href = path.replace(/^\/(hi|en)(?=\/|$)/, `/${target}`)
  return (
    <Link href={href} hrefLang={target} lang={target} className="rounded border border-white/30 px-2 py-0.5 text-sm font-semibold hover:bg-white/10">
      {target === 'en' ? 'English' : 'हिन्दी'}
    </Link>
  )
}

export function ThemeToggle({ label }: { label: string }) {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle('dark')
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {}
  }
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="rounded px-2 py-0.5 hover:bg-white/10">
      <span aria-hidden>◐</span>
    </button>
  )
}

/** Desktop: primary links + "All sections" mega-menu. Mobile: drawer. Same data. */
export function Nav({ lang, primary, groups, labels }: { lang: Lang; primary: NavCat[]; groups: Groups; labels: { all: string; menu: string; close: string; home: string } }) {
  const [mega, setMega] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const path = usePathname()
  const megaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMega(false)
    setDrawer(false)
  }, [path])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (setMega(false), setDrawer(false))
    const onClick = (e: MouseEvent) => megaRef.current && !megaRef.current.contains(e.target as Node) && setMega(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
  }, [drawer])

  const href = (slug: string) => `/${lang}/section/${slug}`
  const active = (slug: string) => path?.startsWith(href(slug))

  return (
    <div ref={megaRef} className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex items-center gap-2 px-3 py-3 font-semibold lg:hidden"
          aria-expanded={drawer}
          aria-controls="nav-drawer"
        >
          <span aria-hidden className="text-xl leading-none">☰</span> {labels.menu}
        </button>
        <ul className="hidden min-w-0 flex-1 items-center overflow-hidden lg:flex">
          <li>
            <Link href={`/${lang}`} className="block px-3 py-3 font-semibold whitespace-nowrap hover:text-gold-300">
              {labels.home}
            </Link>
          </li>
          {primary.map((c) => (
            <li key={c.slug} className="group relative">
              <Link
                href={href(c.slug)}
                aria-current={active(c.slug) ? 'page' : undefined}
                className="block px-3 py-3 font-semibold whitespace-nowrap hover:text-gold-300 aria-[current=page]:text-gold-300"
              >
                {c.title}
                {c.children.length > 0 && <span aria-hidden className="ml-1 text-xs">▾</span>}
              </Link>
              {c.children.length > 0 && (
                <ul className="invisible absolute top-full left-0 z-50 min-w-56 rounded-b-md border-t-2 border-gold-400 bg-navy-900 py-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {c.children.map((k) => (
                    <li key={k.slug}>
                      <Link href={href(k.slug)} className="block px-4 py-2 text-sm hover:bg-navy-800 hover:text-gold-300">
                        {k.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={(e) => (e.stopPropagation(), setMega((m) => !m))}
          aria-expanded={mega}
          aria-controls="mega-menu"
          className="ml-auto hidden items-center gap-1 rounded bg-gold-400 px-3 py-1.5 text-sm font-bold whitespace-nowrap text-navy-950 hover:bg-gold-300 lg:flex"
        >
          {labels.all} <span aria-hidden>{mega ? '▴' : '▾'}</span>
        </button>
      </div>

      {mega && (
        <div id="mega-menu" className="absolute inset-x-0 top-full z-50 hidden rounded-b-lg border-t-2 border-gold-400 bg-navy-950 p-6 shadow-2xl lg:grid lg:grid-cols-4 lg:gap-6">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-2 border-b border-white/15 pb-1 text-sm font-bold tracking-wide text-gold-300 uppercase">{g.label}</p>
              <ul className="space-y-1">
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link href={href(c.slug)} className="font-semibold hover:text-gold-300">
                      {c.title}
                    </Link>
                    {c.children.length > 0 && (
                      <ul className="mt-0.5 mb-1 ml-3 border-l border-white/15 pl-3">
                        {c.children.map((k) => (
                          <li key={k.slug}>
                            <Link href={href(k.slug)} className="text-sm text-white/80 hover:text-gold-300">
                              {k.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label={labels.menu}>
          <button type="button" aria-label={labels.close} className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <nav id="nav-drawer" className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-navy-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 p-4">
              <span className="font-display text-lg font-bold text-gold-300">{labels.menu}</span>
              <button type="button" onClick={() => setDrawer(false)} className="rounded px-3 py-1 text-2xl leading-none hover:bg-white/10" aria-label={labels.close}>
                ×
              </button>
            </div>
            <div className="p-4">
              <Link href={`/${lang}`} className="block py-2 font-semibold">
                {labels.home}
              </Link>
              {groups.map((g) => (
                <details key={g.key} open className="border-t border-white/10 py-2">
                  <summary className="cursor-pointer py-1 text-sm font-bold tracking-wide text-gold-300 uppercase">{g.label}</summary>
                  <ul>
                    {g.items.map((c) => (
                      <li key={c.slug}>
                        <Link href={href(c.slug)} className="block py-1.5 font-semibold">
                          {c.title}
                        </Link>
                        {c.children.map((k) => (
                          <Link key={k.slug} href={href(k.slug)} className="block py-1 pl-4 text-sm text-white/80">
                            – {k.title}
                          </Link>
                        ))}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}

export function ShareButtons({ url, title, labels }: { url: string; title: string; labels: { share: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const txt = encodeURIComponent(title)
  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${txt}%20${u}`, cls: 'bg-[#0a7c4a] text-white' },
    { name: 'X', href: `https://x.com/intent/post?url=${u}&text=${txt}`, cls: 'bg-black text-white' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, cls: 'bg-[#1558c0] text-white' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${txt}`, cls: 'bg-[#1a6fa3] text-white' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={labels.share}>
      <span className="text-sm font-semibold text-muted">{labels.share}:</span>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={`rounded px-3 py-1 text-sm font-semibold ${l.cls}`}>
          {l.name}
        </a>
      ))}
      <button
        type="button"
        className="rounded border border-line px-3 py-1 text-sm font-semibold hover:bg-surface"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
          } catch {}
        }}
      >
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  )
}
