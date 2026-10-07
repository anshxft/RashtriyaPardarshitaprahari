'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { canPublish } from '@/access'
import { currentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { db } from '@/lib/data'
import { paragraphsToLexical } from '@/lib/lexical'
import { publishChecklist } from '@/lib/newsStatus'
import { allowed } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { enqueue, kick, type JobKind } from '@/lib/videoProcess'
import type { Article, User, Video } from '@/payload-types'

type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string }
const msg = (e: unknown) => {
  const data = (e as { data?: { errors?: { message?: string; path?: string }[] } })?.data
  if (data?.errors?.length) return data.errors.map((x) => (x.path ? `${x.path}: ` : '') + x.message).join(' · ')
  return (e as Error)?.message || 'कुछ गड़बड़ हुई'
}
async function user() {
  const u = await currentUser()
  if (!u) throw new Error('लॉगिन ज़रूरी है')
  return u
}
const articleOf = (v: Video) => (typeof v.article === 'object' ? v.article?.id : v.article) ?? null
/** May this person change this video news? (own upload, or "edit others" right) */
async function mayEdit(u: User, v: Video) {
  const owner = typeof v.createdBy === 'object' ? v.createdBy?.id : v.createdBy
  return owner === u.id || allowed(u, 'editOthers') || canPublish({ user: u } as never)
}

