import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { formatDate } from '@/lib/i18n'
import { allowed } from '@/lib/permissions'

export const metadata = { title: 'शेयर लॉग' }
export const dynamic = 'force-dynamic'

/** All share attempts; failures first. Retry from each story's share page. */
export default async function ShareLogPage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const user = (await currentUser())!
  if (!allowed(user, 'share') && !allowed(user, 'auditLog')) return <p className="rounded-xl bg-bg p-6 text-center">अधिकार नहीं।</p>
  const failed = (await searchParams).failed === '1'
  const log = await (await db()).find({ collection: 'share-log', where: failed ? { status: { equals: 'failed' } } : undefined, sort: '-createdAt', limit: 100, depth: 0, overrideAccess: true })
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">🧾 शेयर लॉग</h1>
        <Link href={failed ? '/desk/share-log' : '/desk/share-log?failed=1'} className="ml-auto rounded-full border border-line px-4 py-2 text-sm font-bold">
          {failed ? 'सभी दिखाएं' : 'सिर्फ़ विफल'}
        </Link>
      </div>
      <ul className="space-y-2">
        {log.docs.length === 0 && <li className="rounded-xl bg-bg p-6 text-center text-muted">कोई रिकॉर्ड नहीं।</li>}
        {log.docs.map((l) => {
          const aId = typeof l.article === 'object' ? l.article?.id : l.article
          return (
            <li key={l.id} className="rounded-xl border border-line bg-bg p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${l.status === 'success' ? 'bg-india-600 text-white' : l.status === 'failed' ? 'bg-alert-600 text-white' : 'bg-slate-200'}`}>{l.status}</span>
                <span className="font-semibold">{l.platform}</span>
                {l.newsId && <span className="font-mono text-xs">{l.newsId}</span>}
                <span className="ml-auto text-xs text-muted">{formatDate(l.createdAt, 'hi', true)}</span>
              </div>
              <p className="mt-1">{l.title}</p>
              {l.status === 'failed' && <p className="text-xs text-alert-700">{l.response}</p>}
              {aId && (
                <Link href={`/desk/news/${aId}/share`} className="text-xs font-semibold text-link underline">
                  शेयर पेज / दोबारा कोशिश →
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
