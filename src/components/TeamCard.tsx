import Image from 'next/image'
import { TIERS } from '@/collections/TeamMembers'
import { stateLabel } from '@/content/states'
import { asMedia } from '@/lib/data'
import { t, type Lang } from '@/lib/i18n'
import type { TeamMember } from '@/payload-types'

// First grapheme of the first two words (so Devanagari conjuncts like 'प्र' stay intact).
const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' })
const initials = (name: string) =>
  name
    .replace(/[\[\]()]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...seg.segment(w)][0].segment)
    .join('')

export const tierLabel = (tier: string | null | undefined, lang: Lang) => {
  const x = TIERS.find((r) => r.value === tier)
  return x ? x[lang] : ''
}

export function TeamCard({ m, lang, featured }: { m: TeamMember; lang: Lang; featured?: boolean }) {
  const d = t(lang)
  const photo = asMedia(m.photo)
  const src = photo?.sizes?.card?.url || photo?.url
  const place = [m.bureau, m.district, stateLabel(m.state, lang)].filter(Boolean).join(' · ')
  return (
    <article className={`flex gap-4 rounded-xl border border-line bg-bg p-4 shadow-sm ${featured ? 'md:col-span-2 lg:col-span-3 md:p-6' : ''}`}>
      <div className={`relative shrink-0 overflow-hidden rounded-full bg-navy-900 ${featured ? 'h-28 w-28 md:h-36 md:w-36' : 'h-20 w-20'}`}>
        {src ? (
          <Image src={src} alt={m.name} fill sizes="150px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-gold-300">{initials(m.name)}</span>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className={`font-display leading-tight font-bold text-navy-900 dark:text-gold-300 ${featured ? 'text-2xl' : 'text-lg'}`}>{m.name}</h3>
        <p className="text-sm font-semibold text-saffron-600">{m.designation}</p>
        {m.workArea && <p className="text-sm">{m.workArea}</p>}
        {place && <p className="text-sm text-muted">{place}</p>}
        {m.idNumber && (
          <p className="text-xs text-muted">
            {d.idNumber}: <span className="font-mono">{m.idNumber}</span>
          </p>
        )}
        {m.bio && <p className="line-clamp-3 pt-1 text-sm">{m.bio}</p>}
        {m.experience && <p className="text-xs text-muted">{m.experience}</p>}
        {m.publishContact && (m.email || m.phone) && (
          <p className="pt-1 text-sm">
            {m.email && (
              <a href={`mailto:${m.email}`} className="mr-3 text-link underline">
                {m.email}
              </a>
            )}
            {m.phone && <a href={`tel:${m.phone}`} className="text-link underline">{m.phone}</a>}
          </p>
        )}
      </div>
    </article>
  )
}
