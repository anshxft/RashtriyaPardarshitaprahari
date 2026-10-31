import Link from 'next/link'
import { InboxList, type InboxRow } from '@/components/desk/InboxList'
import { appointmentFields, contactFields, submissionFields, type FormField } from '@/content/forms'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import type { InboxKind } from './actions'

export const metadata = { title: 'पाठकों के संदेश' }
export const dynamic = 'force-dynamic'

const TABS: { kind: InboxKind; label: string; fields: FormField[]; statuses: [string, string][] }[] = [
  { kind: 'submissions', label: 'जनता की शिकायत / खबर', fields: submissionFields, statuses: [['new', 'नया'], ['verifying', 'जाँच चल रही'], ['story-in-progress', 'खबर बन रही'], ['published', 'खबर छपी'], ['closed', 'बंद'], ['spam', 'स्पैम']] },
  { kind: 'contact-messages', label: 'संपर्क संदेश', fields: contactFields, statuses: [['new', 'नया'], ['replied', 'जवाब दिया'], ['closed', 'बंद'], ['spam', 'स्पैम']] },
  { kind: 'appointments', label: 'मुलाकात अनुरोध', fields: appointmentFields, statuses: [['new', 'नया'], ['confirmed', 'पक्का'], ['rescheduled', 'समय बदला'], ['declined', 'मना किया'], ['done', 'हो गई']] },
]

/** Desk → पाठकों के संदेश: everything readers send through the website forms, with status and an internal note. */
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = (await currentUser())!
  const want = (await searchParams).tab
  const tab = TABS.find((t) => t.kind === want) || TABS[0]
  const role = (user as { role?: string }).role
  if (role === 'reporter') return <p className="rounded-xl border border-line p-6 text-center text-muted">पाठकों के संदेश केवल संपादक / एडमिन देख सकते हैं।</p>
  const payload = await db()
  const counts = await Promise.all(TABS.map((t) => payload.count({ collection: t.kind, where: { status: { equals: 'new' } }, user, overrideAccess: false }).then((r) => r.totalDocs).catch(() => 0)))
  const res = await payload.find({ collection: tab.kind, sort: '-createdAt', limit: 100, depth: 0, user, overrideAccess: false })
  const rows: InboxRow[] = res.docs.map((d) => {
    const doc = d as unknown as Record<string, unknown>
    const anon = Boolean(doc.anonymous)
    return {
      id: d.id as number,
      ref: (doc.referenceId as string) || '',
      createdAt: d.createdAt as string,
      status: (doc.status as string) || 'new',
      note: (doc.internalNotes as string) || '',
      anonymous: anon,
      files: Array.isArray(doc.files) ? doc.files.length : 0,
      fields: tab.fields
        .map((f) => {
          const raw = doc[f.name]
          const v = raw == null ? '' : String(raw)
          return { label: f.label.hi, value: f.options?.find((o) => o.value === v)?.hi || v, long: f.type === 'textarea' }
        })
        .filter((f) => f.value),
    }
  })
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">पाठकों के संदेश</h1>
        <p className="text-sm text-muted">वेबसाइट के फॉर्म से आई शिकायतें, खबरें, संदेश और मुलाकात के अनुरोध — यहीं पढ़ें और स्थिति बदलें।</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <Link key={t.kind} href={`/desk/inbox?tab=${t.kind}`} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${t.kind === tab.kind ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-bg hover:bg-surface'}`}>
            {t.label}
            {counts[i] > 0 && <span className="ml-1.5 rounded-full bg-alert-600 px-1.5 text-xs text-white">{counts[i]} नए</span>}
          </Link>
        ))}
      </div>
      <InboxList kind={tab.kind} rows={rows} statuses={tab.statuses} />
    </div>
  )
}
