import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { currentUser } from '@/lib/auth'
import { blobConfigured, LOCAL_PREFIX, localPath } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/** Local development only (no Vercel Blob token): stream a video into ./.local-storage. */
export async function PUT(req: Request) {
  if (blobConfigured()) return new Response('Not available', { status: 404 })
  if (!(await currentUser())) return new Response('Login required', { status: 401 })
  const name = (new URL(req.url).searchParams.get('name') || 'video.mp4').replace(/[^\w.-]+/g, '_').slice(-80)
  const rel = `videos/original/${Date.now()}-${name}`
  const dest = localPath(rel)
  await mkdir(path.dirname(dest), { recursive: true })
  await pipeline(Readable.fromWeb(req.body as never), createWriteStream(dest))
  return Response.json({ url: `${LOCAL_PREFIX}${rel}` })
}
