'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import QRCode from 'qrcode'
import { canPublish } from '@/access'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import type { NewsInput, SaveResult } from '@/lib/deskTypes'
import { sniffType } from '@/lib/forms'
import { fetchLinkMeta, type LinkMeta } from '@/lib/linkMeta'
import { paragraphsToLexical } from '@/lib/lexical'
import { paths, siteUrl } from '@/lib/paths'
import { processVideo } from '@/lib/videoProcess'

async function requireUser() {
  const user = await currentUser()
  if (!user) throw new Error('लॉगिन ज़रूरी है')
  return user
}

const msg = (e: unknown) => {
  const data = (e as { data?: { errors?: { message?: string; path?: string }[] } })?.data
  if (data?.errors?.length) return data.errors.map((x) => (x.path ? `${x.path}: ` : '') + x.message).join(' · ')
  return (e as Error)?.message || 'कुछ गड़बड़ हुई'
}

const firstSentence = (s = '', max = 220) => (s.length <= max ? s : `${s.slice(0, max).replace(/\s+\S*$/, '')}…`)

/** One save path for every button: draft / submit for review / publish now / schedule. */
export async function saveNewsAction(input: NewsInput): Promise<SaveResult> {
  try {
    const user = await requireUser()
    const payload = await db()
    const mayPublish = canPublish({ user } as never)
    if ((input.mode === 'publish' || input.mode === 'schedule') && !mayPublish) return { ok: false, error: 'प्रकाशित करने का अधिकार केवल संपादक/एडमिन के पास है। “समीक्षा के लिए भेजें” दबाएं।' }
    if (!input.title.trim()) return { ok: false, error: 'हेडलाइन ज़रूरी है' }
    if (!input.categoryId) return { ok: false, error: 'श्रेणी चुनें' }
    const paragraphs = input.paragraphs.map((p) => p.trim()).filter(Boolean)
    if (input.format !== 'link' && !paragraphs.length && (input.mode === 'publish' || input.mode === 'schedule')) return { ok: false, error: 'खबर का मुख्य पाठ खाली है' }

    const publishing = input.mode === 'publish' || input.mode === 'schedule'
    const data: Record<string, unknown> = {
      title: input.title.trim(),
      subheadline: input.subheadline?.trim() || null,
      excerpt: input.excerpt?.trim() || firstSentence(paragraphs[0]),
      content: paragraphsToLexical(paragraphs),
      format: input.format || 'news',
      category: input.categoryId,
      reporterName: input.reporterName?.trim() || null,
      reporter: input.reporterId ?? null,
      location: input.location?.trim() || null,
      heroImage: input.heroImageId ?? null,
      layout: input.layout,
      reviewStatus: input.mode === 'submit' ? 'submitted' : 'draft',
      _status: publishing ? 'published' : 'draft',
    }
    if (input.linkCard) data.linkCard = input.linkCard
    if (input.mode === 'schedule' && input.scheduleAt) data.publishedAt = new Date(input.scheduleAt).toISOString()
    if (input.editNote?.trim()) data.editNote = input.editNote.trim()

    const common = { collection: 'articles' as const, locale: input.locale, data: data as never, draft: !publishing, overrideAccess: false, user }
    const saved = input.id ? await payload.update({ ...common, id: input.id }) : await payload.create(common)
    const doc = await payload.findByID({ collection: 'articles', id: saved.id, locale: input.locale, depth: 0, draft: !publishing, overrideAccess: false, user })

    revalidatePath('/[lang]', 'layout')
    const scheduled = publishing && doc.publishedAt && new Date(doc.publishedAt).getTime() > Date.now() + 60_000
    const short = doc.newsId ? `${siteUrl()}${paths.newsShort(doc.newsId)}` : undefined
    const web = `${paths.article(input.locale, doc.slug)}`
    return {
      ok: true,
      id: doc.id,
      status: scheduled ? 'scheduled' : publishing ? 'published' : input.mode === 'submit' ? 'submitted' : 'draft',
      newsId: doc.newsId,
      slug: doc.slug,
      urls: { web, print: `${web}/print`, short, preview: `/${input.locale}/preview/${doc.id}` },
      qrSvg: short ? await QRCode.toString(short, { type: 'svg', margin: 1, width: 160, errorCorrectionLevel: 'M', color: { dark: '#0b1f4d', light: '#ffffff' } }) : undefined,
    }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

/** Photos are resized in the browser first (≈ 1–2 MB), so they stay under the 4.5 MB request limit even from a phone. */
export async function uploadPhotoAction(fd: FormData): Promise<{ ok: true; id: number; url: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    const file = fd.get('file')
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'फोटो चुनें' }
    if (file.size > 4.4 * 1024 * 1024) return { ok: false, error: 'फोटो 4 MB से बड़ी है' }
    const buf = Buffer.from(await file.arrayBuffer())
    const type = sniffType(buf)
    if (!type || type === 'application/pdf') return { ok: false, error: 'केवल JPG / PNG / WEBP फोटो' }
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type]
    const alt = String(fd.get('alt') || '').trim().slice(0, 200) || 'फोटो'
    const credit = String(fd.get('credit') || '').trim().slice(0, 200) || undefined
    const doc = await (await db()).create({
      collection: 'media',
      locale: 'hi',
      data: { alt, credit, license: credit ? undefined : 'Own' },
      file: { data: buf, mimetype: type, name: `photo-${Date.now()}.${ext}`, size: buf.length },
      overrideAccess: false,
      user,
    })
    return { ok: true, id: doc.id, url: doc.sizes?.card?.url || doc.url || '' }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

/** Paste a link → title, portal name, description and image from the page's own metadata (public web only). */
export async function fetchLinkMetaAction(url: string): Promise<{ ok: true; meta: LinkMeta } | { ok: false; error: string }> {
  try {
    await requireUser()
    return { ok: true, meta: await fetchLinkMeta(url) }
  } catch (e) {
    const m = (e as Error)?.message || ''
    return { ok: false, error: /blocked|invalid url|Invalid URL/i.test(m) ? 'यह लिंक खोला नहीं जा सका (सार्वजनिक वेबसाइट का पूरा लिंक डालें)' : m.includes('abort') || m.includes('timeout') ? 'साइट ने समय पर जवाब नहीं दिया — जानकारी हाथ से भरें' : m || 'जानकारी नहीं मिली — हाथ से भरें' }
  }
}

// ── Videos: upload → auto logo → publish
/** Called the moment the file has been uploaded: creates a draft and starts logo processing in the background. */
export async function startVideoAction(input: { originalUrl: string; filename: string; size: number }): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    const title = input.filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120) || 'नया वीडियो'
    const doc = await (await db()).create({
      collection: 'videos',
      locale: 'hi',
      data: { title, originalUrl: input.originalUrl, processing: 'queued', sizeBytes: input.size, _status: 'draft' } as never,
      draft: true,
      overrideAccess: false,
      user,
    })
    after(() => processVideo(doc.id))
    return { ok: true, id: doc.id }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

