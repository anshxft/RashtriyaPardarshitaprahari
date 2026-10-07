import type { Video } from '../payload-types'
import { db } from './data'
import { resolveUrl, s3Configured, blobConfigured } from './storage'

/** What the Desk shows for one video: processing state, playable preview, which exports exist, latest job per kind. */
export async function videoState(v: Video) {
  const jobs = await (await db()).find({ collection: 'media-jobs', where: { video: { equals: v.id } }, sort: '-createdAt', limit: 20, depth: 0, overrideAccess: true })
  const latest: Record<string, { status: string; error?: string | null }> = {}
  for (const j of jobs.docs) if (!latest[j.kind]) latest[j.kind] = { status: j.status || 'queued', error: j.error }
  return {
    id: v.id,
    processing: v.processing || 'queued',
    processError: v.processError || '',
    posterUrl: (await resolveUrl(v.posterUrl, 3600)) || '',
    previewUrl: (await resolveUrl(v.processedUrl, 3600)) || '',
    exports: { social: Boolean(v.socialUrl), vertical: Boolean(v.verticalUrl), flash: Boolean(v.flashUrl) },
    jobs: latest,
  }
}

export const uploadMode = () => (s3Configured() ? 's3' : blobConfigured() ? 'blob' : 'local') as 's3' | 'blob' | 'local'
