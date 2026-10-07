/**
 * Big-file storage for videos (and their exports, posters, voice audio).
 *  • S3-compatible PRIVATE bucket (Cloudflare R2 recommended) when S3_* is set: browsers upload straight to it in resumable
 *    parts; files are only ever reachable through short-lived signed links. Stored as "s3:<key>".
 *  • otherwise Vercel Blob (public URLs with random suffixes) on Vercel, or ./.local-storage in development
 *    (served by /api/files/[...path]).
 * Callers keep the stored string and ask resolveUrl() for something a browser can open.
 */
import { createReadStream, createWriteStream } from 'node:fs'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { put } from '@vercel/blob'
import { AwsClient } from 'aws4fetch'

export const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
export const LOCAL_ROOT = path.join(process.cwd(), '.local-storage')
export const LOCAL_PREFIX = '/api/files/'
export const S3_PREFIX = 's3:'

// ── S3 / R2 ───────────────────────────────────────────────────────────────────────────────
const s3env = () => {
  const { S3_ENDPOINT: endpoint, S3_BUCKET: bucket, S3_ACCESS_KEY_ID: accessKeyId, S3_SECRET_ACCESS_KEY: secretAccessKey, S3_REGION: region } = process.env
  return endpoint && bucket && accessKeyId && secretAccessKey ? { endpoint: endpoint.replace(/\/$/, ''), bucket, accessKeyId, secretAccessKey, region: region || 'auto' } : null
}
export const s3Configured = () => Boolean(s3env())
const aws = () => {
  const e = s3env()!
  return new AwsClient({ accessKeyId: e.accessKeyId, secretAccessKey: e.secretAccessKey, service: 's3', region: e.region })
}
/** Path-style object URL (works with R2, Backblaze B2, MinIO, AWS). */
export const objectUrl = (key: string) => {
  const e = s3env()!
  return `${e.endpoint}/${e.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`
}
const attachment = (name: string) => `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`

/** Signed GET link, valid `ttlSec`. With `downloadAs` the browser saves it under that (safe) name. */
export async function presignGet(key: string, ttlSec = 300, downloadAs?: string): Promise<string> {
  const u = new URL(objectUrl(key))
  u.searchParams.set('X-Amz-Expires', String(ttlSec))
  if (downloadAs) u.searchParams.set('response-content-disposition', attachment(downloadAs))
  return (await aws().sign(u.toString(), { method: 'GET', aws: { signQuery: true } })).url
}
/** Signed PUT link for one part of a multipart upload (the browser sends the bytes straight to the bucket). */
export async function presignPart(key: string, uploadId: string, partNumber: number, ttlSec = 3600): Promise<string> {
  const u = new URL(objectUrl(key))
  u.searchParams.set('partNumber', String(partNumber))
  u.searchParams.set('uploadId', uploadId)
  u.searchParams.set('X-Amz-Expires', String(ttlSec))
  return (await aws().sign(u.toString(), { method: 'PUT', aws: { signQuery: true } })).url
}
const xmlAll = (xml: string, tag: string) => [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1])
async function s3(method: string, url: string, body?: string) {
  const res = await aws().fetch(url, { method, body })
  const text = await res.text()
  if (!res.ok) throw new Error(`storage ${method} ${res.status}: ${xmlAll(text, 'Message')[0] || text.slice(0, 200)}`)
  return text
}
export async function mpuCreate(key: string, contentType: string): Promise<string> {
  const u = new URL(objectUrl(key))
  u.searchParams.set('uploads', '')
  const res = await aws().fetch(u.toString().replace('uploads=', 'uploads'), { method: 'POST', headers: { 'content-type': contentType } })
  const text = await res.text()
  if (!res.ok) throw new Error(`storage create ${res.status}: ${text.slice(0, 200)}`)
  return xmlAll(text, 'UploadId')[0]
}
export async function mpuList(key: string, uploadId: string): Promise<{ PartNumber: number; ETag: string }[]> {
  const u = new URL(objectUrl(key))
  u.searchParams.set('uploadId', uploadId)
  const text = await s3('GET', u.toString())
  return xmlAll(text, 'Part').map((p) => ({ PartNumber: Number(xmlAll(p, 'PartNumber')[0]), ETag: xmlAll(p, 'ETag')[0] }))
}
export async function mpuComplete(key: string, uploadId: string, parts: { PartNumber: number; ETag: string }[]) {
  const u = new URL(objectUrl(key))
  u.searchParams.set('uploadId', uploadId)
  const body = `<CompleteMultipartUpload>${parts
    .sort((a, b) => a.PartNumber - b.PartNumber)
    .map((p) => `<Part><PartNumber>${p.PartNumber}</PartNumber><ETag>${p.ETag.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</ETag></Part>`)
    .join('')}</CompleteMultipartUpload>`
  await s3('POST', u.toString(), body)
}
export async function mpuAbort(key: string, uploadId: string) {
  const u = new URL(objectUrl(key))
  u.searchParams.set('uploadId', uploadId)
  await aws().fetch(u.toString(), { method: 'DELETE' })
}

// ── common API ────────────────────────────────────────────────────────────────────────────
/** Resolve a storage-relative path inside LOCAL_ROOT (never outside it). */
export function localPath(rel: string): string {
  const full = path.resolve(LOCAL_ROOT, rel)
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error('bad path')
  return full
}

/** Saves a local file and returns the stored reference (s3:key, Blob URL or /api/files/…). */
export async function saveFromPath(pathname: string, file: string, contentType: string): Promise<string> {
  if (s3Configured()) {
    const size = (await stat(file)).size
    const res = await aws().fetch(objectUrl(pathname), {
      method: 'PUT',
      body: Readable.toWeb(createReadStream(file)) as never,
      headers: { 'content-type': contentType, 'content-length': String(size), 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' },
      // @ts-expect-error — Node fetch needs this for a streamed request body
      duplex: 'half',
    })
    if (!res.ok) throw new Error(`storage PUT ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return `${S3_PREFIX}${pathname}`
  }
  if (blobConfigured()) {
    const b = await put(pathname, createReadStream(file), { access: 'public', contentType, addRandomSuffix: true, multipart: true })
    return b.url
  }
  const dest = localPath(pathname)
  await mkdir(path.dirname(dest), { recursive: true })
  await copyFile(file, dest)
  return `${LOCAL_PREFIX}${pathname}`
}

/** A URL a browser (or ffmpeg) can open right now. Private s3: objects get a signed link valid `ttlSec`. */
export async function resolveUrl(stored: string | null | undefined, ttlSec = 6 * 3600, downloadAs?: string): Promise<string | undefined> {
  if (!stored) return undefined
  if (stored.startsWith(S3_PREFIX)) return s3Configured() ? presignGet(stored.slice(S3_PREFIX.length), ttlSec, downloadAs) : undefined
  return stored
}

export async function downloadTo(url: string, dest: string): Promise<void> {
  if (url.startsWith(LOCAL_PREFIX)) return copyFile(localPath(decodeURIComponent(url.slice(LOCAL_PREFIX.length))), dest)
  const src = (await resolveUrl(url, 3600)) || url
  const res = await fetch(src.startsWith('/') ? `${process.env.NEXT_PUBLIC_SITE_URL}${src}` : src)
  if (!res.ok || !res.body) throw new Error(`download failed (${res.status})`)
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest))
}
