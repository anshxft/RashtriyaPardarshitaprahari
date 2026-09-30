import { notFound } from 'next/navigation'
import { VideoEditor, type VideoForm } from '@/components/desk/VideoEditor'
import { currentUser } from '@/lib/auth'
import { asMedia, db } from '@/lib/data'
import { emptyVideo, categoryOptions, mayPublish, teamOptions } from '@/lib/deskData'
import { paths } from '@/lib/paths'
import { blobConfigured } from '@/lib/storage'
import type { Video } from '@/payload-types'

export const metadata = { title: 'वीडियो' }
export const maxDuration = 300

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = (await currentUser())!
  const v = (await (await db()).findByID({ collection: 'videos', id, locale: 'hi', depth: 1, draft: true, overrideAccess: false, user }).catch(() => null)) as Video | null
  if (!v) notFound()
  const thumb = asMedia(v.thumbnail)
  const form: VideoForm = {
    ...emptyVideo(),
    id: v.id,
    title: v.title,
    description: v.description || '',
    location: v.location || '',
    eventDate: v.eventDate ? v.eventDate.slice(0, 10) : '',
    reporterName: v.reporterName || '',
    reporterId: typeof v.reporter === 'object' ? (v.reporter?.id ?? null) : (v.reporter ?? null),
    categoryId: typeof v.category === 'object' ? (v.category?.id ?? null) : (v.category ?? null),
    thumb: { id: thumb?.id ?? null, url: thumb ? thumb.sizes?.card?.url || thumb.url || null : null },
    processing: (v.processing as VideoForm['processing']) || 'queued',
    processError: v.processError || '',
    posterUrl: v.posterUrl || '',
    fileName: v.originalUrl ? decodeURIComponent(v.originalUrl.split('/').pop() || '') : '',
    published: v._status === 'published',
    slug: v._status === 'published' ? paths.video('hi', v.slug) : null,
  }
  const [categories, team] = await Promise.all([categoryOptions(), teamOptions()])
  return <VideoEditor initial={form} blob={blobConfigured()} categories={categories} team={team} mayPublish={mayPublish(user)} />
}
