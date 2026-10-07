import type { Where } from 'payload'
import Link from 'next/link'
import { NewsActionBar } from '@/components/desk/NewsActionBar'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { formatDate } from '@/lib/i18n'
import { buttonsFor, newsStatus, STATUS_LABEL, versionLabel } from '@/lib/newsStatus'
import { loadPermissions } from '@/lib/permissions'
import type { Article } from '@/payload-types'

export const metadata = { title: 'खबरें' }
export const dynamic = 'force-dynamic'

const now = () => new Date().toISOString()
const live: Where = { or: [{ lifecycle: { equals: 'active' } }, { lifecycle: { exists: false } }] }
const TABS: { key: string; label: string; where: () => Where }[] = [
  { key: 'all', label: 'सभी', where: () => ({ or: [{ lifecycle: { in: ['active', 'archived'] } }, { lifecycle: { exists: false } }] }) },
  { key: 'draft', label: 'ड्राफ्ट', where: () => ({ and: [live, { _status: { equals: 'draft' } }, { reviewStatus: { not_equals: 'submitted' } }] }) },
  { key: 'pending', label: 'समीक्षा में', where: () => ({ and: [live, { _status: { equals: 'draft' } }, { reviewStatus: { equals: 'submitted' } }] }) },
  { key: 'scheduled', label: 'शेड्यूल', where: () => ({ and: [live, { _status: { equals: 'published' } }, { publishedAt: { greater_than: now() } }] }) },
  { key: 'published', label: 'प्रकाशित', where: () => ({ and: [live, { _status: { equals: 'published' } }, { publishedAt: { less_than_equal: now() } }] }) },
  { key: 'archived', label: 'आर्काइव', where: () => ({ lifecycle: { equals: 'archived' } }) },
  { key: 'trash', label: 'ट्रैश', where: () => ({ lifecycle: { equals: 'trashed' } }) },
]

export default async function NewsList({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; page?: string }> }) {
  const sp = await searchParams
  const user = (await currentUser())!
  const payload = await db()
  const m = await loadPermissions(payload)
  const tab = TABS.find((t) => t.key === sp.tab) || TABS[0]
  const q = (sp.q || '').trim().slice(0, 80)
  const search: Where | undefined = q ? { or: [{ title: { like: q } }, { newsId: { like: q.toUpperCase() } }] } : undefined
  const where: Where = search ? { and: [tab.where(), search] } : tab.where()
  const [list, counts] = await Promise.all([
    payload.find({
      collection: 'articles',
      where,
      sort: '-updatedAt',
      limit: 20,
      page: Math.max(1, Number(sp.page) || 1),
      depth: 0,
      draft: true,
      locale: 'hi',
      select: { title: true, _status: true, reviewStatus: true, lifecycle: true, publishedAt: true, firstPublishedAt: true, newsId: true, slug: true, updatedAt: true, format: true, createdBy: true, versionMinor: true, revisions: true, lastEditedBy: true, trashReason: true },
    }),
    Promise.all(TABS.map((t) => payload.find({ collection: 'articles', where: t.where(), draft: true, limit: 1, depth: 0, select: { newsId: true } }).then((r) => r.totalDocs))),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">📰 खबरें</h1>
        <Link href="/desk/news/new" className="ml-auto rounded-full bg-india-600 px-5 py-2.5 font-bold text-white shadow">
          ➕ नई खबर
        </Link>
      </div>

      <nav aria-label="स्थिति" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t, i) => (
          <Link
            key={t.key}
            href={`/desk/news?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${t.key === tab.key ? 'bg-navy-900 text-white' : 'border border-line bg-bg'}`}
            aria-current={t.key === tab.key ? 'page' : undefined}
          >
            {t.label} <span className="opacity-70">({counts[i]})</span>
          </Link>
        ))}
      </nav>

      <form className="flex gap-2">
        <input type="hidden" name="tab" value={tab.key} />
        <input name="q" defaultValue={q} placeholder="हेडलाइन या News ID खोजें" className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2.5" />
        <button className="rounded-lg bg-navy-900 px-4 font-bold text-white">खोजें</button>
      </form>

      {list.docs.length === 0 ? (
        <p className="rounded-xl bg-bg p-8 text-center text-muted">यहां कोई खबर नहीं।</p>
      ) : (
        <ul className="space-y-3">
          {(list.docs as Article[]).map((a) => {
            const status = newsStatus(a)
            const owner = typeof a.createdBy === 'object' ? a.createdBy?.id : a.createdBy
            const buttons = buttonsFor(status, user, owner, { video: a.format === 'video' }, m)
            return (
              <li key={a.id} className="rounded-xl border border-line bg-bg p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-0.5 font-bold ${STATUS_LABEL[status].cls}`}>{STATUS_LABEL[status].hi}</span>
                  {a.newsId && <span className="font-mono text-muted">{a.newsId}</span>}
                  {a.firstPublishedAt && <span className="text-muted">v{versionLabel(a.versionMinor)}</span>}
                  <span className="ml-auto text-muted">{formatDate(a.updatedAt, 'hi', true)}</span>
                </div>
                <p className="mt-1.5 font-semibold leading-snug">{a.title}</p>
                {status === 'trashed' && a.trashReason && <p className="mt-1 text-xs text-alert-700">कारण: {a.trashReason}</p>}
                <NewsActionBar
                  id={a.id}
                  slug={a.slug}
                  title={a.title}
                  buttons={buttons}
                  info={{
                    status: STATUS_LABEL[status].hi,
                    firstPublishedAt: a.firstPublishedAt ? formatDate(a.firstPublishedAt, 'hi', true) : '—',
                    lastEditor: a.lastEditedBy || '—',
                    lastUpdate: formatDate(a.updatedAt, 'hi', true),
                    newsId: a.newsId || '',
                    live: status !== 'draft' && status !== 'pending',
                  }}
                />
              </li>
            )
          })}
        </ul>
      )}

      {list.totalPages > 1 && (
        <div className="flex justify-center gap-3">
          {list.hasPrevPage && <Link className="rounded-full border border-line px-4 py-2" href={`/desk/news?tab=${tab.key}&page=${list.prevPage}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>← पिछले</Link>}
          <span className="py-2 text-sm text-muted">पृष्ठ {list.page} / {list.totalPages}</span>
          {list.hasNextPage && <Link className="rounded-full border border-line px-4 py-2" href={`/desk/news?tab=${tab.key}&page=${list.nextPage}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>अगले →</Link>}
        </div>
      )}
    </div>
  )
}
