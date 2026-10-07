/**
 * "Final video with Flash + Voice" (Part 3.7): the website version with the red FLASH strip burned in at the chosen
 * interval and the female voice reading the SAME approved script; the original sound is lowered under the voice.
 */
import { rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Article, Video } from '../payload-types'
import { db } from './data'
import { flashStrip } from './overlays'
import { downloadTo, saveFromPath } from './storage'
import { ttsProvider } from './tts'
import { flashArgs, flashTimes } from './videoArgs'
import { probe, run, setVideo, workDir } from './videoProcess'
import { voiceAudio } from './voice'

export async function flashVersion(id: number, _params: Record<string, unknown> | undefined, budgetMs: number): Promise<void> {
  const payload = await db()
  const v = (await payload.findByID({ collection: 'videos', id, depth: 0, draft: true })) as Video
  const aId = typeof v.article === 'object' ? v.article?.id : v.article
  const a = aId ? ((await payload.findByID({ collection: 'articles', id: aId, depth: 0, draft: true, locale: 'hi' })) as Article) : null
  const f = a?.flash
  const script = f?.script?.trim()
  if (!a || !f || !script || !(f.enabled || f.voice)) throw new Error('Flash script / switches missing')
  if (!v.processedUrl) throw new Error('website version not ready')
  const dir = await workDir(id)
  try {
    const input = path.join(dir, 'web.mp4')
    await downloadTo(v.processedUrl, input)
    const info = await probe(input)
    const W = info.size?.w || 1280
    let voice: string | null = null
    let voiceSec = 0
    if (f.voice) {
      if (!ttsProvider()) throw new Error('Voice ON, but no TTS provider is configured (TTS_PROVIDER)')
      const { stored } = await voiceAudio(script, { rate: f.voiceRate, volume: f.voiceVolume, pauseMs: f.pauseMs }, a)
      voice = path.join(dir, 'voice.mp3')
      await downloadTo(stored, voice)
      voiceSec = (await probe(voice)).durationSec
    }
    const strip = path.join(dir, 'strip.png')
    await writeFile(strip, await flashStrip(script, W, f.breaking ? 'BREAKING NEWS' : 'FLASH NEWS'))
    const showSec = Math.max(6, Math.ceil(voiceSec + 1.5))
    const times = flashTimes(info.durationSec, showSec, f.repeat !== false, f.intervalSec || 20)
    const out = path.join(dir, 'flash.mp4')
    const r = await run(flashArgs(input, strip, voice, out, { times, showSec, hasAudio: info.hasAudio, voiceVolume: f.voiceVolume ?? 100 }), Math.max(60_000, budgetMs - 15_000))
    if (r.code !== 0) throw new Error(`flash export failed (${r.code}): ${r.err.split('\n').filter(Boolean).slice(-3).join(' | ').slice(0, 300)}`)
    await setVideo(id, { flashUrl: await saveFromPath(`videos/flash/${id}-${Date.now()}.mp4`, out, 'video/mp4') })
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
