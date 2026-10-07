import { SharePanel } from '@/components/desk/SharePanel'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { istDate } from '@/lib/articleHooks'
import { formatDate } from '@/lib/i18n'
import { allowed } from '@/lib/permissions'
import { configured, PLATFORMS } from '@/lib/share'
import { epaperItem } from '@/lib/shareService'

export const metadata = { title: 'ई-पेपर शेयर' }
export const dynamic = 'force-dynamic'

/** Share one e-paper issue (link + top headlines) to the official channels. */
export default async function EpaperShare({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || '') ? sp.date! : istDate(new Date())
  const user = (await currentUser())!
  if (!allowed(user, 'share')) return <p className="rounded-xl bg-bg p-6 text-center">सोशल शेयर का अधिकार आपकी भूमिका में नहीं है।</p>
  const payload = await db()
  const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as { autoShare?: { platforms?: string[] | null } }
  const enabled = new Set(settings.autoShare?.platforms || [])
  const logs = await payload.find({ collection: 'share-log', where: { kind: { equals: 'epaper' } }, sort: '-createdAt', limit: 20, depth: 0, overrideAccess: true })
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="font-display text-xl font-extrabold text-navy-900">📣 ई-पेपर शेयर · {date}</h1>
      <SharePanel
        epaperDate={date}
        item={await epaperItem(date)}
        published
        downloadHref={`/hi/epaper/${date}`}
        rows={PLATFORMS.map((p) => ({ id: p.id, label: p.label, configured: configured(p.id), enabled: enabled.has(p.id) }))}
        logs={logs.docs.map((l) => ({ id: l.id, platform: l.platform, status: l.status, postUrl: l.postUrl, response: l.response, auto: l.auto, at: formatDate(l.createdAt, 'hi', true) }))}
      />
    </div>
  )
}
