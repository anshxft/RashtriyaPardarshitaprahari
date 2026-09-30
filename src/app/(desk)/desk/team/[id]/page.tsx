import { notFound } from 'next/navigation'
import { TeamEditor, type TeamForm } from '@/components/desk/TeamEditor'
import { currentUser } from '@/lib/auth'
import { asMedia, db } from '@/lib/data'
import { mayPublish } from '@/lib/deskData'
import type { TeamMember } from '@/payload-types'

export const metadata = { title: 'प्रोफ़ाइल बदलें' }

export default async function EditMember({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params
  const locale = (await searchParams).lang === 'en' ? 'en' : 'hi'
  const user = (await currentUser())!
  const m = (await (await db()).findByID({ collection: 'team-members', id, locale, fallbackLocale: false, depth: 1, draft: true, overrideAccess: false, user }).catch(() => null)) as TeamMember | null
  if (!m) notFound()
  const p = asMedia(m.photo)
  const form: TeamForm = {
    id: m.id,
    name: m.name || '',
    designation: m.designation || '',
    tier: m.tier || 'reporter',
    workArea: m.workArea || '',
    state: m.state || '',
    district: m.district || '',
    bureau: m.bureau || '',
    idNumber: m.idNumber || '',
    bio: m.bio || '',
    experience: m.experience || '',
    email: m.email || '',
    phone: m.phone || '',
    publishContact: Boolean(m.publishContact),
    order: m.order ?? 100,
    photo: { id: p?.id ?? null, url: p ? p.sizes?.card?.url || p.url || null : null },
    published: m._status === 'published',
  }
  return <TeamEditor key={`${id}-${locale}`} initial={form} locale={locale} mayPublish={mayPublish(user)} />
}
