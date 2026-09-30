/**
 * Big-file storage for videos. On Vercel: Vercel Blob (public URLs with random suffixes). Locally: ./.local-storage,
 * served by /api/files/[...path]. Callers only see URLs.
 */
import { createReadStream, createWriteStream } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { put } from '@vercel/blob'

export const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
export const LOCAL_ROOT = path.join(process.cwd(), '.local-storage')
export const LOCAL_PREFIX = '/api/files/'

/** Resolve a storage-relative path inside LOCAL_ROOT (never outside it). */
export function localPath(rel: string): string {
  const full = path.resolve(LOCAL_ROOT, rel)
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error('bad path')
  return full
}

export async function saveFromPath(pathname: string, file: string, contentType: string): Promise<string> {
  if (blobConfigured()) {
    const b = await put(pathname, createReadStream(file), { access: 'public', contentType, addRandomSuffix: true, multipart: true })
    return b.url
  }
  const dest = localPath(pathname)
  await mkdir(path.dirname(dest), { recursive: true })
  await copyFile(file, dest)
  return `${LOCAL_PREFIX}${pathname}`
}

export async function downloadTo(url: string, dest: string): Promise<void> {
  if (url.startsWith(LOCAL_PREFIX)) return copyFile(localPath(decodeURIComponent(url.slice(LOCAL_PREFIX.length))), dest)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`download failed (${res.status})`)
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest))
}
