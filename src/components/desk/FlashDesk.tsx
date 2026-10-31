import { FlashManager, type FlashRow } from '@/components/desk/FlashManager'
import { currentUser } from '@/lib/auth'
import { asMedia, db, getArticles } from '@/lib/data'
import { allowed, loadPermissions } from '@/lib/permissions'
import { uploadMode } from '@/lib/videoState'
import type { BreakingNew, Video } from '@/payload-types'

const idOf = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : typeof v === 'number' ? v : null)

/** Breaking Flash desk: everyone on the desk can write; publishing / pausing / removing needs the “Breaking Flash” right. */
/** Shared by ब्रेकिंग फ्लैश (red strip) and फ्लैश पॉप-अप: each section lists and creates only its own kind. */
export async function FlashDesk({ mode }: { mode: 'ticker' | 'popup' }) {
  const user = (await currentUser())!
  const payload = await db()
  await loadPermissions(payload)
  const mayFlash = allowed(user, 'flash')
  const [list, recent, videos] = await Promise.all([
    payload.find({ collection: 'breaking-news', locale: 'hi', sort: ['-priority', '-updatedAt'], limit: 200, depth: 1, overrideAccess: true }),
    getArticles('hi', { limit: 40 }),
    payload.find({ collection: 'videos', locale: 'hi', sort: '-createdAt', limit: 20, depth: 0, draft: true, overrideAccess: true }),
  ])
  const rows: FlashRow[] = (list.docs as BreakingNew[]).map((f) => {
    const photo = asMedia(f.photo)
    const v = typeof f.video === 'object' && f.video ? (f.video as Video) : null
    const by = typeof f.createdBy === 'object' && f.createdBy ? f.createdBy : null
    return {
      id: f.id,
      text: f.text || '',
      status: f.status,
      priority: f.priority ?? 0,
      caption: f.caption || '',
      photo: { id: photo?.id ?? null, url: photo ? photo.sizes?.card?.url || photo.url || null : null },
      videoId: v?.id ?? idOf(f.video),
      videoTitle: v?.title || '',
      showMedia: f.showMedia || 'auto',
      articleId: idOf(f.article),
      reporterName: f.reporterName || '',
      showReporter: Boolean(f.showReporter),
      popup: Boolean(f.popup),
      duration: f.duration || '6h',
      publishedAt: f.publishedAt || null,
      updatedAt: f.updatedAt,
      expiresAt: f.expiresAt || null,
      mine: (by?.id ?? f.createdBy) === user.id,
      byName: by?.name || '',
    }
  })
  return (
    <FlashManager
      mode={mode}
      rows={rows.filter((r) => r.popup === (mode === 'popup'))}
      stories={recent.docs.map((a) => ({ id: a.id, title: a.title }))}
      videos={(videos.docs as Video[]).map((v) => ({ id: v.id, title: v.title }))}
      mayFlash={mayFlash}
      uploadMode={uploadMode()}
    />
  )
}
