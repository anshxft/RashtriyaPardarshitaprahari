/**
 * Auto-share: one adapter per platform, each switched on only when its official credentials are in the environment.
 * Posts always carry the website link + News ID (the master news stays the source of truth). A failure never blocks
 * publishing: it is logged (share-log), shown to the Admin and can be retried.
 * WhatsApp has NO automatic posting here — only click-to-share links (the official Business Platform needs Meta
 * verification; unofficial automation libraries are not used: ban / terms risk).
 */
import { createHmac, randomBytes } from 'node:crypto'

import { caption, type PlatformId, type ShareItem } from './shareText'
export type { PlatformId, ShareItem }
export { caption, openLink } from './shareText'
type Result = { url?: string; id?: string }

export const PLATFORMS: { id: PlatformId; label: string; env: string[]; auto: boolean }[] = [
  { id: 'telegram', label: 'Telegram', env: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL'], auto: true },
  { id: 'facebook', label: 'Facebook Page', env: ['FB_PAGE_ID', 'FB_PAGE_TOKEN'], auto: true },
  { id: 'instagram', label: 'Instagram', env: ['IG_USER_ID', 'FB_PAGE_TOKEN'], auto: true },
  { id: 'x', label: 'X (Twitter)', env: ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'], auto: true },
  { id: 'whatsapp', label: 'WhatsApp', env: [], auto: false },
]
export const configured = (p: PlatformId) => {
  const def = PLATFORMS.find((x) => x.id === p)!
  return def.auto && def.env.every((k) => Boolean(process.env[k]))
}

const json = async (res: Response) => {
  const j = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || j.ok === false || j.error) throw new Error(`${res.status} ${JSON.stringify(j.error || j.description || j).slice(0, 300)}`)
  return j
}
const GRAPH = 'https://graph.facebook.com/v21.0'

async function telegram(item: ShareItem): Promise<Result> {
  const api = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
  const chat = process.env.TELEGRAM_CHANNEL!
  const text = caption(item, 'telegram')
  const j = item.imageUrl
    ? await json(await fetch(`${api}/sendPhoto`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, photo: item.imageUrl, caption: text }) }))
    : await json(await fetch(`${api}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text }) }))
  const msg = j.result as { message_id?: number } | undefined
  return { id: String(msg?.message_id ?? ''), url: chat.startsWith('@') && msg?.message_id ? `https://t.me/${chat.slice(1)}/${msg.message_id}` : undefined }
}

async function facebook(item: ShareItem): Promise<Result> {
  const page = process.env.FB_PAGE_ID!
  const token = process.env.FB_PAGE_TOKEN!
  const j = item.videoUrl
    ? await json(await fetch(`${GRAPH}/${page}/videos`, { method: 'POST', body: new URLSearchParams({ file_url: item.videoUrl, description: caption(item, 'facebook'), access_token: token }) }))
    : await json(await fetch(`${GRAPH}/${page}/feed`, { method: 'POST', body: new URLSearchParams({ message: caption(item, 'facebook'), link: item.url, access_token: token }) }))
  const id = String(j.id || j.post_id || '')
  return { id, url: id ? `https://www.facebook.com/${id}` : undefined }
}

async function instagram(item: ShareItem): Promise<Result> {
  const user = process.env.IG_USER_ID!
  const token = process.env.FB_PAGE_TOKEN!
  if (!item.imageUrl && !item.videoUrl) throw new Error('Instagram needs a photo or a video')
  const media: Record<string, string> = item.videoUrl ? { media_type: 'REELS', video_url: item.videoUrl } : { image_url: item.imageUrl! }
  const c = await json(await fetch(`${GRAPH}/${user}/media`, { method: 'POST', body: new URLSearchParams({ ...media, caption: caption(item, 'instagram'), access_token: token }) }))
  const creation = String(c.id)
  // Videos are processed by Instagram first: wait until FINISHED (up to ~2 minutes).
  for (let i = 0; item.videoUrl && i < 24; i++) {
    const s = await json(await fetch(`${GRAPH}/${creation}?fields=status_code&access_token=${encodeURIComponent(token)}`))
    if (s.status_code === 'FINISHED') break
    if (s.status_code === 'ERROR') throw new Error('Instagram could not process the video')
    await new Promise((r) => setTimeout(r, 5000))
  }
  const p = await json(await fetch(`${GRAPH}/${user}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: creation, access_token: token }) }))
  return { id: String(p.id) }
}

/** OAuth 1.0a request signature (X API, user context). */
export function oauth1Header(method: string, url: string, keys: { key: string; secret: string; token: string; tokenSecret: string }, nonce = randomBytes(16).toString('hex'), ts = Math.floor(Date.now() / 1000)) {
  const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  const params: Record<string, string> = { oauth_consumer_key: keys.key, oauth_nonce: nonce, oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: String(ts), oauth_token: keys.token, oauth_version: '1.0' }
  const base = [method.toUpperCase(), enc(url), enc(Object.keys(params).sort().map((k) => `${enc(k)}=${enc(params[k])}`).join('&'))].join('&')
  params.oauth_signature = createHmac('sha1', `${enc(keys.secret)}&${enc(keys.tokenSecret)}`).update(base).digest('base64')
  return `OAuth ${Object.keys(params).sort().map((k) => `${enc(k)}="${enc(params[k])}"`).join(', ')}`
}

async function x(item: ShareItem): Promise<Result> {
  const url = 'https://api.x.com/2/tweets'
  const auth = oauth1Header('POST', url, { key: process.env.X_API_KEY!, secret: process.env.X_API_SECRET!, token: process.env.X_ACCESS_TOKEN!, tokenSecret: process.env.X_ACCESS_SECRET! })
  const j = await json(await fetch(url, { method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify({ text: caption(item, 'x') }) }))
  const id = String((j.data as { id?: string })?.id || '')
  return { id, url: id ? `https://x.com/i/web/status/${id}` : undefined }
}

export async function postTo(p: PlatformId, item: ShareItem): Promise<Result> {
  if (!configured(p)) throw new Error('not configured')
  switch (p) {
    case 'telegram':
      return telegram(item)
    case 'facebook':
      return facebook(item)
    case 'instagram':
      return instagram(item)
    case 'x':
      return x(item)
    default:
      throw new Error('manual only')
  }
}
