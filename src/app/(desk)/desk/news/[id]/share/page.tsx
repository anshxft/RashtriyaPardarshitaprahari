import { notFound } from 'next/navigation'
import { SharePanel } from '@/components/desk/SharePanel'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { formatDate } from '@/lib/i18n'
import { allowed } from '@/lib/permissions'
import { configured, PLATFORMS } from '@/lib/share'
import { shareItem } from '@/lib/shareService'
import type { Article } from '@/payload-types'

export const metadata = { title: 'सोशल शेयर' }
export const dynamic = 'force-dynamic'

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = (await currentUser())!
  if (!allowed(user, 'share')) return <p className="rounded-xl bg-bg p-6 text-center">सोशल शेयर का अधिकार आपकी भूमिका में नहीं है।</p>
  const payload = await db()
  const a = (await payload.findByID({ collection: 'articles', id, depth: 1, draft: true, locale: 'hi' }).catch(() => null)) as Article | null
  if (!a) notFound()
  const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as { autoShare?: { platforms?: string[] | null } }
  const enabled = new Set(settings.autoShare?.platforms || [])
  const logs = await payload.find({ collection: 'share-log', where: { article: { equals: a.id } }, sort: '-createdAt', limit: 30, depth: 0, overrideAccess: true })
  const videoId = typeof a.video === 'object' ? a.video?.id : a.video
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-display text-xl font-extrabold text-navy-900">📣 सोशल शेयर</h1>
      <p className="font-semibold">{a.title}</p>
      <SharePanel
        articleId={a.id}
        item={await shareItem(a)}
        published={a._status === 'published' && Boolean(a.newsId)}
        downloadHref={videoId ? `/api/desk/download?video=${videoId}&kind=social` : `/desk/news/${a.id}/download`}
        rows={PLATFORMS.map((p) => ({ id: p.id, label: p.label, configured: configured(p.id), enabled: enabled.has(p.id) }))}
        logs={logs.docs.map((l) => ({ id: l.id, platform: l.platform, status: l.status, postUrl: l.postUrl, response: l.response, auto: l.auto, at: formatDate(l.createdAt, 'hi', true) }))}
      />
    </div>
  )
}
