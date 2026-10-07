'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { allowed } from '@/lib/permissions'
import type { PlatformId } from '@/lib/share'
import { retryShare, shareArticle, shareEpaper, shareItem } from '@/lib/shareService'
import type { Article } from '@/payload-types'

type Social = { headline: string; description: string; hashtags: string }

async function guard() {
  const user = await currentUser()
  if (!user) throw new Error('लॉगिन ज़रूरी है')
  if (!allowed(user, 'share')) throw new Error('सोशल शेयर का अधिकार आपकी भूमिका में नहीं है')
  return user
}

/** Saves the edited social version on the master record (no new news version) and posts to the ticked platforms. */
export async function shareNowAction(id: number, platforms: PlatformId[], social: Social) {
  try {
    const user = await guard()
    const payload = await db()
    const a = (await payload.findByID({ collection: 'articles', id, depth: 0, draft: true })) as Article
    if (a._status !== 'published' || !a.newsId) return { ok: false as const, error: 'पहले खबर प्रकाशित करें (News ID बनने के बाद ही शेयर)' }
    await payload.update({ collection: 'articles', id, data: { social, _status: a._status } as never, overrideAccess: true, context: { skipAudit: true } })
    const fresh = (await payload.findByID({ collection: 'articles', id, depth: 1, locale: 'hi' })) as Article
    const results = await shareArticle(id, platforms, user, { item: await shareItem(fresh), headers: await headers() })
    revalidatePath(`/desk/news/${id}/share`)
    return { ok: true as const, results }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function shareEpaperAction(date: string, platforms: PlatformId[], social: Social) {
  try {
    const user = await guard()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false as const, error: 'bad date' }
    const { epaperItem } = await import('@/lib/shareService')
    const item = { ...(await epaperItem(date)), ...social }
    return { ok: true as const, results: await shareEpaper(date, platforms, user, item, await headers()) }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function saveSocialAction(id: number, social: Social) {
  try {
    await guard()
    const payload = await db()
    const a = await payload.findByID({ collection: 'articles', id, depth: 0, draft: true })
    await payload.update({ collection: 'articles', id, data: { social, _status: a._status } as never, draft: a._status !== 'published', overrideAccess: true, context: { skipAudit: true } })
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function retryShareAction(logId: number) {
  try {
    const user = await guard()
    const r = await retryShare(logId, user)
    revalidatePath('/desk/share-log')
    return r
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}
