import Link from 'next/link'
import { notFound } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { formatDate } from '@/lib/i18n'
import { versionLabel } from '@/lib/newsStatus'
import { allowed, loadPermissions } from '@/lib/permissions'
import { ACTION_HI } from '../../../audit/labels'

export const metadata = { title: 'संस्करण इतिहास' }

/** Version history of one story: every publish / edit / re-publish with version number, time, editor and changed fields. */
export default async function History({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = (await currentUser())!
  const payload = await db()
  await loadPermissions(payload)
  if (!allowed(user, 'versionHistory')) return <p className="rounded-xl bg-bg p-6 text-center">संस्करण इतिहास देखने का अधिकार आपकी भूमिका में नहीं है।</p>
  const a = await payload.findByID({ collection: 'articles', id, depth: 0, draft: true, locale: 'hi' }).catch(() => null)
  if (!a) notFound()
  const [log, versions] = await Promise.all([
    payload.find({ collection: 'audit-log', where: { articleId: { equals: a.id } }, sort: '-createdAt', limit: 200, depth: 0, overrideAccess: true }),
    payload.findVersions({ collection: 'articles', where: { parent: { equals: a.id } }, sort: '-updatedAt', limit: 1, depth: 0 }),
  ])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-extrabold text-navy-900">🕘 संस्करण इतिहास</h1>
        <Link href={`/desk/news/${a.id}`} className="ml-auto rounded-full border border-line px-4 py-2 text-sm font-bold">✎ संपादित करें</Link>
      </div>
      <div className="rounded-xl bg-bg p-4">
        <p className="font-semibold">{a.title}</p>
        <p className="mt-1 text-sm text-muted">
          {a.newsId || 'अभी प्रकाशित नहीं'} · वर्तमान संस्करण {a.firstPublishedAt ? versionLabel(a.versionMinor) : '—'} · कुल सहेजे गए संस्करण: {versions.totalDocs}
        </p>
        <p className="mt-2 text-sm">
          हर संस्करण का पूरा पाठ और पुरानी फोटो/वीडियो{' '}
          <a className="font-semibold text-link underline" href={`/admin/collections/articles/${a.id}/versions`} target="_blank">
            एडमिन → Versions
          </a>{' '}
          में सुरक्षित है (वहां दो संस्करणों की तुलना भी कर सकते हैं)। कोई भी संस्करण कभी मिटाया नहीं जाता।
        </p>
      </div>
      {log.docs.length === 0 ? (
        <p className="rounded-xl bg-bg p-6 text-center text-muted">अभी कोई रिकॉर्ड नहीं।</p>
      ) : (
        <ol className="space-y-2">
          {log.docs.map((e) => (
            <li key={e.id} className="rounded-xl border border-line bg-bg p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-white">{ACTION_HI[e.action] || e.action}</span>
                {e.version && <span className="font-mono text-xs">v{e.version}</span>}
                <span className="ml-auto text-xs text-muted">{formatDate(e.createdAt, 'hi', true)}</span>
              </div>
              <p className="mt-1">
                {e.userName} {e.role && <span className="text-muted">({e.role})</span>}
                {e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus && (
                  <span className="text-muted">
                    {' '}
                    · {e.fromStatus} → {e.toStatus}
                  </span>
                )}
              </p>
              {e.changedFields && <p className="text-xs text-muted">बदले गए हिस्से: {e.changedFields}</p>}
              {e.reason && <p className="text-xs text-alert-700">कारण: {e.reason}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
