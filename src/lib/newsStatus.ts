/**
 * News status + which buttons a person sees. Pure (no server imports): the Desk list, the editor and the checks share it.
 * Draft → Pending Review → (Scheduled) → Published → Updated → Archived, plus Trashed (soft delete).
 */
import { allowed, type Matrix } from './permissions.ts'

export type NewsStatus = 'draft' | 'pending' | 'scheduled' | 'published' | 'updated' | 'archived' | 'trashed'
export const STATUS_LABEL: Record<NewsStatus, { hi: string; cls: string }> = {
  draft: { hi: 'ड्राफ्ट', cls: 'bg-slate-200 text-slate-800' },
  pending: { hi: 'समीक्षा में', cls: 'bg-saffron-500 text-navy-950' },
  scheduled: { hi: 'शेड्यूल', cls: 'bg-sky-600 text-white' },
  published: { hi: 'प्रकाशित', cls: 'bg-india-600 text-white' },
  updated: { hi: 'अपडेटेड', cls: 'bg-india-700 text-white' },
  archived: { hi: 'आर्काइव', cls: 'bg-navy-700 text-white' },
  trashed: { hi: 'ट्रैश', cls: 'bg-alert-600 text-white' },
}

export type StatusDoc = {
  _status?: string | null
  lifecycle?: string | null
  reviewStatus?: string | null
  publishedAt?: string | null
  versionMinor?: number | null
  revisions?: unknown[] | null
}

export function newsStatus(d: StatusDoc, now = Date.now()): NewsStatus {
  if (d.lifecycle === 'trashed') return 'trashed'
  if (d.lifecycle === 'archived') return 'archived'
  if (d._status === 'published') {
    if (d.publishedAt && new Date(d.publishedAt).getTime() > now) return 'scheduled'
    return (d.versionMinor || 0) > 0 || (d.revisions?.length || 0) > 0 ? 'updated' : 'published'
  }
  return d.reviewStatus === 'submitted' ? 'pending' : 'draft'
}

export const DELETE_REASONS = ['Duplicate', 'Legal / Editorial issue', 'Incorrect information', 'Technical error', 'Other'] as const

export const versionLabel = (minor?: number | null) => `1.${minor || 0}`

export type Btn =
  | 'edit'
  | 'preview'
  | 'publish'
  | 'approve'
  | 'download'
  | 'share'
  | 'republish'
  | 'archive'
  | 'restorePublish'
  | 'delete'
  | 'restoreTrash'
  | 'purge'
  | 'history'
  | 'audit'
  | 'social'
  | 'replaceMedia'
  | 'copy'

type U = { id: number | string; role?: string | null; canPublish?: boolean | null }
/** Main buttons by status, then filtered by the person's rights; `more` = the "More ▼" menu. */
export function buttonsFor(status: NewsStatus, user: U, ownerId: number | string | null | undefined, opts: { video?: boolean } = {}, m?: Matrix): { main: Btn[]; more: Btn[] } {
  const can = (a: Parameters<typeof allowed>[1]) => allowed(user, a, m)
  const own = ownerId != null && String(ownerId) === String(user.id)
  const mayEdit = own || can('editOthers')
  const mayTrashLive = can(opts.video ? 'trashVideo' : 'trashPublished') || can('trashPublished')
  const main: Btn[] = []
  const more: Btn[] = []
  const add = (list: Btn[], b: Btn, ok: boolean) => ok && !list.includes(b) && list.push(b)

  switch (status) {
    case 'draft':
      add(main, 'edit', mayEdit)
      add(main, 'preview', true)
      add(main, 'publish', can('publish') && (own || can('approve') || can('editOthers')))
      add(main, 'delete', own ? can('trashOwnDraft') : mayTrashLive)
      break
    case 'pending':
    case 'scheduled':
      add(main, 'preview', true)
      add(main, 'edit', mayEdit)
      add(main, 'approve', can('publish') && (own || can('approve')))
      break
    case 'published':
    case 'updated':
      add(main, 'preview', true)
      add(main, 'edit', mayEdit)
      add(main, 'download', can('download'))
      add(main, 'share', can('share'))
      add(main, 'republish', can('republish'))
      add(main, 'archive', can('archive'))
      add(more, 'delete', mayTrashLive)
      break
    case 'archived':
      add(main, 'preview', true)
      add(main, 'edit', mayEdit)
      add(main, 'download', can('download'))
      add(main, 'restorePublish', can('restore') || can('republish'))
      add(main, 'delete', mayTrashLive)
      break
    case 'trashed':
      add(main, 'restoreTrash', user.role === 'admin')
      add(main, 'purge', user.role === 'admin')
      return { main, more }
  }
  add(more, 'history', can('versionHistory'))
  add(more, 'audit', can('auditLog'))
  add(more, 'social', can('share') && (status === 'published' || status === 'updated'))
  add(more, 'replaceMedia', mayEdit)
  add(more, 'copy', true)
  return { main, more }
}

/** Publish checklist (Part 1.3). `required` items block publishing; the rest are warnings. */
export type ChecklistInput = { title?: string; subheadline?: string; reporterName?: string; location?: string; categoryId?: unknown; hasMedia?: boolean; body?: string; isLink?: boolean; hasVideo?: boolean; flashScript?: string }
export function publishChecklist(f: ChecklistInput): { key: string; label: string; ok: boolean; required: boolean; note?: string }[] {
  const t = (s?: string) => Boolean(s && s.trim())
  return [
    { key: 'title', label: 'हेडलाइन', ok: t(f.title), required: true },
    { key: 'sub', label: 'सब-हेडलाइन (वैकल्पिक)', ok: t(f.subheadline), required: false },
    { key: 'reporter', label: 'रिपोर्टर / संवाददाता', ok: t(f.reporterName), required: !f.isLink },
    { key: 'location', label: 'जिला / राज्य (स्थान)', ok: t(f.location), required: !f.isLink },
    { key: 'category', label: 'श्रेणी', ok: Boolean(f.categoryId), required: true },
    { key: 'media', label: 'फोटो / वीडियो', ok: Boolean(f.hasMedia), required: false, note: 'बिना फोटो के भी खबर साफ़ टेक्स्ट लेआउट में छपेगी' },
    { key: 'body', label: f.hasVideo ? 'मुख्य पाठ या फ्लैश स्क्रिप्ट' : 'मुख्य पाठ', ok: f.isLink || t(f.body) || (Boolean(f.hasVideo) && t(f.flashScript)), required: !f.isLink },
    { key: 'date', label: 'तारीख और समय', ok: true, required: true, note: 'प्रकाशन के समय अपने-आप' },
    { key: 'newsId', label: 'यूनिक न्यूज़ आईडी', ok: true, required: true, note: 'पहली बार प्रकाशित होते ही बनेगी, फिर कभी नहीं बदलेगी' },
    { key: 'seo', label: 'SEO शीर्षक / विवरण', ok: t(f.title), required: false, note: 'हेडलाइन और पहले वाक्य से अपने-आप' },
  ]
}
