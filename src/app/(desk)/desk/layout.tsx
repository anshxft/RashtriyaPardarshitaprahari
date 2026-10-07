import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { DeskNav, LogoutButton } from '@/components/desk/DeskNav'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ROLE = { admin: 'प्रधान संपादक / एडमिन', senior: 'वरिष्ठ संपादक', editor: 'संपादक', reporter: 'रिपोर्टर' } as const

export default async function DeskLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/admin/login?redirect=/desk')
  const role = (user as { role?: keyof typeof ROLE }).role || 'reporter'
  return (
    <div className="pb-24 md:pb-8">
      <header className="sticky top-0 z-30 bg-navy-900 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <Link href="/desk" className="flex items-center gap-2">
            <Image src="/emblem.png" alt="" width={36} height={36} className="rounded-full" />
            <span className="font-display text-lg font-extrabold text-gold-300">प्रहरी डेस्क</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <DeskNav />
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">
              {user.name} <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs">{ROLE[role]}</span>
            </span>
            <Link href="/hi" target="_blank" className="hidden rounded px-2 py-1 hover:bg-white/10 sm:inline">वेबसाइट ↗</Link>
            {role !== 'reporter' && <Link href="/admin" className="rounded px-2 py-1 hover:bg-white/10">एडमिन</Link>}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg text-center text-xs md:hidden" aria-label="डेस्क मेनू">
        <DeskNav bottom />
      </nav>
    </div>
  )
}
