import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { formatDate } from '@/lib/i18n'

export const metadata = { title: 'वीडियो' }

const ST: Record<string, [string, string]> = { queued: ['कतार में', 'bg-slate-200'], processing: ['लोगो लग रहा है', 'bg-saffron-500'], ready: ['तैयार', 'bg-india-600 text-white'], failed: ['विफल', 'bg-alert-600 text-white'] }

export default async function DeskVideos() {
  const user = (await currentUser())!
  const list = await (await db()).find({ collection: 'videos', locale: 'hi', sort: '-createdAt', limit: 30, depth: 0, draft: true, overrideAccess: false, user })
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">🎬 वीडियो</h1>
        <Link href="/desk/video/new" className="min-h-12 rounded-lg bg-saffron-500 px-5 py-3 font-extrabold text-navy-950">➕ नया वीडियो</Link>
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
            </li>
          )
        })}
      </ul>
    </div>
  )
}
