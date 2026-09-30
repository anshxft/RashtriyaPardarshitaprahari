import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TeamCard } from '@/components/TeamCard'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { assertLang, t } from '@/lib/i18n'
import type { TeamMember } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Editors see a profile exactly as it will look on the Team page, before publishing. */
export default async function TeamPreview({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const p = await params
  const lang = assertLang(p.lang)
  const user = await currentUser()
  if (!user) notFound()
  const m = await (await db())
    .findByID({ collection: 'team-members', id: p.id, draft: true, locale: lang, depth: 1, overrideAccess: false, user })
    .catch(() => null)
  if (!m) notFound()
  return (
    <div className="mx-auto max-w-2xl">
      <p role="note" className="mb-6 rounded-md border border-dashed border-saffron-600 bg-saffron-500/10 p-3 text-sm font-semibold">
        👁 {t(lang).previewBanner}
      </p>
      <TeamCard m={m as TeamMember} lang={lang} featured />
    </div>
  )
}
