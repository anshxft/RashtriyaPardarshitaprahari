import Image from 'next/image'
import Link from 'next/link'
import { TIERS } from '@/collections/TeamMembers'
import { TeamFilters } from '@/components/TeamFilters'
import { tierLabel } from '@/components/TeamCard'
import { stateLabel } from '@/content/states'
import { currentUser } from '@/lib/auth'
import { asMedia, db } from '@/lib/data'
import type { TeamMember } from '@/payload-types'

export const metadata = { title: 'हमारी टीम' }
const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))].sort((a, b) => a.localeCompare(b, 'hi'))

export default async function DeskTeam({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = (await currentUser())!
  const sp = await searchParams
  const v = { q: (sp.q || '').trim().slice(0, 80), state: sp.state || '', district: sp.district || '', bureau: sp.bureau || '', tier: sp.tier || '' }
  // All profiles including drafts (Editors/Admins only; the collection's access rule enforces it).
  const res = await (await db()).find({ collection: 'team-members', locale: 'hi', limit: 2000, depth: 1, draft: true, overrideAccess: false, user, pagination: false, sort: 'name' })
  const all = res.docs as TeamMember[]
  const rank = (t?: string | null) => Math.max(0, TIERS.findIndex((x) => x.value === t))
  const inState = all.filter((m) => !v.state || m.state === v.state)
  const inDistrict = inState.filter((m) => !v.district || m.district === v.district)
  const q = v.q.toLowerCase()
  const shown = all
    .filter((m) => (!v.state || m.state === v.state) && (!v.district || m.district === v.district) && (!v.bureau || m.bureau === v.bureau) && (!v.tier || m.tier === v.tier) && (!q || [m.name, m.designation, m.idNumber, m.district, m.bureau].some((x) => x?.toLowerCase().includes(q))))
    .sort((a, b) => rank(a.tier) - rank(b.tier) || (a.order ?? 100) - (b.order ?? 100))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">👥 हमारी टीम ({all.length})</h1>
        <Link href="/desk/team/new" className="min-h-12 rounded-lg bg-india-600 px-5 py-3 font-extrabold text-white">➕ नया सदस्य</Link>
      </div>
      <TeamFilters
        base="/desk/team"
        values={v}
        options={{
          states: uniq(all.map((m) => m.state)).map((s) => ({ value: s, label: stateLabel(s, 'hi') })),
          districts: uniq(inState.map((m) => m.district)).map((s) => ({ value: s, label: s })),
          bureaus: uniq(inDistrict.map((m) => m.bureau)).map((s) => ({ value: s, label: s })),
          tiers: TIERS.map((x) => ({ value: x.value, label: x.hi })),
        }}
        labels={{ all: 'सभी', state: 'राज्य', district: 'ज़िला', bureau: 'ब्यूरो', designation: 'पद', search: 'नाम / आईडी खोजें', apply: 'फ़िल्टर', reset: 'रीसेट' }}
      />
      <p className="text-sm text-muted">{shown.length} प्रोफ़ाइल</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => {
          const p = asMedia(m.photo)
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-navy-900 text-center leading-[3.5rem] font-bold text-gold-300">
                {p?.url ? <Image src={p.sizes?.thumb?.url || p.url} alt="" fill sizes="56px" className="object-cover" /> : m.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{m.name}</p>
                <p className="truncate text-sm text-saffron-600">{m.designation}</p>
                <p className="truncate text-xs text-muted">{[tierLabel(m.tier, 'hi'), m.district, stateLabel(m.state, 'hi')].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m._status === 'published' ? 'bg-india-600 text-white' : 'bg-slate-200 text-slate-800'}`}>{m._status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}</span>
                <Link href={`/desk/team/${m.id}`} className="rounded-full border border-line px-3 py-1 text-sm font-semibold hover:bg-surface">✎ बदलें</Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
