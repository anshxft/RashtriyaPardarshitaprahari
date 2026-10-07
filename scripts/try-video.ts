// Manual end-to-end test of the video pipeline on this machine (LOCAL database only):
//   VIDEO_FONT="Nirmala UI" npx payload run scripts/try-video.ts      (Windows; the worker image uses Noto Sans Devanagari)
// Uses ./.local-storage/videos/original/test-clip.mp4 (make one with ffmpeg testsrc), creates a fictional video news,
// runs web → publish → social → vertical → flash (strip only unless a TTS provider is set) and prints what came out.
import config from '@payload-config'
import { getPayload } from 'payload'
import { paragraphsToLexical } from '../src/lib/lexical'
import { enqueue, runPending } from '../src/lib/videoProcess'

const payload = await getPayload({ config })
if (!String(process.env.DATABASE_URL || '').startsWith('file:')) throw new Error('local SQLite only')
const admin = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })).docs[0]
const cat = (await payload.find({ collection: 'categories', limit: 1 })).docs[0]
const t0 = Date.now()
const v = await payload.create({ collection: 'videos', locale: 'hi', draft: true, data: { title: 'परीक्षण वीडियो', originalUrl: '/api/files/videos/original/test-clip.mp4', processing: 'queued', _status: 'draft' } as never })
await enqueue('web', v.id)
await runPending(10 * 60_000)
const a = await payload.create({
  collection: 'articles',
  locale: 'hi',
  user: admin,
  data: {
    title: 'बिहार में सड़क सुरक्षा पर नया अभियान: क्षेत्र, श्रृंखला (परीक्षण)',
    format: 'video',
    video: v.id,
    category: cat.id,
    reporterName: 'परीक्षण संवाददाता',
    location: 'रांची, झारखंड',
    content: paragraphsToLexical(['परीक्षण।']),
    flash: { enabled: true, script: 'ज़िला प्रशासन ने सड़क सुरक्षा अभियान की घोषणा की। (परीक्षण)', breaking: true, repeat: true, intervalSec: 10, voice: false },
    _status: 'published',
  } as never,
})
await payload.update({ collection: 'videos', id: v.id, data: { article: a.id, _status: 'published', publishedAt: a.publishedAt } as never })
for (const k of ['social', 'vertical', 'flash'] as const) await enqueue(k, v.id)
await runPending(20 * 60_000)
const out = await payload.findByID({ collection: 'videos', id: v.id, draft: true, depth: 0 })
const jobs = await payload.find({ collection: 'media-jobs', where: { video: { equals: v.id } }, depth: 0, limit: 10 })
console.log(JSON.stringify({ video: v.id, article: a.id, newsId: a.newsId, processing: out.processing, processedUrl: out.processedUrl, socialUrl: out.socialUrl, verticalUrl: out.verticalUrl, flashUrl: out.flashUrl, jobs: jobs.docs.map((j) => [j.kind, j.status, j.error]), seconds: (Date.now() - t0) / 1000 }, null, 2))
process.exit(0)