export async function retryVideoAction(id: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireUser()
    await (await db()).findByID({ collection: 'videos', id, depth: 0, draft: true, overrideAccess: false, user }) // access check
    after(() => processVideo(id))
    return { ok: true }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

export type VideoInput = {
  id: number
  locale: 'hi' | 'en'
  mode: 'draft' | 'publish' | 'schedule'
  title: string
  description?: string
  location?: string
  eventDate?: string
  reporterName?: string
  reporterId?: number | null
  categoryId?: number | null
  thumbnailId?: number | null
  scheduleAt?: string
}

export async function saveVideoAction(input: VideoInput): Promise<{ ok: true; status: 'draft' | 'published' | 'scheduled'; url?: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    const publishing = input.mode !== 'draft'
    if (publishing && !canPublish({ user } as never)) return { ok: false, error: 'प्रकाशित करने का अधिकार केवल संपादक/एडमिन के पास है' }
    if (!input.title.trim()) return { ok: false, error: 'शीर्षक ज़रूरी है' }
    const clean = (s?: string) => s?.trim() || null
    const data: Record<string, unknown> = {
      title: input.title.trim(),
      description: clean(input.description),
      location: clean(input.location),
      eventDate: input.eventDate ? new Date(`${input.eventDate}T12:00:00+05:30`).toISOString() : null,
      reporterName: clean(input.reporterName),
      reporter: input.reporterId ?? null,
      category: input.categoryId ?? null,
      thumbnail: input.thumbnailId ?? null,
      _status: publishing ? 'published' : 'draft',
    }
    if (input.mode === 'schedule' && input.scheduleAt) data.publishedAt = new Date(input.scheduleAt).toISOString()
    else if (publishing) data.publishedAt = new Date().toISOString()
    const payload = await db()
    const doc = await payload.update({ collection: 'videos', id: input.id, locale: input.locale, data: data as never, draft: !publishing, overrideAccess: false, user })
    revalidatePath('/[lang]', 'layout')
    const scheduled = publishing && doc.publishedAt && new Date(doc.publishedAt).getTime() > Date.now() + 60_000
    return { ok: true, status: scheduled ? 'scheduled' : publishing ? 'published' : 'draft', url: paths.video(input.locale, doc.slug) }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

// ── Team (हमारी टीम)
export type TeamInput = {
  id?: number
  locale: 'hi' | 'en'
  mode: 'draft' | 'publish'
  name: string
  designation: string
  tier: string
  workArea?: string
  state?: string
  district?: string
  bureau?: string
  idNumber?: string
  bio?: string
  experience?: string
  email?: string
  phone?: string
  publishContact?: boolean
  order?: number
  photoId?: number | null
}

export async function saveTeamAction(input: TeamInput): Promise<{ ok: true; id: number; status: 'draft' | 'published' } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    if (!input.name.trim() || !input.designation.trim()) return { ok: false, error: 'नाम और पद ज़रूरी हैं' }
    if (input.mode === 'publish' && !canPublish({ user } as never)) return { ok: false, error: 'प्रोफ़ाइल प्रकाशित करने का अधिकार आपके पास नहीं है' }
    const publishing = input.mode === 'publish'
    const clean = (s?: string) => s?.trim() || null
    const data = {
      name: input.name.trim(),
      designation: input.designation.trim(),
      tier: input.tier,
      workArea: clean(input.workArea),
      state: input.state || null,
      district: clean(input.district),
      bureau: clean(input.bureau),
      idNumber: clean(input.idNumber),
      bio: clean(input.bio),
      experience: clean(input.experience),
      email: clean(input.email),
      phone: clean(input.phone),
      publishContact: Boolean(input.publishContact),
      order: input.order ?? 100,
      photo: input.photoId ?? null,
      _status: publishing ? 'published' : 'draft',
    }
    const payload = await db()
    const common = { collection: 'team-members' as const, locale: input.locale, data: data as never, draft: !publishing, overrideAccess: false, user }
    const saved = input.id ? await payload.update({ ...common, id: input.id }) : await payload.create(common)
    revalidatePath('/[lang]/team', 'page')
    return { ok: true, id: saved.id, status: publishing ? 'published' : 'draft' }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}

// ── Breaking news (top red ticker)
export async function addBreakingAction(text: string, link?: string, hoursToLive?: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireUser()
    if (!canPublish({ user } as never)) return { ok: false, error: 'केवल संपादक/एडमिन' }
    if (!text.trim()) return { ok: false, error: 'टेक्स्ट लिखें' }
    await (await db()).create({
      collection: 'breaking-news',
      locale: 'hi',
      data: { text: text.trim(), link: link?.trim() || undefined, active: true, expiresAt: hoursToLive ? new Date(Date.now() + hoursToLive * 3_600_000).toISOString() : undefined },
      overrideAccess: false,
      user,
    })
    revalidatePath('/[lang]', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}
export async function toggleBreakingAction(id: number, active: boolean) {
  try {
    const user = await requireUser()
    await (await db()).update({ collection: 'breaking-news', id, data: { active }, overrideAccess: false, user })
    revalidatePath('/[lang]', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}
export async function deleteBreakingAction(id: number) {
  try {
    const user = await requireUser()
    await (await db()).delete({ collection: 'breaking-news', id, overrideAccess: false, user })
    revalidatePath('/[lang]', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: msg(e) }
  }
}
