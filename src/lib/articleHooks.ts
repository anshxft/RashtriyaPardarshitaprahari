import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook, type PayloadRequest } from 'payload'
import { audit } from './audit'
import { newsStatus, versionLabel } from './newsStatus'
import { loadPermissions } from './permissions'
import { canPublish } from '../access'
import { NEWS_ID_PREFIX } from '../content/brand'

/** yyyy-mm-dd in India time (the day rolls over at 12:00 AM IST). */
export const istDate = (d: Date | string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d))

/**
 * Permanent News ID: NTP-2026-09-30-0001 (per-day running number).
 * ponytail: read-max-then-insert; two publishes in the same millisecond could collide — the unique index rejects the second
 * and the editor just clicks Publish again. Use a counter table if the desk ever publishes concurrently at volume.
 */
export async function nextNewsId(req: PayloadRequest, iso: string): Promise<string> {
  const prefix = `${NEWS_ID_PREFIX}-${istDate(iso)}-`
  const last = await req.payload.find({ collection: 'articles', where: { newsId: { like: prefix } }, sort: '-newsId', limit: 1, depth: 0, pagination: false, draft: true, req })
  const n = Number((last.docs[0] as { newsId?: string } | undefined)?.newsId?.slice(prefix.length)) || 0
  return `${prefix}${String(n + 1).padStart(4, '0')}`
}

const WATCHED = ['title', 'subheadline', 'excerpt', 'content', 'heroImage', 'reporterName', 'location'] as const
/** Fields whose change is recorded in the version history / audit log. */
const TRACKED = [...WATCHED, 'reporter', 'category', 'tags', 'sources', 'documents', 'linkCard', 'externalImage', 'format', 'slug'] as const
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const idOf = (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: unknown }).id : v)
/** Which tracked fields differ (relations compared by id). */
export function changedFields(next: Record<string, unknown>, prev: Record<string, unknown> | undefined): string[] {
  if (!prev) return []
  return TRACKED.filter((k) => k in next && !same(Array.isArray(next[k]) ? (next[k] as unknown[]).map(idOf) : idOf(next[k]), Array.isArray(prev[k]) ? (prev[k] as unknown[]).map(idOf) : idOf(prev[k])))
}
type Ctx = { republish?: 'original' | 'updated'; auditAction?: string; reason?: string; skipAudit?: boolean; changed?: string[] }

/**
 * - reporters can never publish (defamation safety)
 * - first publish: auto-stamp the date (IST) and mint the News ID
 * - after first publish: publish date, News ID (and, for non-admins, the URL) are frozen
 * - later edits of a published story are logged publicly as "संशोधित / Revised"
 */
export const articleBeforeChange: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req, context }) => {
  const user = req.user as { id: number; role?: string; name?: string } | null
  const ctx = context as Ctx
  await loadPermissions(req.payload)
  if (user) data.lastEditedBy = user.name || undefined
  if (operation === 'create' && user) data.createdBy = user.id
  const publishing = data._status === 'published'

  // No req.user = trusted server code (seed scripts); REST/admin/desk always have a user.
  if (user && !canPublish(req) && publishing) {
    throw new APIError('Reporters cannot publish. Save as draft and set Review status to "Submitted".', 403, null, true)
  }
  if (canPublish(req) && publishing) data.reviewStatus = 'approved'

  const was = originalDoc as Record<string, any> | undefined
  const wasPublished = was?._status === 'published'
  const first: string | undefined = was?.firstPublishedAt

  if (first || wasPublished) {
    // Frozen after the first publish. (Older stories published before News IDs existed are adopted here.)
    const stamp = first ?? was!.publishedAt
    data.firstPublishedAt = stamp
    data.publishedAt = was!.publishedAt
    data.newsId = was!.newsId ?? (await nextNewsId(req, stamp))
    if (user?.role !== 'admin' && was!.slug) data.slug = was!.slug
  } else if (publishing) {
    const now = new Date()
    const scheduled = data.publishedAt && new Date(data.publishedAt).getTime() > now.getTime() + 2 * 60_000
    const stamp: string = !user || scheduled ? data.publishedAt || now.toISOString() : now.toISOString()
    data.publishedAt = stamp
    data.firstPublishedAt = stamp
    data.newsId = await nextNewsId(req, stamp)
    data.versionMinor = 0
    data.lastPublishedAt = stamp
  }

  // Version history: every real change to a published story = next version (1.0 → 1.1 → 1.2 …), never wiped.
  const changed = changedFields(data, was)
  ctx.changed = operation === 'create' ? [] : changed
  if (user && wasPublished && publishing && was) {
    const visible = WATCHED.some((k) => k in data && !same(data[k], was[k]))
    const republishUpdated = ctx.republish === 'updated'
    if (changed.length || republishUpdated) data.versionMinor = (was.versionMinor || 0) + 1
    // Public revision note ("संशोधित / Updated on"). Only for real people editing; seed/bulk scripts never create one.
    if (visible || data.editNote || republishUpdated) {
      const note = data.editNote || (republishUpdated ? 'पुनः प्रकाशित / Re-published' : '')
      data.revisions = [...(was.revisions || []), { at: new Date().toISOString(), note, locale: req.locale || undefined, by: user?.name }]
    }
  }
  if (ctx.republish) data.lastPublishedAt = new Date().toISOString()
  delete data.editNote
  return data
}

/** Audit trail for every save made by a person (create, edit, publish, status changes). Desk actions add their own reason. */
export const articleAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, context }) => {
  const ctx = context as Ctx
  if (!req.user || ctx.skipAudit) return doc
  const from = operation === 'update' && previousDoc ? newsStatus(previousDoc) : null
  const to = newsStatus(doc)
  const firstPublish = !previousDoc?.firstPublishedAt && Boolean(doc.firstPublishedAt)
  const action =
    ctx.auditAction ?? (operation === 'create' ? (firstPublish ? 'publish' : 'create') : firstPublish ? 'publish' : ctx.changed?.length ? 'edit' : from !== to ? 'status' : null)
  if (!action) return doc
  await audit(
    req.payload,
    req.user as never,
    {
      action,
      newsId: doc.newsId,
      articleId: doc.id,
      collectionSlug: 'articles',
      title: doc.title,
      url: doc.slug ? `/hi/news/${doc.slug}` : undefined,
      fromStatus: from,
      toStatus: to,
      reason: ctx.reason,
      version: doc.firstPublishedAt ? versionLabel(doc.versionMinor) : undefined,
      changedFields: ctx.changed,
      details: ctx.republish ? { republish: ctx.republish } : undefined,
    },
    req.headers,
    req,
  )
  return doc
}
