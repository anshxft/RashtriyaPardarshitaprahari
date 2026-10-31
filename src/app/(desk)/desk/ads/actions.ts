'use server'

import { revalidatePath } from 'next/cache'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'

export type AdMode = 'web' | 'epaper'
const WEB = ['home-top', 'article', 'video']
export type AdInput = { id?: number; title: string; imageId: number | null; link: string; placements: string[]; active: boolean; startsAt: string; endsAt: string }
type Res = { ok: true; id?: number } | { ok: false; error: string }
const PLACES = ['epaper', 'home-top', 'article', 'video']

async function who() {
  const user = await currentUser()
  if (!user) throw new Error('लॉगिन ज़रूरी है')
  return { user, payload: await db() }
}
const fail = (e: unknown): Res => ({ ok: false, error: (e as Error).message?.includes('not allowed') || (e as Error).name === 'Forbidden' ? 'यह बदलाव करने का अधिकार आपके पास नहीं है (विज्ञापन: एडिटर/एडमिन, चालू-बंद स्विच: केवल एडमिन)' : (e as Error).message || 'कुछ गड़बड़ हुई' })
const refresh = () => revalidatePath('/', 'layout')

/** Create or edit an ad. Access rules of the Ads collection apply (editors and admins). */
export async function saveAdAction(input: AdInput, mode: AdMode = 'web'): Promise<Res> {
  try {
    const { user, payload } = await who()
    const title = input.title.trim().slice(0, 120)
    if (!title) return { ok: false, error: 'विज्ञापन का नाम लिखें' }
    if (!input.imageId) return { ok: false, error: 'विज्ञापन की फोटो डालें' }
    // Each Desk section manages only its own places; whatever the ad already has in the other section is kept.
    const mine = mode === 'epaper' ? ['epaper'] : input.placements.filter((p) => WEB.includes(p))
    if (!mine.length) return { ok: false, error: 'कम से कम एक जगह चुनें' }
    const before = input.id ? (((await payload.findByID({ collection: 'ads', id: input.id, depth: 0, user, overrideAccess: false })) as { placements?: string[] }).placements || []) : []
    const keep = before.filter((p) => (mode === 'epaper' ? p !== 'epaper' : !WEB.includes(p)))
    const placements = [...new Set([...keep, ...mine])].filter((p) => PLACES.includes(p))
    const link = input.link.trim()
    if (link && !/^https?:\/\//.test(link)) return { ok: false, error: 'लिंक https:// से शुरू होना चाहिए' }
    const data = {
      title,
      image: input.imageId,
      link: link || null,
      placements,
      active: input.active,
      startsAt: input.startsAt ? new Date(input.startsAt).toISOString() : null,
      endsAt: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    }
    const doc = input.id
      ? await payload.update({ collection: 'ads', id: input.id, data: data as never, user, overrideAccess: false })
      : await payload.create({ collection: 'ads', data: data as never, user, overrideAccess: false })
    refresh()
    return { ok: true, id: doc.id as number }
  } catch (e) {
    return fail(e)
  }
}

export async function setAdActiveAction(id: number, active: boolean): Promise<Res> {
  try {
    const { user, payload } = await who()
    await payload.update({ collection: 'ads', id, data: { active } as never, user, overrideAccess: false })
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function deleteAdAction(id: number, mode: AdMode = 'web'): Promise<Res> {
  try {
    const { user, payload } = await who()
    // An ad that also runs in the other section is only removed from this one.
    const doc = (await payload.findByID({ collection: 'ads', id, depth: 0, user, overrideAccess: false })) as { placements?: string[] }
    const rest = (doc.placements || []).filter((p) => (mode === 'epaper' ? p !== 'epaper' : !WEB.includes(p)))
    if (rest.length) await payload.update({ collection: 'ads', id, data: { placements: rest } as never, user, overrideAccess: false })
    else await payload.delete({ collection: 'ads', id, user, overrideAccess: false })
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

/** The site-wide switch (Site Settings → ads on/off). */
export async function setAdsEnabledAction(on: boolean): Promise<Res> {
  try {
    const { user, payload } = await who()
    await payload.updateGlobal({ slug: 'site-settings', data: { adsEnabled: on } as never, user, overrideAccess: false })
    refresh()
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}
