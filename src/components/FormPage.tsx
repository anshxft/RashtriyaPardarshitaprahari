import type { ReactNode } from 'react'
import type { FormKind } from '@/app/(frontend)/[lang]/actions'
import type { FormField } from '@/content/forms'
import { officeNumbers, waLink } from '@/lib/contact'
import { getSettings } from '@/lib/data'
import { t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'
import { PublicForm } from './PublicForm'

export async function FormPage({ lang, kind, fields, title, intro, defaults }: { lang: Lang; kind: FormKind; fields: FormField[]; title: string; intro: ReactNode; defaults?: Record<string, string> }) {
  const d = t(lang)
  const s = await getSettings(lang)
  const wa = officeNumbers(s.offices).filter((n) => n.whatsapp)
  const waBox = wa.length > 0 && (
    <div>
      <p className="mb-2 font-semibold">{lang === 'hi' ? 'या सीधे व्हाट्सएप्प पर भेजें' : 'Or send it on WhatsApp'}</p>
      <ul className="space-y-2">
        {wa.map((n) => (
          <li key={n.number}>
            <a
              href={waLink(n.number, s.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-md bg-[#1f9d55] px-3 py-2 font-semibold text-white hover:bg-[#178246]"
            >
              <span>{n.office}</span>
              <span className="text-xs tabular-nums opacity-90">{n.number}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="border-b-4 border-gold-400 pb-4 font-display text-3xl font-extrabold text-navy-900 md:text-4xl dark:text-gold-300">{title}</h1>
        <div className="mt-4 mb-8 text-lg text-muted">{intro}</div>
        {waBox && <div className="-mt-4 mb-8 rounded-xl bg-surface p-4 text-sm lg:hidden">{waBox}</div>}
        <PublicForm kind={kind} fields={fields} lang={lang} d={d} renderedAt={Date.now()} defaults={defaults} privacyHref={paths.page(lang, 'privacy-policy')} />
      </div>
      <aside className="space-y-4 self-start rounded-xl bg-surface p-5 text-sm">
        <p className="font-display text-lg font-bold text-navy-900 dark:text-gold-300">{d.contact}</p>
        {!s.offices?.length && s.address && <p className="whitespace-pre-line">{s.address}</p>}
        {s.email && (
          <p>
            ✉ <a className="text-link underline" href={`mailto:${s.email}`}>{s.email}</a>
          </p>
        )}
        {!s.offices?.length && s.phone && <p>☎ {s.phone}</p>}
        {waBox && <div className="hidden border-t border-line pt-4 lg:block">{waBox}</div>}
        {s.grievanceOfficer?.name && (
          <p>
            <strong>{lang === 'hi' ? 'शिकायत अधिकारी' : 'Grievance officer'}:</strong> {s.grievanceOfficer.name}
            {s.grievanceOfficer.email && <> · {s.grievanceOfficer.email}</>}
          </p>
        )}
        <p className="border-t border-line pt-4 text-muted">
          {lang === 'hi'
            ? 'हम हर सूचना की स्वतंत्र जांच करते हैं। किसी सूचना के प्रकाशन की गारंटी नहीं है। आपकी पहचान गोपनीय रखी जाती है।'
            : 'We independently verify every tip. Publication is not guaranteed. Your identity is kept confidential.'}
        </p>
      </aside>
    </div>
  )
}
