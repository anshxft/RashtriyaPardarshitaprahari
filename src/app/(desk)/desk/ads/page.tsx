import { AdsManager, type AdRow } from '@/components/desk/AdsManager'
import { asMedia, db } from '@/lib/data'
import { currentUser } from '@/lib/auth'

export const metadata = { title: 'विज्ञापन' }
export const dynamic = 'force-dynamic'

export default async function DeskAds() {
  const user = (await currentUser())!
  const payload = await db()
  const [list, settings] = await Promise.all([
    payload.find({ collection: 'ads', sort: '-updatedAt', limit: 100, depth: 1, user, overrideAccess: false }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }) as Promise<{ adsEnabled?: boolean }>,
  ])
  const rows: AdRow[] = list.docs.map((a) => {
    const m = asMedia(a.image)
    return {
      id: a.id,
      title: a.title,
      imageId: m?.id ?? null,
      imageUrl: m?.sizes?.card?.url || m?.url || null,
      link: a.link || '',
      placements: (a.placements || []) as string[],
      active: Boolean(a.active),
      startsAt: a.startsAt || '',
      endsAt: a.endsAt || '',
    }
  })
  return <AdsManager rows={rows} adsEnabled={Boolean(settings.adsEnabled)} />
}
