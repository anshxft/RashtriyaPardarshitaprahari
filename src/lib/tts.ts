/**
 * Female Hindi voice for the approved Flash script. The provider is chosen by configuration only (no keys in code):
 *   TTS_PROVIDER=google  + GOOGLE_TTS_API_KEY            (voice TTS_VOICE, default hi-IN-Neural2-A, female)
 *   TTS_PROVIDER=azure   + AZURE_SPEECH_KEY + AZURE_SPEECH_REGION   (default hi-IN-SwaraNeural, female)
 * The text spoken is ALWAYS the editor's approved script; the pronunciation dictionary only changes how a word is
 * pronounced (speech only — the displayed text never changes). Nothing is ever added to the script.
 */
import { createHash } from 'node:crypto'

export type VoiceSettings = { rate?: number | null; volume?: number | null; pauseMs?: number | null }
export type Pronunciation = { word: string; speakAs: string }

export const ttsProvider = (): 'google' | 'azure' | null => {
  const p = (process.env.TTS_PROVIDER || '').toLowerCase()
  if (p === 'google' && process.env.GOOGLE_TTS_API_KEY) return 'google'
  if (p === 'azure' && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return 'azure'
  return null
}
const voiceName = (p: 'google' | 'azure') => process.env.TTS_VOICE || (p === 'google' ? 'hi-IN-Neural2-A' : 'hi-IN-SwaraNeural')

export const QUOTA_NOTE =
  process.env.TTS_QUOTA_NOTE ||
  'Google: हर महीने लगभग 10 लाख अक्षर मुफ़्त (Neural2/WaveNet), उसके बाद शुल्क। Azure: लगभग 5 लाख अक्षर/माह मुफ़्त। एक बार बनी आवाज़ दोबारा नहीं बनती (कैश), जब तक स्क्रिप्ट या सेटिंग न बदले।'

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const isLetter = (c: string | undefined) => !!c && /[\p{L}\p{M}\p{N}]/u.test(c)

/** Pure: apply speech-only replacements on whole words (Devanagari-aware word boundaries). */
export function applyPronunciations(text: string, dict: Pronunciation[]): string {
  let out = text
  for (const { word, speakAs } of [...dict].sort((a, b) => b.word.length - a.word.length)) {
    if (!word.trim() || !speakAs.trim()) continue
    let i = 0
    let res = ''
    for (let at = out.indexOf(word); at !== -1; at = out.indexOf(word, at + word.length)) {
      if (isLetter(out[at - 1]) || isLetter(out[at + word.length])) continue
      res += out.slice(i, at) + speakAs
      i = at + word.length
    }
    out = res + out.slice(i)
  }
  return out
}

/** Pure: SSML with the editor's pauses between sentences, speed and volume. */
export function toSsml(script: string, s: VoiceSettings, dict: Pronunciation[], provider: 'google' | 'azure' = 'google'): string {
  const spoken = applyPronunciations(script.trim(), dict)
  const sentences = spoken.split(/(?<=[।!?.])\s+/).map((x) => x.trim()).filter(Boolean)
  const pause = Math.max(0, Math.min(2000, s.pauseMs ?? 400))
  const body = sentences.map(xml).join(pause ? ` <break time="${pause}ms"/> ` : ' ')
  const rate = `${Math.round((s.rate || 1) * 100)}%`
  const volume = provider === 'azure' ? `${Math.max(10, Math.min(100, s.volume ?? 100))}` : 'medium'
  const inner = `<prosody rate="${rate}" volume="${volume}">${body}</prosody>`
  return provider === 'azure'
    ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="${voiceName('azure')}">${inner}</voice></speak>`
    : `<speak>${inner}</speak>`
}

/** Cache key: same script + same voice settings + same dictionary = same audio (never regenerated). */
export function ttsKey(script: string, s: VoiceSettings, dict: Pronunciation[], provider: string | null = ttsProvider()): string {
  return createHash('sha256')
    .update(JSON.stringify([provider, provider && voiceName(provider as 'google'), script.trim(), s.rate || 1, s.volume ?? 100, s.pauseMs ?? 400, dict.map((d) => [d.word, d.speakAs])]))
    .digest('hex')
    .slice(0, 32)
}

/** MP3 bytes from the configured provider. */
export async function synthesize(script: string, s: VoiceSettings, dict: Pronunciation[]): Promise<Buffer> {
  const p = ttsProvider()
  if (!p) throw new Error('TTS provider not configured')
  if (p === 'google') {
    const vol = Math.max(10, Math.min(100, s.volume ?? 100))
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY!)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { ssml: toSsml(script, s, dict, 'google') },
        voice: { languageCode: 'hi-IN', name: voiceName('google') },
        audioConfig: { audioEncoding: 'MP3', volumeGainDb: Math.round(20 * Math.log10(vol / 100) * 10) / 10, sampleRateHertz: 24000 },
      }),
    })
    const j = (await res.json()) as { audioContent?: string; error?: { message?: string } }
    if (!res.ok || !j.audioContent) throw new Error(`Google TTS: ${j.error?.message || res.status}`)
    return Buffer.from(j.audioContent, 'base64')
  }
  const res = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!, 'content-type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3', 'user-agent': 'prahari' },
    body: toSsml(script, s, dict, 'azure'),
  })
  if (!res.ok) throw new Error(`Azure TTS: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return Buffer.from(await res.arrayBuffer())
}
