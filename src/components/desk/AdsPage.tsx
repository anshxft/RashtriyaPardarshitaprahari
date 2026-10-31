import { AdsManager, type AdRow } from '@/components/desk/AdsManager'
import { asMedia, db } from '@/lib/data'
import { currentUser } from '@/lib/auth'

export async function AdsPage({ mode }: { mode: 'web' | 'epaper' }) {
  const user = (await currentUser())!
  const payload = await db()
  const [list, settings] = await Promise.all([
    payload.find({ collection: 'ads', sort: '-updatedAt', limit: 100, depth: 1, user, overrideAccess: false }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }) as Promise<{ adsEnabled?: boolean }>,
  ])
  const mine = (p: string[]) => (mode === 'epaper' ? p.includes('epaper') : p.some((x) => x !== 'epaper'))
  const rows: AdRow[] = list.docs.filter((a) => mine((a.placements || []) as string[])).map((a) => {
    const m = asMedia(a.image)
    return {
      id: a.id,
      title: a.title,
      imageId: m?.id ?? null,
      imageUrl: m?.sizes?.card?.url || m?.url || null,
      link: a.link || '',
      placements: ((a.placements || []) as string[]).filter((p) => (mode === 'epaper' ? p === 'epaper' : p !== 'epaper')),
      active: Boolean(a.active),
      startsAt: a.startsAt || '',
      endsAt: a.endsAt || '',
    }
  })
  return <AdsManager rows={rows} adsEnabled={Boolean(settings.adsEnabled)} mode={mode} />
}
