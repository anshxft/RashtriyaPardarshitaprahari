import type { Metadata } from 'next'
import { TIERS } from '@/collections/TeamMembers'
import { TeamCard } from '@/components/TeamCard'
import { TeamFilters } from '@/components/TeamFilters'
import { stateLabel } from '@/content/states'
import { getTeam } from '@/lib/data'
import { assertLang, t } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const dynamic = 'force-dynamic' // filters come from the query string

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).team }
}

const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))].sort((a, b) => a.localeCompare(b, 'hi'))

export default async function TeamPage({ params, searchParams }: Props) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  const sp = await searchParams
  const v = { q: (sp.q || '').trim().slice(0, 80), state: sp.state || '', district: sp.district || '', bureau: sp.bureau || '', tier: sp.tier || '' }
  const all = await getTeam(lang)

  // Each level only offers values that exist under the level above it.
  const inState = all.filter((m) => !v.state || m.state === v.state)
  const inDistrict = inState.filter((m) => !v.district || m.district === v.district)
  const options = {
    states: uniq(all.map((m) => m.state)).map((s) => ({ value: s, label: stateLabel(s, lang) })),
    districts: uniq(inState.map((m) => m.district)).map((s) => ({ value: s, label: s })),
    bureaus: uniq(inDistrict.map((m) => m.bureau)).map((s) => ({ value: s, label: s })),
    tiers: TIERS.filter((x) => all.some((m) => m.tier === x.value)).map((x) => ({ value: x.value, label: x[lang] })),
  }
  const q = v.q.toLowerCase()
  const shown = all.filter(
    (m) =>
      (!v.state || m.state === v.state) &&
      (!v.district || m.district === v.district) &&
      (!v.bureau || m.bureau === v.bureau) &&
      (!v.tier || m.tier === v.tier) &&
      (!q || [m.name, m.designation, m.idNumber, m.workArea].some((x) => x?.toLowerCase().includes(q))),
  )

  return (
    <div>
      <header className="mb-6 border-b-4 border-gold-400 pb-4">
        <h1 className="font-display text-3xl font-extrabold text-navy-900 md:text-4xl dark:text-gold-300">{d.team}</h1>
        <p className="mt-2 text-lg text-muted">{d.teamIntro}</p>
      </header>
      <TeamFilters
        base={paths.team(lang)}
        values={v}
        options={options}
        labels={{ all: d.filterAll, state: d.filterState, district: d.filterDistrict, bureau: d.filterBureau, designation: d.filterDesignation, search: d.filterSearch, apply: d.filterApply, reset: d.filterReset }}
      />
      <p className="mb-4 text-sm text-muted">
        {shown.length} {d.membersFound}
      </p>
      {shown.length === 0 ? (
        <p className="py-12 text-center text-muted">{d.noResults}</p>
      ) : (
        TIERS.map((tier) => {
          const list = shown.filter((m) => m.tier === tier.value)
          if (!list.length) return null
          return (
            <section key={tier.value} className="mb-10">
              <h2 className="mb-4 border-b-2 border-line pb-2 font-display text-2xl font-bold text-navy-900 dark:text-gold-300">{tier[lang]}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <TeamCard key={m.id} m={m} lang={lang} featured={tier.value === 'editor-in-chief'} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
