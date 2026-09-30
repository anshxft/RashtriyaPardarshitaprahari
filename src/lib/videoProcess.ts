import { spawn } from 'node:child_process'
import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { db } from './data'
import { videoSize, watermarkArgs, type Watermark } from './videoArgs'
import { downloadTo, saveFromPath } from './storage'

const run = (args: string[], timeoutMs: number) =>
  new Promise<{ code: number | null; err: string }>((resolve) => {
    const p = spawn(ffmpegInstaller.path, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => (err = (err + d).slice(-20_000)))
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs)
    p.on('close', (code) => (clearTimeout(timer), resolve({ code, err })))
    p.on('error', (e) => (clearTimeout(timer), resolve({ code: -1, err: String(e) })))
  })

const setDoc = async (id: number, data: Record<string, unknown>) => {
  const payload = await db()
  const cur = await payload.findByID({ collection: 'videos', id, depth: 0, draft: true })
  const published = cur._status === 'published'
  await payload.update({ collection: 'videos', id, data: { ...data, _status: cur._status } as never, draft: !published, overrideAccess: true })
}

/**
 * Video Upload → Auto Logo → Ready Video. Runs after the upload response has gone out (Next `after()`), so the editor keeps
 * working. The original file is never touched. On any failure the story is still publishable: the site then plays the
 * original with the logo laid over it at playback time.
 */
export async function processVideo(id: number, budgetMs = 270_000): Promise<void> {
  const started = Date.now()
  const dir = path.join(os.tmpdir(), `prahari-video-${id}-${Date.now()}`)
  try {
    const payload = await db()
    const v = await payload.findByID({ collection: 'videos', id, depth: 0, draft: true })
    if (!v.originalUrl) throw new Error('no original file')
    await setDoc(id, { processing: 'processing', processError: null })
    await mkdir(dir, { recursive: true })
    const input = path.join(dir, `in${path.extname(new URL(v.originalUrl, 'http://x').pathname) || '.mp4'}`)
    const logoPath = path.join(dir, 'logo.png')
    const output = path.join(dir, 'out.mp4')
    const poster = path.join(dir, 'poster.jpg')

    const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 1 })) as { videoWatermark?: Watermark & { logo?: { url?: string } | number | null } }
    const wm = settings.videoWatermark || {}
    await downloadTo(v.originalUrl, input)
    const logo = wm.logo && typeof wm.logo === 'object' && wm.logo.url
    if (logo) await downloadTo(logo.startsWith('http') || logo.startsWith('/api/') ? logo : `${process.env.NEXT_PUBLIC_SITE_URL}${logo}`, logoPath)
    else await copyFile(path.join(process.cwd(), 'public', 'logo-watermark.png'), logoPath)

    // Poster frame (1 s in, or the very first frame for very short clips)
    const still = (ss: string) => run(['-y', '-ss', ss, '-i', input, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', poster], 60_000)
    const first = await still('1')
    if (first.code !== 0) await still('0')
    const duration = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(first.err)
    const durationSec = duration ? Math.round(+duration[1] * 3600 + +duration[2] * 60 + +duration[3]) : undefined
    const size = videoSize(first.err)

    let processedUrl = v.originalUrl
    if (wm.enabled !== false) {
      const left = budgetMs - (Date.now() - started) - 10_000
      const r = await run(watermarkArgs(input, logoPath, output, wm, size?.w), Math.max(20_000, left))
      if (r.code !== 0) throw new Error(`ffmpeg failed (${r.code}): ${r.err.split('\n').filter(Boolean).slice(-3).join(' | ').slice(0, 300)}`)
      processedUrl = await saveFromPath(`videos/published/${id}.mp4`, output, 'video/mp4')
    }
    const posterUrl = await stat(poster).then(() => saveFromPath(`videos/posters/${id}.jpg`, poster, 'image/jpeg')).catch(() => undefined)
    await setDoc(id, { processing: 'ready', processedUrl, posterUrl, durationSec, sizeBytes: (await stat(output).catch(() => null))?.size })
  } catch (e) {
    await setDoc(id, { processing: 'failed', processError: String((e as Error).message || e).slice(0, 400) }).catch(() => {})
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
