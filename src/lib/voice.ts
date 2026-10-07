import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Article } from '../payload-types'
import { db } from './data'
import { saveFromPath } from './storage'
import { synthesize, ttsKey, ttsProvider, type Pronunciation, type VoiceSettings } from './tts'

export async function dictionary(): Promise<Pronunciation[]> {
  const res = await (await db()).find({ collection: 'pronunciations', limit: 2000, depth: 0, pagination: false, overrideAccess: true, select: { word: true, speakAs: true } })
  return res.docs.map((d) => ({ word: d.word, speakAs: d.speakAs }))
}

/**
 * The voice audio for a script, generated once and cached by (script + settings + dictionary). When `article` is given
 * the cache key/URL are remembered on it, so the export worker and later previews reuse the same file.
 */
export async function voiceAudio(script: string, s: VoiceSettings, article?: Pick<Article, 'id' | 'flash'> | null): Promise<{ key: string; stored: string }> {
  if (!ttsProvider()) throw new Error('TTS provider not configured')
  const dict = await dictionary()
  const key = ttsKey(script, s, dict)
  if (article?.flash?.audioKey === key && article.flash.audioUrl) return { key, stored: article.flash.audioUrl }
  const mp3 = await synthesize(script, s, dict)
  const dir = await mkdtemp(path.join(os.tmpdir(), 'prahari-tts-'))
  try {
    const file = path.join(dir, 'voice.mp3')
    await writeFile(file, mp3)
    const stored = await saveFromPath(`tts/${key}.mp3`, file, 'audio/mpeg')
    if (article) {
      const payload = await db()
      const cur = await payload.findByID({ collection: 'articles', id: article.id, depth: 0, draft: true })
      await payload.update({
        collection: 'articles',
        id: article.id,
        data: { flash: { ...(cur.flash || {}), audioKey: key, audioUrl: stored }, _status: cur._status } as never,
        draft: cur._status !== 'published',
        overrideAccess: true,
        context: { skipAudit: true },
      })
    }
    return { key, stored }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
