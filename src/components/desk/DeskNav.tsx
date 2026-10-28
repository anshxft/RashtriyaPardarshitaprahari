'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const ITEMS = [
  { href: '/desk', label: 'होम', match: /^\/desk$/ },
  { href: '/desk/news', label: 'खबरें', match: /^\/desk\/news/ },
  { href: '/desk/video', label: 'वीडियो', match: /^\/desk\/video/ },
  { href: '/desk/team', label: 'टीम', match: /^\/desk\/team/ },
  { href: '/hi/epaper', label: 'ई-पेपर', match: /^\/hi\/epaper/ },
]

export function DeskNav({ bottom }: { bottom?: boolean }) {
  const path = usePathname() || ''
  return (
    <>
      {ITEMS.map((i) => {
        const on = i.match.test(path)
        return bottom ? (
          <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-0.5 py-2 ${on ? 'font-bold text-navy-900' : 'text-muted'}`} aria-current={on ? 'page' : undefined}>
            {i.label}
          </Link>
        ) : (
          <Link key={i.href} href={i.href} className={`rounded px-3 py-1.5 text-sm font-semibold hover:bg-white/10 ${on ? 'bg-white/15' : ''}`}>
            {i.label}
          </Link>
        )
      })}
    </>
  )
}

export function LogoutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      className="rounded px-2 py-1 hover:bg-white/10"
      onClick={async () => {
        await fetch('/api/users/logout', { method: 'POST' })
        router.push('/admin/login?redirect=/desk')
      }}
    >
      बाहर
    </button>
  )
}
