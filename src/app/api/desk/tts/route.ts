import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { resolveUrl } from '@/lib/storage'
import { QUOTA_NOTE, ttsProvider } from '@/lib/tts'
import { voiceAudio } from '@/lib/voice'
import type { Article } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** GET: is a voice provider configured? POST: the voice for the approved script (cached), for the editor's preview. */
export async function GET() {
  if (!(await currentUser())) return Response.json({ error: 'login required' }, { status: 401 })
  return Response.json({ provider: ttsProvider(), note: QUOTA_NOTE })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return Response.json({ error: 'login required' }, { status: 401 })
  if (!ttsProvider()) return Response.json({ error: 'no-provider', note: QUOTA_NOTE }, { status: 501 })
  const b = (await req.json()) as { articleId?: number; script?: string; rate?: number; volume?: number; pauseMs?: number }
  const script = (b.script || '').trim().slice(0, 1200)
  if (!script) return Response.json({ error: 'empty script' }, { status: 400 })
  const article = b.articleId ? ((await (await db()).findByID({ collection: 'articles', id: b.articleId, depth: 0, draft: true, overrideAccess: false, user }).catch(() => null)) as Article | null) : null
  try {
    const { key, stored } = await voiceAudio(script, { rate: b.rate, volume: b.volume, pauseMs: b.pauseMs }, article && article.flash?.script?.trim() === script ? article : null)
    return Response.json({ key, url: await resolveUrl(stored, 3600) })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
