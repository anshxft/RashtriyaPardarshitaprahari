import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { mayPublish } from '@/lib/deskData'
import { newsStatus, STATUS_LABEL } from '@/lib/newsStatus'
import { allowed, loadPermissions } from '@/lib/permissions'
import { formatDate } from '@/lib/i18n'
import { paths } from '@/lib/paths'

const ACTIONS = [
  { href: '/desk/news/new', icon: '➕', title: 'नई खबर', hint: 'पेस्ट → ऑटो फॉर्मेट → प्रकाशित', color: 'bg-india-600 text-white' },
  { href: '/desk/link', icon: '🔗', title: 'लिंक न्यूज़', hint: 'दूसरे पोर्टल की खबर का कार्ड', color: 'bg-navy-900 text-white' },
  { href: '/desk/video', icon: '🎬', title: 'वीडियो अपलोड', hint: 'लोगो अपने-आप लगेगा', color: 'bg-saffron-500 text-navy-950' },
  { href: '/desk/breaking', icon: '🔴', title: 'ब्रेकिंग न्यूज़', hint: 'ऊपर की लाल पट्टी', color: 'bg-alert-600 text-white' },
  { href: '/desk/team', icon: '👥', title: 'हमारी टीम', hint: 'प्रोफ़ाइल जोड़ें / बदलें', color: 'bg-gold-400 text-navy-950' },
  { href: '/hi/epaper', icon: '📰', title: 'ई-पेपर', hint: 'आज का A3 अंक', color: 'bg-white text-navy-900 ring-1 ring-line' },
]


export default async function DeskHome() {
  const user = (await currentUser())!
  const payload = await db()
  await loadPermissions(payload)
  const list = await payload.find({
    collection: 'articles',
    sort: '-updatedAt',
    limit: 15,
    depth: 0,
    draft: true,
    overrideAccess: false,
    user,
    locale: 'hi',
    where: { or: [{ lifecycle: { in: ['active', 'archived'] } }, { lifecycle: { exists: false } }] },
    select: { title: true, _status: true, reviewStatus: true, newsId: true, slug: true, updatedAt: true, format: true, lifecycle: true, publishedAt: true, versionMinor: true, revisions: true },
  })
  const failedShares = allowed(user, 'share')
    ? (await payload.find({ collection: 'share-log', where: { and: [{ status: { equals: 'failed' } }, { createdAt: { greater_than: new Date(Date.now() - 7 * 86_400_000).toISOString() } }] }, limit: 1, depth: 0, overrideAccess: true })).totalDocs
    : 0
  const review = mayPublish(user) ? list.docs.filter((a) => a.reviewStatus === 'submitted' && a._status !== 'published') : []

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-navy-900">नमस्ते, {user.name} 👋</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className={`flex min-h-28 flex-col justify-between rounded-xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${a.color}`}>
            <span className="text-3xl leading-none">{a.icon}</span>
            <span>
              <span className="block text-lg leading-tight font-extrabold">{a.title}</span>
              <span className="block text-xs opacity-80">{a.hint}</span>
            </span>
          </Link>
        ))}
      </div>

      {failedShares > 0 && (
        <Link href="/desk/share-log?failed=1" className="block rounded-xl border-2 border-alert-600 bg-alert-600/10 p-3 font-semibold text-alert-700">
          ⚠ पिछले 7 दिनों में {failedShares} सोशल पोस्ट विफल रहीं — देखें और दोबारा कोशिश करें →
        </Link>
      )}

      {review.length > 0 && (
        <section className="rounded-xl border-2 border-saffron-500 bg-bg p-4">
          <h2 className="mb-2 font-display text-lg font-bold">📥 समीक्षा के लिए आई खबरें ({review.length})</h2>
          <ul className="divide-y divide-line">
            {review.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate font-semibold">{a.title}</span>
                <Link href={`/desk/news/${a.id}`} className="shrink-0 rounded-full bg-navy-900 px-4 py-1.5 text-sm font-bold text-white">
                  खोलें
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-line bg-bg p-4">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-bold">हाल की खबरें</h2>
          <Link href="/desk/news" className="ml-auto text-sm font-semibold text-link underline">सभी खबरें / आर्काइव / ट्रैश →</Link>
          {allowed(user, 'auditLog') && <Link href="/desk/audit" className="text-sm font-semibold text-link underline">📜 ऑडिट लॉग</Link>}
          {user.role === 'admin' && <Link href="/admin/globals/permissions" className="text-sm font-semibold text-link underline">🔐 अधिकार (Permissions)</Link>}
        </div>
        {list.docs.length === 0 ? (
          <p className="py-6 text-center text-muted">अभी कोई खबर नहीं। ऊपर “नई खबर” दबाएं।</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.docs.map((a) => {
              const st = STATUS_LABEL[newsStatus(a)]
              const [label, cls] = [st.hi, st.cls]
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
                  <span className="min-w-0 flex-1 basis-56 font-semibold">{a.title}</span>
                  <span className="text-xs text-muted">{formatDate(a.updatedAt, 'hi', true)}</span>
                  <span className="flex gap-1.5 text-sm">
                    <Link href={`/desk/news/${a.id}`} className="rounded-full border border-line px-3 py-1 font-semibold hover:bg-surface">✎ संपादित</Link>
                    {a._status === 'published' && a.slug && (
                      <Link href={paths.article('hi', a.slug)} target="_blank" className="rounded-full border border-line px-3 py-1 hover:bg-surface">
                        देखें ↗
                      </Link>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
