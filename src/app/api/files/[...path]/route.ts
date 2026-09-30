import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { currentUser } from '@/lib/auth'
import { localPath } from '@/lib/storage'

export const dynamic = 'force-dynamic'
const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska', '.m4v': 'video/x-m4v', '.jpg': 'image/jpeg', '.png': 'image/png' }

/** Local-only file server with Range support (so videos can seek). Originals need a login; published files are public. */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.map(decodeURIComponent).join('/')
  if (rel.startsWith('videos/original/') && !(await currentUser())) return new Response('Login required', { status: 401 })
  let file: string
  try {
    file = localPath(rel)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) return new Response('Not found', { status: 404 })
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase()
  const type = TYPES[ext] || 'application/octet-stream'
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '')
  const start = range?.[1] ? Number(range[1]) : 0
  const end = range?.[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1
  const body = Readable.toWeb(createReadStream(file, range ? { start, end } : undefined)) as ReadableStream
  const headers: Record<string, string> = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600' }
  if (range) return new Response(body, { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': String(end - start + 1) } })
  return new Response(body, { headers: { ...headers, 'Content-Length': String(info.size) } })
}
