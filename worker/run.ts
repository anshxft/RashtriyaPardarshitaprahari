/**
 * Video worker (Railway / any Docker host):  npx payload run worker/run.ts
 * Polls the media-jobs queue in the database and processes one job at a time — no time limit (unlike Vercel).
 * Needs the same DATABASE_URL, PAYLOAD_SECRET, S3_* (and TTS_*) as the website; set VIDEO_WORKER=external on Vercel.
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import { runPending } from '../src/lib/videoProcess'

await getPayload({ config })
const PER_BATCH_MS = 60 * 60_000
console.log(`[worker] started ${new Date().toISOString()} — ffmpeg: ${process.env.FFMPEG_PATH || 'bundled'}, font: ${process.env.VIDEO_FONT || 'Noto Sans Devanagari'}`)
for (;;) {
  try {
    await runPending(PER_BATCH_MS)
  } catch (e) {
    console.error('[worker]', e)
  }
  await new Promise((r) => setTimeout(r, 5000))
}
