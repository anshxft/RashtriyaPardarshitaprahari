'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { currentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { db } from '@/lib/data'
import { buttonsFor, DELETE_REASONS, newsStatus, type Btn } from '@/lib/newsStatus'
import { loadPermissions } from '@/lib/permissions'
import type { Article } from '@/payload-types'

export type ActionResult = { ok: true; message?: string; id?: number } | { ok: false; error: string }

/**
 * Loads the story and checks — on the server — that this person may use `btn` on it right now. Uses the exact same rules
 * (status × role matrix) that decide which buttons are shown, so a hidden button can never be called directly.
 */
async function guard(id: number, btn: Btn | Btn[]) {
  const user = await currentUser()
  if (!user) throw new Error('लॉगिन ज़रूरी है')
  const payload = await db()
  const m = await loadPermissions(payload)
  const doc = (await payload.findByID({ collection: 'articles', id, depth: 0, draft: true, locale: 'hi' }).catch(() => null)) as Article | null
  if (!doc) throw new Error('खबर नहीं मिली')
  const status = newsStatus(doc)
  const owner = typeof doc.createdBy === 'object' ? doc.createdBy?.id : doc.createdBy
  const { main, more } = buttonsFor(status, user, owner, { video: doc.format === 'video' }, m)
  const wanted = Array.isArray(btn) ? btn : [btn]
  if (!wanted.some((b) => [...main, ...more].includes(b))) throw new Error('यह कार्रवाई आपकी भूमिका में या इस स्थिति में उपलब्ध नहीं है')
  return { user, payload, doc, status }
}

const run = async (fn: () => Promise<ActionResult>): Promise<ActionResult> => {
  try {
    return await fn()
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'कुछ गड़बड़ हुई' }
  }
}

/** Saves lifecycle fields without touching publish state (published stays published, drafts stay drafts). */
async function setLifecycle(g: Awaited<ReturnType<typeof guard>>, data: Record<string, unknown>, auditAction: string, reason?: string) {
  const published = g.doc._status === 'published'
  await g.payload.update({
    collection: 'articles',
    id: g.doc.id,
    data: { ...data, _status: g.doc._status } as never,
    draft: !published,
    overrideAccess: true, // the lifecycle field is locked for the panel/API; this action did its own check above
    user: g.user,
    context: { auditAction, reason },
  })
  revalidatePath('/', 'layout')
}

export async function archiveNews(id: number): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, 'archive')
    await setLifecycle(g, { lifecycle: 'archived', lifecycleBefore: g.status }, 'archive')
    return { ok: true, message: 'खबर आर्काइव हो गई। वेबसाइट की सूचियों से हट गई; URL और News ID सुरक्षित हैं।' }
  })
}

export async function trashNews(id: number, reason: string, other?: string): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, 'delete')
    const live = g.status !== 'draft' && g.status !== 'pending'
    const why = reason === 'Other' ? (other || '').trim() : reason
    if (live && (!DELETE_REASONS.includes(reason as never) || !why)) return { ok: false, error: 'हटाने का कारण चुनना ज़रूरी है' }
    await setLifecycle(g, { lifecycle: 'trashed', lifecycleBefore: g.status, trashedAt: new Date().toISOString(), trashReason: why || 'Draft removed' }, 'delete', why || 'Draft removed')
    return { ok: true, message: 'खबर ट्रैश में चली गई। एडमिन इसे वापस ला सकते हैं।' }
  })
}

export async function restoreFromTrash(id: number): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, 'restoreTrash')
    // A story that had been public comes back as Archived (one more deliberate step to make it live again).
    const back = g.doc.firstPublishedAt ? 'archived' : 'active'
    await setLifecycle(g, { lifecycle: back, trashedAt: null, trashReason: null }, 'restore')
    return { ok: true, message: back === 'archived' ? 'वापस आ गई (आर्काइव में)। “Restore & Publish” से फिर प्रकाशित करें।' : 'ड्राफ्ट वापस आ गया।' }
  })
}

