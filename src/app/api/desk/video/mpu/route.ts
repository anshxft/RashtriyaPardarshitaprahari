import { randomBytes } from 'node:crypto'
import { currentUser } from '@/lib/auth'
import { mpuAbort, mpuComplete, mpuCreate, mpuList, presignPart, S3_PREFIX, s3Configured } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * Resumable direct-to-storage upload (S3 multipart). The browser sends the video in parts straight to the private bucket;
 * this route only signs each part. A dropped connection resumes from the last finished part (even after a page reload).
 * Every key lives under videos/original/u<user-id>/, and a person can only touch their own uploads.
 */
export async function POST(req: Request) {
  if (!s3Configured()) return Response.json({ error: 'storage not configured' }, { status: 404 })
  const user = await currentUser()
  if (!user) return Response.json({ error: 'login required' }, { status: 401 })
  const b = (await req.json()) as { action: string; name?: string; type?: string; key?: string; uploadId?: string; partNumber?: number; parts?: { PartNumber: number; ETag: string }[] }
  const mine = `videos/original/u${user.id}/`
  const own = (k?: string) => typeof k === 'string' && k.startsWith(mine) && !k.includes('..')
  try {
    switch (b.action) {
      case 'create': {
        if (!/^video\//.test(b.type || '')) return Response.json({ error: 'only video files' }, { status: 400 })
        const safe = (b.name || 'video.mp4').replace(/[^\w.-]+/g, '_').slice(-80)
        const key = `${mine}${Date.now()}-${randomBytes(4).toString('hex')}-${safe}`
        return Response.json({ key, uploadId: await mpuCreate(key, b.type!) })
      }
      case 'sign':
        if (!own(b.key) || !b.uploadId || !(Number(b.partNumber) >= 1 && Number(b.partNumber) <= 10000)) return Response.json({ error: 'bad request' }, { status: 400 })
        return Response.json({ url: await presignPart(b.key!, b.uploadId, Number(b.partNumber)) })
      case 'list':
        if (!own(b.key) || !b.uploadId) return Response.json({ error: 'bad request' }, { status: 400 })
        return Response.json({ parts: await mpuList(b.key!, b.uploadId) })
      case 'complete':
        if (!own(b.key) || !b.uploadId || !b.parts?.length) return Response.json({ error: 'bad request' }, { status: 400 })
        await mpuComplete(b.key!, b.uploadId, b.parts)
        return Response.json({ stored: `${S3_PREFIX}${b.key}` })
      case 'abort':
        if (own(b.key) && b.uploadId) await mpuAbort(b.key!, b.uploadId)
        return Response.json({ ok: true })
      default:
        return Response.json({ error: 'unknown action' }, { status: 400 })
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
