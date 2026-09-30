import { APIError, type CollectionBeforeChangeHook, type PayloadRequest } from 'payload'
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

/**
 * - reporters can never publish (defamation safety)
 * - first publish: auto-stamp the date (IST) and mint the News ID
 * - after first publish: publish date, News ID (and, for non-admins, the URL) are frozen
 * - later edits of a published story are logged publicly as "संशोधित / Revised"
 */
export const articleBeforeChange: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  const user = req.user as { id: number; role?: string; name?: string } | null
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
  }

  // Public revision note ("संशोधित"). Only for real people editing; seed/bulk scripts never create one.
  if (user && wasPublished && publishing && was) {
    const changed = WATCHED.some((k) => k in data && JSON.stringify(data[k] ?? null) !== JSON.stringify(was[k] ?? null))
    if (changed || data.editNote) {
      data.revisions = [...(was.revisions || []), { at: new Date().toISOString(), note: data.editNote || '', locale: req.locale || undefined, by: user?.name }]
    }
  }
  delete data.editNote
  return data
}
