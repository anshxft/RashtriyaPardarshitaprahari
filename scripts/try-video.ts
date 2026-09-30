// Manual end-to-end test of the logo pipeline on this machine:  npx payload run scripts/try-video.ts
// Uses ./.local-storage/videos/original/test-clip.mp4 (make one with ffmpeg testsrc) and prints what came out.
import config from '@payload-config'
import { getPayload } from 'payload'
import { processVideo } from '../src/lib/videoProcess'

const payload = await getPayload({ config })
const doc = await payload.create({
  collection: 'videos',
  locale: 'hi',
  data: { title: 'परीक्षण वीडियो', originalUrl: '/api/files/videos/original/test-clip.mp4', processing: 'queued', _status: 'draft' } as never,
  draft: true,
})
const t0 = Date.now()
await processVideo(doc.id)
const v = await payload.findByID({ collection: 'videos', id: doc.id, draft: true })
console.log(JSON.stringify({ id: v.id, processing: v.processing, error: v.processError, processedUrl: v.processedUrl, posterUrl: v.posterUrl, durationSec: v.durationSec, sizeBytes: v.sizeBytes, seconds: (Date.now() - t0) / 1000 }, null, 2))
process.exit(0)