/** Upload finished: create the video (or REPLACE the file of an existing one, keeping the old file in its history). */
export async function startVideoAction(input: { originalUrl: string; filename: string; size: number; replaceId?: number }): Promise<Res<{ id: number }>> {
  try {
    const u = await user()
    const payload = await db()
    if (input.replaceId) {
      const v = (await payload.findByID({ collection: 'videos', id: input.replaceId, depth: 0, draft: true })) as Video
      if (!(await mayEdit(u, v))) return { ok: false, error: 'इस वीडियो को बदलने का अधिकार नहीं है' }
      const previousFiles = [...(v.previousFiles || []), { originalUrl: v.originalUrl, processedUrl: v.processedUrl, replacedAt: new Date().toISOString(), by: u.name }]
      await payload.update({
        collection: 'videos',
        id: v.id,
        data: { originalUrl: input.originalUrl, processedUrl: null, posterUrl: null, socialUrl: null, verticalUrl: null, flashUrl: null, processing: 'queued', processError: null, sizeBytes: input.size, previousFiles, _status: v._status } as never,
        draft: v._status !== 'published',
        overrideAccess: true,
      })
      const aId = articleOf(v)
      const a = aId ? ((await payload.findByID({ collection: 'articles', id: aId, depth: 0, draft: true }).catch(() => null)) as Article | null) : null
      await audit(payload, u, { action: 'replace-media', articleId: a?.id, newsId: a?.newsId, collectionSlug: 'videos', title: a?.title || v.title, details: { previous: v.originalUrl } }, await headers())
      await enqueue('web', v.id)
      kick()
      return { ok: true, id: v.id }
    }
    const title = input.filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120) || 'नया वीडियो'
    const doc = await payload.create({
      collection: 'videos',
      locale: 'hi',
      data: { title, originalUrl: input.originalUrl, processing: 'queued', sizeBytes: input.size, _status: 'draft' } as never,
      draft: true,
      overrideAccess: false,
      user: u,
    })
    await enqueue('web', doc.id)
    kick()
    return { ok: true, id: doc.id }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

export async function retryVideoAction(id: number, kind: JobKind = 'web'): Promise<Res> {
  try {
    const u = await user()
    const v = (await (await db()).findByID({ collection: 'videos', id, depth: 0, draft: true })) as Video
    if (!(await mayEdit(u, v))) return { ok: false, error: 'अधिकार नहीं' }
    if (kind === 'web') await (await db()).update({ collection: 'videos', id, data: { processing: 'queued', processError: null, _status: v._status } as never, draft: v._status !== 'published', overrideAccess: true })
    await enqueue(kind, id)
    kick()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

export type VideoNewsInput = {
  videoId: number
  mode: 'draft' | 'submit' | 'publish' | 'schedule'
  title: string
  flashScript: string
  description?: string
  reporterName?: string
  reporterId?: number | null
  location?: string
  categoryId?: number | null
  thumbnailId?: number | null
  scheduleAt?: string
  breaking?: boolean
  flash?: boolean
  voice?: boolean
  repeat?: boolean
  intervalSec?: number
  voiceRate?: number
  voiceVolume?: number
  pauseMs?: number
  vertical?: boolean
}

/**
 * One master news record (Part 1.12): the video news IS an article (format "video") linked to the uploaded video.
 * News ID, QR, URL, publish state, versions and audit all live on that article; the video holds the files.
 */
export async function saveVideoNewsAction(input: VideoNewsInput): Promise<Res<{ status: string; articleId: number; newsId?: string | null; url?: string }>> {
  try {
    const u = await user()
    const payload = await db()
    const v = (await payload.findByID({ collection: 'videos', id: input.videoId, depth: 0, draft: true })) as Video
    if (!(await mayEdit(u, v))) return { ok: false, error: 'इस वीडियो खबर को बदलने का अधिकार नहीं है' }
    const publishing = input.mode === 'publish' || input.mode === 'schedule'
    const clean = (s?: string) => s?.trim() || null
    if (!input.title.trim()) return { ok: false, error: 'शीर्षक ज़रूरी है' }
    if (!input.categoryId) return { ok: false, error: 'श्रेणी चुनें' }
    if (publishing) {
      if (!canPublish({ user: u } as never)) return { ok: false, error: 'प्रकाशित करने का अधिकार आपकी भूमिका में नहीं है। “समीक्षा के लिए भेजें” दबाएं।' }
      if (v.processing !== 'ready') return { ok: false, error: 'वीडियो की प्रोसेसिंग पूरी होने (✔ तैयार) के बाद ही प्रकाशित कर सकते हैं' }
      const missing = publishChecklist({ title: input.title, reporterName: input.reporterName, location: input.location, categoryId: input.categoryId, hasMedia: true, hasVideo: true, body: input.description, flashScript: input.flashScript }).filter((i) => i.required && !i.ok)
      if (missing.length) return { ok: false, error: `ज़रूरी: ${missing.map((i) => i.label).join(', ')}` }
      if ((input.flash || input.voice) && !input.flashScript.trim()) return { ok: false, error: 'Flash / आवाज़ के लिए फ्लैश स्क्रिप्ट लिखें' }
    }

    await payload.update({
      collection: 'videos',
      id: v.id,
      locale: 'hi',
      data: { title: input.title.trim(), description: clean(input.description) || clean(input.flashScript), location: clean(input.location), reporterName: clean(input.reporterName), reporter: input.reporterId ?? null, category: input.categoryId, thumbnail: input.thumbnailId ?? null, _status: v._status } as never,
      draft: v._status !== 'published',
      overrideAccess: true,
    })

    const aId = articleOf(v)
    const prev = aId ? ((await payload.findByID({ collection: 'articles', id: aId, depth: 0, draft: true }).catch(() => null)) as Article | null) : null
    const scriptChanged = (prev?.flash?.script || '') !== input.flashScript.trim()
    const text = (input.description || input.flashScript || '').split(/\n{2,}|\r?\n/).map((p) => p.trim()).filter(Boolean)
    const data: Record<string, unknown> = {
      title: input.title.trim(),
      excerpt: clean(input.flashScript) || clean(input.description),
      content: paragraphsToLexical(text),
      format: 'video',
      video: v.id,
      category: input.categoryId,
      reporterName: clean(input.reporterName),
      reporter: input.reporterId ?? null,
      location: clean(input.location),
      heroImage: input.thumbnailId ?? null,
      flash: {
        enabled: Boolean(input.flash),
        script: input.flashScript.trim(),
        breaking: Boolean(input.breaking),
        repeat: input.repeat !== false,
        intervalSec: input.intervalSec || 20,
        voice: Boolean(input.voice),
        voiceRate: input.voiceRate || 1,
        voiceVolume: input.voiceVolume ?? 100,
        pauseMs: input.pauseMs ?? 400,
        audioUrl: scriptChanged ? null : prev?.flash?.audioUrl,
        audioKey: scriptChanged ? null : prev?.flash?.audioKey,
        // Publishing by an authorised editor = approving the script (Part 3.1/3.6).
        approvedBy: publishing ? u.name : scriptChanged ? null : prev?.flash?.approvedBy,
        approvedAt: publishing ? new Date().toISOString() : scriptChanged ? null : prev?.flash?.approvedAt,
      },
      reviewStatus: input.mode === 'submit' ? 'submitted' : prev?.reviewStatus || 'draft',
      _status: publishing ? 'published' : prev?._status === 'published' ? 'published' : 'draft',
    }
    if (input.mode === 'schedule' && input.scheduleAt) data.publishedAt = new Date(input.scheduleAt).toISOString()
    const a = (
      prev
        ? await payload.update({ collection: 'articles', id: prev.id, locale: 'hi', data: data as never, draft: data._status !== 'published', user: u, overrideAccess: false })
        : await payload.create({ collection: 'articles', locale: 'hi', data: data as never, draft: data._status !== 'published', user: u, overrideAccess: false })
    ) as Article
    // Keep the video's own visibility in step with its master record (/videos list, sitemap).
    await payload.update({
      collection: 'videos',
      id: v.id,
      data: { article: a.id, _status: a._status, publishedAt: a.publishedAt } as never,
      draft: a._status !== 'published',
      overrideAccess: true,
    })
    if (a._status === 'published') {
      await enqueue('social', v.id)
      if (input.vertical) await enqueue('vertical', v.id)
      if (a.flash?.enabled || a.flash?.voice) await enqueue('flash', v.id)
      kick()
    }
    revalidatePath('/', 'layout')
    const scheduled = a._status === 'published' && a.publishedAt && new Date(a.publishedAt).getTime() > Date.now() + 60_000
    return { ok: true, status: scheduled ? 'scheduled' : a._status === 'published' ? 'published' : input.mode === 'submit' ? 'submitted' : 'draft', articleId: a.id, newsId: a.newsId, url: a.slug ? paths.article('hi', a.slug) : undefined }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

/** "Generate Social Video" / "Final video with Flash + Voice" on demand. */
export async function generateExportAction(videoId: number, kind: 'social' | 'vertical' | 'flash'): Promise<Res> {
  try {
    const u = await user()
    const v = (await (await db()).findByID({ collection: 'videos', id: videoId, depth: 0, draft: true })) as Video
    if (!(await mayEdit(u, v))) return { ok: false, error: 'अधिकार नहीं' }
    if (v.processing !== 'ready') return { ok: false, error: 'पहले वीडियो की प्रोसेसिंग पूरी होने दें' }
    await enqueue(kind, videoId)
    kick()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}
