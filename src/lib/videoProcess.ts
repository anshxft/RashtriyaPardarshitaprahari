/**
 * Video jobs: Upload → queue (media-jobs) → worker → files. The original upload is never touched.
 *   web      → website version (official logo, top-right, as set in Site Settings) + poster/thumbnail
 *   social   → Social-Ready 1920×1080: logo, name tag, headline, reporter · place · date · News ID, end screen
 *   vertical → the same in 1080×1920
 *   flash    → website version + red FLASH strip + female voice (lib/flashVideo.ts)
 * Run by the separate worker (VIDEO_WORKER=external — no time limit) or, without one, right after the request on Vercel.
 */
import { spawn } from 'node:child_process'
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { after } from 'next/server'
import { TAGLINE_SHORT } from '../content/brand'
import type { Article, MediaJob, Video } from '../payload-types'
import { db } from './data'
import { formatDate } from './i18n'
import { endCard, lowerThird, nameTag, type Meta } from './overlays'
import { paths, siteUrl } from './paths'
import { downloadTo, saveFromPath } from './storage'
import { socialArgs, videoSize, watermarkArgs, type Watermark } from './videoArgs'

export type JobKind = MediaJob['kind']
const FFMPEG = () => process.env.FFMPEG_PATH || ffmpegInstaller.path

export const run = (args: string[], timeoutMs: number) =>
  new Promise<{ code: number | null; err: string }>((resolve) => {
    const p = spawn(FFMPEG(), args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => (err = (err + d).slice(-20_000)))
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs)
    p.on('close', (code) => (clearTimeout(timer), resolve({ code, err })))
    p.on('error', (e) => (clearTimeout(timer), resolve({ code: -1, err: String(e) })))
  })
const fail = (what: string, r: { code: number | null; err: string }) =>
  new Error(`${what} (${r.code}): ${r.err.split('\n').filter(Boolean).slice(-3).join(' | ').slice(0, 300)}`)

