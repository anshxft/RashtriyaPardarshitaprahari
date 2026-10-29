'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { FLASH_DURATIONS, type FlashStatus } from '@/collections/BreakingNews'
import { audit } from '@/lib/audit'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { allowed, loadPermissions } from '@/lib/permissions'
import type { BreakingNew } from '@/payload-types'

export type FlashInput = {
  id?: number
  text: string
  caption: string
  photoId: number | null
  videoId: number | null
  showMedia: 'auto' | 'photo' | 'video' | 'both'
  articleId: number | null
  reporterName: string
  showReporter: boolean
  popup: boolean
  duration: string
  /** 'active' = publish now, 'draft' = save as draft, undefined = keep the current status (instant edit of a live flash). */
  status?: 'active' | 'draft'
}
type Res = { ok: true; id: number } | { ok: false; error: string }

const MAX_LINES = 3
const MAX_CHARS = 300

async function who() {
  const user = await currentUser()
  if (!user) throw new Error('लॉगिन ज़रूरी है')
  const payload = await db()
  await loadPermissions(payload)
  return { user, payload, mayFlash: allowed(user, 'flash') }
}

const expiry = (duration: string, from = Date.now()) => {
  const m = FLASH_DURATIONS.find((d) => d.value === duration)?.minutes
  return m ? new Date(from + m * 60_000).toISOString() : null
}

const refresh = () => revalidatePath('/[lang]', 'layout')

async function topPriority(payload: Awaited<ReturnType<typeof db>>) {
  const r = await payload.find({ collection: 'breaking-news', where: { status: { in: ['active', 'paused'] } }, sort: '-priority', limit: 1, depth: 0, overrideAccess: true })
  return ((r.docs[0] as BreakingNew | undefined)?.priority ?? 0) + 1
}

/**
 * Create or edit a flash. Reporters may only write / fix their own drafts; publishing, editing a live flash and every
 * status change need the “Breaking Flash” right. Editing never creates a second flash: the same document is updated.
 */
export async function saveFlashAction(input: FlashInput): Promise<Res> {
  try {
    const { user, payload, mayFlash } = await who()
    const text = input.text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, MAX_LINES).join('\n')
    if (!text) return { ok: false, error: 'कम से कम एक पंक्ति लिखें' }
    if (text.length > MAX_CHARS) return { ok: false, error: `विवरण ${MAX_CHARS} अक्षरों से छोटा रखें` }
    if (input.status === 'active' && !mayFlash) return { ok: false, error: 'फ्लैश प्रकाशित करने का अधिकार आपके पास नहीं है — ड्राफ्ट सेव करें, संपादक प्रकाशित करेंगे' }

    const old = input.id ? ((await payload.findByID({ collection: 'breaking-news', id: input.id, depth: 0, overrideAccess: true })) as BreakingNew) : null
    if (old && !mayFlash) {
      const own = (typeof old.createdBy === 'object' ? old.createdBy?.id : old.createdBy) === user.id
      if (!own || old.status !== 'draft') return { ok: false, error: 'आप केवल अपना ड्राफ्ट बदल सकते हैं' }
    }

    const status: FlashStatus = input.status || old?.status || 'draft'
    const goingLive = status === 'active' && old?.status !== 'active'
    const data: Record<string, unknown> = {
      text,
      caption: input.caption.trim().slice(0, 160) || null,
      photo: input.photoId,
      video: input.videoId,
      showMedia: input.showMedia,
      article: input.articleId,
      reporterName: input.reporterName.trim().slice(0, 120) || null,
      showReporter: input.showReporter,
      popup: input.popup,
      duration: input.duration,
      status,
    }
    if (goingLive) {
      data.publishedAt = old?.publishedAt || new Date().toISOString()
      data.expiresAt = expiry(input.duration)
      data.priority = await topPriority(payload) // newest flash goes to the top
    } else if (status === 'active' && old && old.duration !== input.duration) {
      data.expiresAt = expiry(input.duration) // running time changed: count again from now
    }

    const doc = old
      ? await payload.update({ collection: 'breaking-news', id: old.id, locale: 'hi', data: data as never, overrideAccess: true })
      : await payload.create({ collection: 'breaking-news', locale: 'hi', data: { ...data, createdBy: user.id } as never, overrideAccess: true })

    const action = goingLive ? 'flash-publish' : old ? (status === 'active' ? 'flash-edit-live' : 'flash-edit') : 'flash-draft'
    await audit(payload, user, { action, collectionSlug: 'breaking-news', title: text.split('\n')[0], toStatus: status, fromStatus: old?.status, details: { flashId: doc.id } }, await headers())
    refresh()
    return { ok: true, id: doc.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'कुछ गड़बड़ हुई' }
  }
}

/** Pause / resume / remove from the flash (the linked full news stays on the website). */
export async function setFlashStatusAction(id: number, status: Exclude<FlashStatus, 'draft'>): Promise<Res> {
  try {
    const { user, payload, mayFlash } = await who()
    if (!mayFlash) return { ok: false, error: 'यह अधिकार केवल संपादक/एडमिन के पास है' }
    const old = (await payload.findByID({ collection: 'breaking-news', id, depth: 0, overrideAccess: true })) as BreakingNew
    const data: Record<string, unknown> = { status }
    if (status === 'active') {
      const expired = old.expiresAt && new Date(old.expiresAt) <= new Date()
      if (!old.publishedAt) data.publishedAt = new Date().toISOString()
      if (expired || !old.publishedAt) data.expiresAt = expiry(old.duration || '6h') // resumed after its time ran out: fresh run
      if (old.status === 'removed' || old.status === 'draft') data.priority = await topPriority(payload)
    }
    await payload.update({ collection: 'breaking-news', id, data: data as never, overrideAccess: true })
    await audit(payload, user, { action: `flash-${status}`, collectionSlug: 'breaking-news', title: (old.text || '').split('\n')[0], fromStatus: old.status, toStatus: status, details: { flashId: id } }, await headers())
    refresh()
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'कुछ गड़बड़ हुई' }
  }
}

/** Change the running order: move one flash up / down / to the top among the running and paused ones. */
export async function moveFlashAction(id: number, to: 'top' | 'up' | 'down'): Promise<Res> {
  try {
    const { payload, mayFlash } = await who()
    if (!mayFlash) return { ok: false, error: 'यह अधिकार केवल संपादक/एडमिन के पास है' }
    const r = await payload.find({ collection: 'breaking-news', where: { status: { in: ['active', 'paused'] } }, sort: ['-priority', '-publishedAt'], limit: 100, depth: 0, overrideAccess: true })
    const docs = r.docs as BreakingNew[]
    const list = docs.map((d) => d.id)
    const i = list.indexOf(id)
    if (i < 0) return { ok: false, error: 'यह फ्लैश चालू/रुकी सूची में नहीं है' }
    const j = to === 'top' ? 0 : to === 'up' ? Math.max(0, i - 1) : Math.min(list.length - 1, i + 1)
    const order = list.filter((x) => x !== id)
    order.splice(j, 0, id)
    // Highest number = first. Only rows whose number changes are written.
    const before = new Map(docs.map((d) => [d.id, d.priority ?? 0]))
    for (const [k, fid] of order.entries()) {
      const p = order.length - k
      if (before.get(fid) !== p) await payload.update({ collection: 'breaking-news', id: fid, data: { priority: p } as never, overrideAccess: true })
    }
    refresh()
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'कुछ गड़बड़ हुई' }
  }
}
