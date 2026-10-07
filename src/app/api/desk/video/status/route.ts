import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { videoState } from '@/lib/videoState'
import type { Video } from '@/payload-types'

export const dynamic = 'force-dynamic'

/** Polled by the Desk while a video is being processed. */
export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return new Response('Login required', { status: 401 })
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').map(Number).filter(Boolean).slice(0, 20)
  if (!ids.length) return Response.json([])
  const res = await (await db()).find({ collection: 'videos', where: { id: { in: ids } }, depth: 0, draft: true, overrideAccess: false, user, limit: 20 })
  return Response.json(await Promise.all((res.docs as Video[]).map(videoState)), { headers: { 'cache-control': 'private, no-store' } })
}
