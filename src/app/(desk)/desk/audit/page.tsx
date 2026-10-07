import type { Where } from 'payload'
import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { formatDate } from '@/lib/i18n'
import { allowed, loadPermissions } from '@/lib/permissions'
import { ACTION_HI } from './labels'

export const metadata = { title: 'ऑडिट लॉग' }
export const dynamic = 'force-dynamic'

/** Append-only audit log, filterable. Read-only here and in the admin panel: entries can never be edited or deleted. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; from?: string; to?: string; page?: string }> }) {
  const sp = await searchParams
  const user = (await currentUser())!
  const payload = await db()
  await loadPermissions(payload)
  if (!allowed(user, 'auditLog')) return <p className="rounded-xl bg-bg p-6 text-center">ऑडिट लॉग केवल एडमिन / अधिकृत भूमिका देख सकती है।</p>
  const q = (sp.q || '').trim().slice(0, 80)
  const and: Where[] = []
  if (q) and.push({ or: [{ newsId: { like: q } }, { title: { like: q } }, { userName: { like: q } }] })
  if (sp.action && ACTION_HI[sp.action]) and.push({ action: { equals: sp.action } })
  if (sp.from) and.push({ createdAt: { greater_than_equal: new Date(`${sp.from}T00:00:00+05:30`).toISOString() } })
  if (sp.to) and.push({ createdAt: { less_than_equal: new Date(`${sp.to}T23:59:59+05:30`).toISOString() } })
  const page = Math.max(1, Number(sp.page) || 1)
  const log = await payload.find({ collection: 'audit-log', where: and.length ? { and } : undefined, sort: '-createdAt', limit: 50, page, depth: 0, overrideAccess: true })
  const qs = (p: number) => `/desk/audit?${new URLSearchParams({ ...(q && { q }), ...(sp.action && { action: sp.action }), ...(sp.from && { from: sp.from }), ...(sp.to && { to: sp.to }), page: String(p) })}`

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold text-navy-900">📜 ऑडिट लॉग</h1>
      <form className="grid gap-2 rounded-xl bg-bg p-3 sm:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="News ID / हेडलाइन / नाम" className="rounded-lg border border-line px-3 py-2.5 sm:col-span-2" />
        <select name="action" defaultValue={sp.action || ''} className="rounded-lg border border-line px-3 py-2.5">
          <option value="">सभी कार्रवाइयां</option>
          {Object.entries(ACTION_HI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={sp.from} aria-label="से" className="rounded-lg border border-line px-3 py-2.5" />
        <input type="date" name="to" defaultValue={sp.to} aria-label="तक" className="rounded-lg border border-line px-3 py-2.5" />
        <button className="rounded-lg bg-navy-900 py-2.5 font-bold text-white sm:col-span-5">फ़िल्टर</button>
      </form>
      <p className="text-sm text-muted">{log.totalDocs} रिकॉर्ड</p>
      <ul className="space-y-2">
        {log.docs.map((e) => (
          <li key={e.id} className="rounded-xl border border-line bg-bg p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-white">{ACTION_HI[e.action] || e.action}</span>
              {e.newsId && <span className="font-mono text-xs">{e.newsId}</span>}
              {e.version && <span className="font-mono text-xs text-muted">v{e.version}</span>}
              <span className="ml-auto text-xs text-muted">{formatDate(e.createdAt, 'hi', true)}</span>
            </div>
            {e.title && (
              <p className="mt-1 font-semibold">
                {e.articleId ? <Link href={`/desk/news/${e.articleId}/history`}>{e.title}</Link> : e.title}
              </p>
            )}
            <p className="text-xs text-muted">
              {e.userName} {e.role && `(${e.role})`}
              {e.fromStatus && e.toStatus ? ` · ${e.fromStatus} → ${e.toStatus}` : ''}
              {e.ip ? ` · IP ${e.ip}` : ''}
              {e.session ? ` · सत्र ${e.session}` : ''}
            </p>
            {e.changedFields && <p className="text-xs text-muted">बदले गए हिस्से: {e.changedFields}</p>}
            {e.reason && <p className="text-xs text-alert-700">कारण: {e.reason}</p>}
          </li>
        ))}
      </ul>
      <div className="flex justify-center gap-3">
        {log.hasPrevPage && <Link className="rounded-full border border-line px-4 py-2" href={qs(page - 1)}>← पिछले</Link>}
        {log.hasNextPage && <Link className="rounded-full border border-line px-4 py-2" href={qs(page + 1)}>अगले →</Link>}
      </div>
    </div>
  )
}