/** Duration, displayed size and whether there is a sound track. */
export async function probe(file: string) {
  const r = await run(['-hide_banner', '-i', file], 30_000) // exits 1 ("no output"), the info is on stderr
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(r.err)
  return { durationSec: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0, size: videoSize(r.err), hasAudio: /Stream #\d+:\d+.*Audio:/.test(r.err) }
}

// ── queue ────────────────────────────────────────────────────────────────────────────────
export async function enqueue(kind: JobKind, videoId: number, params?: Record<string, unknown>) {
  const payload = await db()
  const open = await payload.find({
    collection: 'media-jobs',
    where: { and: [{ video: { equals: videoId } }, { kind: { equals: kind } }, { status: { in: ['queued', 'running'] } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (open.docs[0]?.status === 'queued') return payload.update({ collection: 'media-jobs', id: open.docs[0].id, data: { params }, overrideAccess: true })
  if (open.docs[0]) return open.docs[0] // already running; it will pick up the latest data when re-queued
  return payload.create({ collection: 'media-jobs', data: { kind, video: videoId, status: 'queued', attempts: 0, params }, overrideAccess: true })
}

/** Without the external worker, process right after the response (Vercel: up to ~270 s). */
export function kick() {
  if (process.env.VIDEO_WORKER === 'external') return
  after(() => runPending(270_000))
}

async function claim(): Promise<MediaJob | null> {
  const payload = await db()
  const stale = new Date(Date.now() - 20 * 60_000).toISOString()
  const next = await payload.find({
    collection: 'media-jobs',
    where: { or: [{ status: { equals: 'queued' } }, { and: [{ status: { equals: 'running' } }, { lockedAt: { less_than: stale } }] }] },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const j = next.docs[0]
  if (!j) return null
  // Optimistic lock: only one worker wins the update while updatedAt is unchanged.
  const res = await payload.update({
    collection: 'media-jobs',
    where: { and: [{ id: { equals: j.id } }, { updatedAt: { equals: j.updatedAt } }] },
    data: { status: 'running', lockedAt: new Date().toISOString(), attempts: (j.attempts || 0) + 1, error: null },
    overrideAccess: true,
  })
  return (res.docs[0] as MediaJob) ?? null
}

export async function runPending(budgetMs: number) {
  const t0 = Date.now()
  while (Date.now() - t0 < budgetMs - 20_000) {
    const job = await claim()
    if (!job) return
    await runJob(job, budgetMs - (Date.now() - t0))
  }
}

export async function runJob(job: MediaJob, budgetMs = 30 * 60_000) {
  const payload = await db()
  const videoId = typeof job.video === 'object' ? job.video.id : job.video
  try {
    if (job.kind === 'web') await webVersion(videoId, budgetMs)
    else if (job.kind === 'social' || job.kind === 'vertical') await socialVersion(videoId, job.kind, budgetMs)
    else if (job.kind === 'flash') await (await import('./flashVideo')).flashVersion(videoId, job.params as never, budgetMs)
    await payload.update({ collection: 'media-jobs', id: job.id, data: { status: 'done', error: null }, overrideAccess: true })
  } catch (e) {
    const error = String((e as Error).message || e).slice(0, 400)
    const final = (job.attempts || 1) >= 3
    await payload.update({ collection: 'media-jobs', id: job.id, data: { status: final ? 'failed' : 'queued', error }, overrideAccess: true })
    if (job.kind === 'web' && final) await setVideo(videoId, { processing: 'failed', processError: error }).catch(() => {})
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────────────────
export async function setVideo(id: number, data: Record<string, unknown>) {
  const payload = await db()
  const cur = await payload.findByID({ collection: 'videos', id, depth: 0, draft: true })
  const published = cur._status === 'published'
  await payload.update({ collection: 'videos', id, data: { ...data, _status: cur._status } as never, draft: !published, overrideAccess: true })
}

export async function workDir(id: number) {
  const dir = path.join(os.tmpdir(), `prahari-video-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
  await mkdir(dir, { recursive: true })
  return dir
}

/** The official logo (Site Settings → Video watermark → logo, else the bundled round logo) as a local PNG file. */
export async function logoFile(dir: string, wm: { logo?: { url?: string | null } | number | null }) {
  const out = path.join(dir, 'logo.png')
  const logo = wm.logo && typeof wm.logo === 'object' && wm.logo.url
  if (logo) await downloadTo(logo.startsWith('http') || logo.startsWith('/api/') ? logo : `${process.env.NEXT_PUBLIC_SITE_URL}${logo}`, out)
  else await copyFile(path.join(process.cwd(), 'public', 'logo-watermark.png'), out)
  return out
}

async function settings() {
  return (await (await db()).findGlobal({ slug: 'site-settings', depth: 1, locale: 'hi' })) as { siteName?: string; descriptor?: string; videoWatermark?: Watermark & { logo?: { url?: string } | number | null } }
}

/** Headline / reporter / place / date / News ID come from the master news record when there is one. */
export async function metaFor(v: Video): Promise<Meta> {
  const payload = await db()
  const s = await settings()
  const aId = typeof v.article === 'object' ? v.article?.id : v.article
  const a = aId ? ((await payload.findByID({ collection: 'articles', id: aId, depth: 0, draft: true, locale: 'hi' }).catch(() => null)) as Article | null) : null
  const when = a?.firstPublishedAt || a?.publishedAt || v.publishedAt || v.eventDate
  return {
    headline: a?.title || v.title,
    reporter: a?.reporterName || v.reporterName,
    location: a?.location || v.location,
    date: when ? formatDate(when, 'hi') : null,
    newsId: a?.newsId,
    siteName: s.siteName || 'राष्ट्रीय पारदर्शिता प्रहरी',
    url: a?.newsId ? `${siteUrl()}${paths.newsShort(a.newsId)}`.replace(/^https?:\/\//, '') : new URL(siteUrl()).host,
    tagline: TAGLINE_SHORT,
    descriptor: s.descriptor,
  }
}

// ── web version ──────────────────────────────────────────────────────────────────────────
async function webVersion(id: number, budgetMs: number) {
  const started = Date.now()
  const payload = await db()
  const v = await payload.findByID({ collection: 'videos', id, depth: 0, draft: true })
  if (!v.originalUrl) throw new Error('no original file')
  await setVideo(id, { processing: 'processing', processError: null })
  const dir = await workDir(id)
  try {
    const input = path.join(dir, `in${path.extname(new URL(v.originalUrl.replace(/^s3:/, 'https://x/'), 'http://x').pathname) || '.mp4'}`)
    const output = path.join(dir, 'out.mp4')
    const poster = path.join(dir, 'poster.jpg')
    const s = await settings()
    const wm = s.videoWatermark || {}
    await downloadTo(v.originalUrl, input)
    const info = await probe(input)
    const still = (ss: string) => run(['-y', '-ss', ss, '-i', input, '-frames:v', '1', '-vf', "scale='min(1280,iw)':-2", '-q:v', '4', poster], 60_000)
    if ((await still(info.durationSec > 2 ? '1' : '0')).code !== 0) await still('0')

    let processedUrl = v.originalUrl
    if (wm.enabled !== false) {
      const logo = await logoFile(dir, wm)
      const r = await run(watermarkArgs(input, logo, output, wm, info.size?.w), Math.max(20_000, budgetMs - (Date.now() - started) - 10_000))
      if (r.code !== 0) throw fail('ffmpeg failed', r)
      processedUrl = await saveFromPath(`videos/published/${id}-${Date.now()}.mp4`, output, 'video/mp4')
    }
    const posterUrl = await stat(poster).then(() => saveFromPath(`videos/posters/${id}-${Date.now()}.jpg`, poster, 'image/jpeg')).catch(() => undefined)
    await setVideo(id, {
      processing: 'ready',
      processError: null,
      processedUrl,
      posterUrl,
      durationSec: Math.round(info.durationSec) || undefined,
      width: info.size?.w,
      height: info.size?.h,
      hasAudio: info.hasAudio,
      sizeBytes: (await stat(output).catch(() => null))?.size,
    })
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

// ── social-ready versions ────────────────────────────────────────────────────────────────
async function socialVersion(id: number, kind: 'social' | 'vertical', budgetMs: number) {
  const payload = await db()
  const v = (await payload.findByID({ collection: 'videos', id, depth: 0, draft: true })) as Video
  if (!v.originalUrl) throw new Error('no original file')
  const [W, H] = kind === 'social' ? [1920, 1080] : [1080, 1920]
  const dir = await workDir(id)
  try {
    const input = path.join(dir, 'in.mp4')
    await downloadTo(v.originalUrl, input)
    const info = await probe(input)
    const meta = await metaFor(v)
    const logo = await logoFile(dir, (await settings()).videoWatermark || {})
    const lower = await lowerThird(meta, W)
    const files = {
      tag: path.join(dir, 'tag.png'),
      lower: path.join(dir, 'lower.png'),
      end: path.join(dir, 'end.png'),
      out: path.join(dir, 'social.mp4'),
    }
    await writeFile(files.tag, await nameTag(meta, W))
    await writeFile(files.lower, lower)
    await writeFile(files.end, await endCard(meta, W, H, await readFile(logo)))
    const { default: sharp } = await import('sharp')
    const lowerH = (await sharp(lower).metadata()).height || 0
    const args = socialArgs(input, logo, files.tag, files.lower, files.end, { W, H, src: info.size, durationSec: Math.max(1, info.durationSec), hasAudio: info.hasAudio, lowerH, out: files.out })
    const r = await run(args, Math.max(60_000, budgetMs - 15_000))
    if (r.code !== 0) throw fail('social export failed', r)
    const url = await saveFromPath(`videos/social/${id}-${kind}-${Date.now()}.mp4`, files.out, 'video/mp4')
    await setVideo(id, kind === 'social' ? { socialUrl: url } : { verticalUrl: url })
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/** Kept for older callers: queue the website version and start processing. */
export async function processVideo(id: number) {
  await enqueue('web', id)
  await runPending(270_000)
}
