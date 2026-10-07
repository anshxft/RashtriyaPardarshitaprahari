import { mobile10, telLink, waLink, type Office } from '@/lib/contact'
import type { Lang } from '@/lib/i18n'

const L = {
  hi: { helpline: 'हेल्पलाइन (24x7)', call: 'कॉल करें', wa: 'व्हाट्सएप्प' },
  en: { helpline: 'Helpline (24x7)', call: 'Call', wa: 'WhatsApp' },
}

/** Offices with call / WhatsApp links. `footer` = compact text for the dark footer; `cards` = the Contact page. */
export function Offices({ offices, lang, waText, variant }: { offices: Office[]; lang: Lang; waText?: string | null; variant: 'footer' | 'cards' }) {
  const l = L[lang]
  const list = offices.filter((o) => o.title)
  if (!list.length) return null
  if (variant === 'footer')
    return (
      <div className="space-y-3 text-sm">
        {list.map((o, i) => (
          <div key={i}>
            <p className="font-semibold text-gold-300">{o.title}</p>
            {o.address && <p className="whitespace-pre-line text-white/80">{o.address}</p>}
            <Numbers o={o} lang={lang} waText={waText} dark />
          </div>
        ))}
      </div>
    )
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {list.map((o, i) => (
        <section key={i} className="flex flex-col rounded-lg border border-line bg-bg p-4">
          <h2 className="font-display text-lg font-bold text-navy-900 dark:text-gold-300">{o.title}</h2>
          {o.address && <p className="mt-1 text-sm whitespace-pre-line">{o.address}</p>}
          {o.unit && <p className="mt-1 text-xs text-muted">{o.unit}</p>}
          <p className="mt-3 text-xs font-semibold text-muted">{l.helpline}</p>
          <Numbers o={o} lang={lang} waText={waText} />
        </section>
      ))}
    </div>
  )
}

function Numbers({ o, lang, waText, dark }: { o: Office; lang: Lang; waText?: string | null; dark?: boolean }) {
  const l = L[lang]
  const btn = dark ? 'rounded border border-white/25 px-2 py-1 hover:bg-white/10' : 'rounded-md px-3 py-2 font-semibold'
  return (
    <ul className="mt-1 space-y-1.5">
      {(o.phones || []).map((p, i) => {
        const n = mobile10(p.number)
        if (!n) return null
        const kind = p.kind || 'both'
        return (
          <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold tabular-nums">{n}</span>
            {kind !== 'call' && (
              <a href={waLink(n, waText)} target="_blank" rel="noopener noreferrer" className={`${btn} ${dark ? '' : 'bg-[#1f9d55] text-white hover:bg-[#178246]'}`}>
                {l.wa}
              </a>
            )}
            {kind !== 'whatsapp' && (
              <a href={telLink(n)} className={`${btn} ${dark ? '' : 'border border-line hover:bg-surface'}`}>
                📞 {l.call}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