/** Re-publish (merged rule): same News ID + URL; (A) keeps the original date, (B) shows "Updated on". */
export async function republishNews(id: number, mode: 'original' | 'updated'): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, ['republish', 'restorePublish'])
    if (!g.doc.firstPublishedAt) return { ok: false, error: 'यह खबर कभी प्रकाशित नहीं हुई — “प्रकाशित करें” इस्तेमाल करें' }
    await g.payload.update({
      collection: 'articles',
      id,
      data: { lifecycle: 'active', _status: 'published' } as never,
      overrideAccess: true,
      user: g.user,
      context: { auditAction: 'republish', republish: mode },
    })
    revalidatePath('/', 'layout')
    return { ok: true, message: mode === 'original' ? 'मूल प्रकाशन तिथि के साथ फिर प्रकाशित।' : '“Updated” खबर के रूप में फिर प्रकाशित।' }
  })
}

/** Permanent delete: Admin only, story must already be in the Trash, password re-confirmed. The audit entry stays forever. */
export async function purgeNews(id: number, password: string): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, 'purge')
    try {
      await g.payload.login({ collection: 'users', data: { email: g.user.email, password } })
    } catch {
      return { ok: false, error: 'पासवर्ड गलत है' }
    }
    await audit(
      g.payload,
      g.user,
      { action: 'purge', newsId: g.doc.newsId, articleId: g.doc.id, collectionSlug: 'articles', title: g.doc.title, url: g.doc.slug ? `/hi/news/${g.doc.slug}` : undefined, fromStatus: 'trashed', toStatus: 'purged', reason: g.doc.trashReason },
      await headers(),
    )
    await g.payload.delete({ collection: 'articles', id, overrideAccess: true })
    revalidatePath('/', 'layout')
    return { ok: true, message: 'स्थायी रूप से हटा दिया गया। ऑडिट लॉग में रिकॉर्ड सुरक्षित है।' }
  })
}

const COPY_FIELDS = ['title', 'subheadline', 'excerpt', 'content', 'sources', 'format', 'category', 'tags', 'reporterName', 'reporter', 'location', 'heroImage', 'externalImage', 'layout', 'linkCard', 'documents'] as const
const strip = (v: unknown): unknown => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, strip(x)])) : v)

/** Create New From This News: a brand-new draft (new News ID at its own first publish), both languages copied. */
export async function copyNews(id: number): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, 'copy')
    const pick = (d: Record<string, unknown>) => Object.fromEntries(COPY_FIELDS.filter((k) => d[k] != null).map((k) => [k, strip(d[k])]))
    const hi = (await g.payload.findByID({ collection: 'articles', id, depth: 0, draft: true, locale: 'hi', fallbackLocale: false })) as unknown as Record<string, unknown>
    const en = (await g.payload.findByID({ collection: 'articles', id, depth: 0, draft: true, locale: 'en', fallbackLocale: false })) as unknown as Record<string, unknown>
    const created = await g.payload.create({
      collection: 'articles',
      locale: 'hi',
      draft: true,
      user: g.user,
      data: { ...pick(hi), _status: 'draft', reviewStatus: 'draft', publishedAt: new Date().toISOString() } as never,
      context: { auditAction: 'copy', reason: `From ${g.doc.newsId || `#${id}`}` },
    })
    if (en.title) {
      const enText = Object.fromEntries((['title', 'subheadline', 'excerpt', 'content', 'reporterName', 'location'] as const).filter((k) => en[k] != null).map((k) => [k, en[k]]))
      await g.payload.update({ collection: 'articles', id: created.id, locale: 'en', draft: true, data: enText as never, user: g.user, context: { skipAudit: true } })
    }
    return { ok: true, id: created.id, message: 'नई ड्राफ्ट खबर बनी। प्रकाशित होने पर इसे नई News ID मिलेगी।' }
  })
}

/** Download of a browser-generated file (news card image): recorded in the audit log. */
export async function logDownload(id: number, kind: string): Promise<ActionResult> {
  return run(async () => {
    const g = await guard(id, 'download')
    await audit(g.payload, g.user, { action: 'download', newsId: g.doc.newsId, articleId: g.doc.id, collectionSlug: 'articles', title: g.doc.title, details: { kind } }, await headers())
    return { ok: true }
  })
}
