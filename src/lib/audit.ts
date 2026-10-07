import { createHash } from 'node:crypto'
import type { Payload, PayloadRequest } from 'payload'

export type AuditEntry = {
  action: string
  newsId?: string | null
  articleId?: number | null
  collectionSlug?: string
  title?: string | null
  url?: string | null
  fromStatus?: string | null
  toStatus?: string | null
  reason?: string | null
  version?: string | null
  changedFields?: string[]
  details?: Record<string, unknown>
}
type Who = { id: number | string; name?: string | null; email?: string | null; role?: string | null } | null | undefined

const header = (h: Headers | undefined, k: string) => h?.get?.(k) || undefined

/** Where the request came from: IP + a short session fingerprint (a hash of the login cookie, never the cookie itself). */
export function requestRef(headers: Headers | undefined): { ip?: string; session?: string } {
  const ip = (header(headers, 'x-forwarded-for') || header(headers, 'x-real-ip') || '').split(',')[0].trim() || undefined
  const token = /payload-token=([^;]+)/.exec(header(headers, 'cookie') || '')?.[1]
  return { ip, session: token ? createHash('sha256').update(token).digest('hex').slice(0, 12) : undefined }
}

/** Writes one audit entry. Never throws: an audit failure must not block the editor's action (it is logged to the console). */
export async function audit(payload: Payload, who: Who, entry: AuditEntry, headers?: Headers, req?: PayloadRequest) {
  try {
    const { changedFields, ...rest } = entry
    await payload.create({
      collection: 'audit-log',
      overrideAccess: true,
      req, // same transaction as the change being recorded (SQLite has a single writer)
      data: {
        ...rest,
        changedFields: changedFields?.length ? changedFields.join(', ') : undefined,
        summary: [entry.action, entry.newsId || entry.title].filter(Boolean).join(' · ').slice(0, 200),
        user: who?.id ? Number(who.id) : undefined,
        userName: who?.name || who?.email || 'system',
        role: who?.role || undefined,
        ...requestRef(headers),
      } as never,
    })
  } catch (e) {
    console.error('audit failed', entry.action, e)
  }
}
