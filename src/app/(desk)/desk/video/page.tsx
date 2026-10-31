import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { NewsActionBar } from '@/components/desk/NewsActionBar'
import { formatDate } from '@/lib/i18n'
import { buttonsFor, newsStatus, STATUS_LABEL } from '@/lib/newsStatus'
import { loadPermissions } from '@/lib/permissions'
import type { Article } from '@/payload-types'

export const metadata = { title: 'वीडियो' }

const ST: Record<string, [string, string]> = { queued: ['कतार में', 'bg-slate-200'], processing: ['लोगो लग रहा है', 'bg-saffron-500'], ready: ['तैयार', 'bg-india-600 text-white'], failed: ['विफल', 'bg-alert-600 text-white'] }

export default async function DeskVideos() {
  const user = (await currentUser())!
  const payload = await db()
  const list = await payload.find({ collection: 'videos', locale: 'hi', sort: '-createdAt', limit: 30, depth: 0, draft: true, overrideAccess: false, user })
  // Each video's news record carries the action buttons (Preview / Edit / Download / Re-publish / Share / Archive / Delete)
  const m = await loadPermissions(payload)
  const ids = list.docs.map((v) => (typeof v.article === 'object' ? v.article?.id : v.article)).filter((x): x is number => typeof x === 'number')
  const arts = ids.length ? ((await payload.find({ collection: 'articles', where: { id: { in: ids } }, limit: ids.length, depth: 0, draft: true, locale: 'hi' })).docs as Article[]) : []
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">वीडियो</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/desk/news/new" className="min-h-12 rounded-lg border-2 border-navy-900 px-5 py-2.5 font-extrabold text-navy-900">📷 बिना वीडियो — सिर्फ फोटो से खबर</Link>
          <Link href="/desk/video/new" className="min-h-12 rounded-lg bg-saffron-500 px-5 py-3 font-extrabold text-navy-950">नया वीडियो</Link>
        </div>
      </div>
      <ul className="divide-y divide-line rounded-xl border border-line bg-bg">
        {list.docs.length === 0 && <li className="p-8 text-center text-muted">अभी कोई वीडियो नहीं।</li>}
        {list.docs.map((v) => {
          const [label, cls] = ST[v.processing || 'queued'] || ST.queued
          return (
            <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${v._status === 'published' ? 'bg-india-600 text-white' : 'bg-slate-200'}`}>{v._status === 'published' ? 'प्रकाशित' : 'ड्राफ्ट'}</span>
              <span className="min-w-0 flex-1 basis-56 font-semibold">{v.title}</span>
              <span className="text-xs text-muted">{formatDate(v.createdAt, 'hi', true)}</span>
              <Link href={`/desk/video/${v.id}`} className="rounded-full border border-line px-3 py-1 text-sm font-semibold hover:bg-surface">✎ खोलें</Link>
              {(() => {
                const a = arts.find((x) => x.id === (typeof v.article === 'object' ? v.article?.id : v.article))
                if (!a) return null
                const status = newsStatus(a)
                const owner = typeof a.createdBy === 'object' ? a.createdBy?.id : a.createdBy
                return (
                  <div className="basis-full">
                    <NewsActionBar
                      id={a.id}
                      slug={a.slug}
                      title={a.title}
                      buttons={buttonsFor(status, user, owner, { video: true }, m)}
                      info={{ status: STATUS_LABEL[status].hi, firstPublishedAt: a.firstPublishedAt ? formatDate(a.firstPublishedAt, 'hi', true) : '—', lastEditor: a.lastEditedBy || '—', lastUpdate: formatDate(a.updatedAt, 'hi', true), newsId: a.newsId || '', live: status !== 'draft' && status !== 'pending' }}
                    />
                  </div>
                )
              })()}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
