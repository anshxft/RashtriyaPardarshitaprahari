import { notFound } from 'next/navigation'
import { VideoEditor, type VideoForm } from '@/components/desk/VideoEditor'
import { currentUser } from '@/lib/auth'
import { asMedia, db } from '@/lib/data'
import { emptyVideo, categoryOptions, mayPublish, teamOptions } from '@/lib/deskData'
import { paths } from '@/lib/paths'
import { QUOTA_NOTE } from '@/lib/tts'
import { uploadMode, videoState } from '@/lib/videoState'
import type { Article, Video } from '@/payload-types'

export const metadata = { title: 'वीडियो' }
export const maxDuration = 300

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = (await currentUser())!
  const payload = await db()
  const v = (await payload.findByID({ collection: 'videos', id, locale: 'hi', depth: 1, draft: true, overrideAccess: false, user }).catch(() => null)) as Video | null
  if (!v) notFound()
  const aId = typeof v.article === 'object' ? v.article?.id : v.article
  const a = aId ? ((await payload.findByID({ collection: 'articles', id: aId, locale: 'hi', depth: 0, draft: true }).catch(() => null)) as Article | null) : null
  const thumb = asMedia(v.thumbnail)
  const s = await videoState(v)
  const fl = a?.flash
  const form: VideoForm = {
    ...emptyVideo(),
    id: v.id,
    articleId: a?.id ?? null,
    newsId: a?.newsId,
    title: a?.title || v.title,
    flashScript: fl?.script || '',
    description: v.description || '',
    location: a?.location || v.location || '',
    reporterName: a?.reporterName || v.reporterName || '',
    reporterId: typeof v.reporter === 'object' ? (v.reporter?.id ?? null) : (v.reporter ?? null),
    categoryId: typeof v.category === 'object' ? (v.category?.id ?? null) : (v.category ?? null),
    thumb: { id: thumb?.id ?? null, url: thumb ? thumb.sizes?.card?.url || thumb.url || null : null },
    breaking: Boolean(fl?.breaking),
    flash: Boolean(fl?.enabled),
    voice: Boolean(fl?.voice),
    repeat: fl?.repeat !== false,
    intervalSec: fl?.intervalSec || 20,
    voiceRate: fl?.voiceRate || 1,
    voiceVolume: fl?.voiceVolume ?? 100,
    pauseMs: fl?.pauseMs ?? 400,
    processing: s.processing as VideoForm['processing'],
    processError: s.processError,
    posterUrl: s.posterUrl,
    previewUrl: s.previewUrl,
    exports: s.exports,
    jobs: s.jobs,
    fileName: v.originalUrl ? decodeURIComponent(v.originalUrl.split('/').pop() || '').replace(/^\d+-[0-9a-f]{8}-/, '') : '',
    published: a?._status === 'published',
    slug: a?._status === 'published' && a.slug ? paths.article('hi', a.slug) : null,
  }
  const [categories, team] = await Promise.all([categoryOptions(), teamOptions()])
  return <VideoEditor initial={form} uploadMode={uploadMode()} categories={categories} team={team} mayPublish={mayPublish(user)} ttsNote={QUOTA_NOTE} />
}
