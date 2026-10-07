/**
 * Browser side of the video upload. Three modes, picked by the server:
 *  • 's3'    resumable multipart straight to the private bucket (R2). Parts of ≥8 MB, 3 at a time, each retried with
 *            back-off; progress is remembered per file, so a dropped 4G/5G connection or a page reload continues where
 *            it stopped (choose the same file again).
 *  • 'blob'  Vercel Blob client upload (multipart with retries, but restarts after a reload)
 *  • 'local' development server
 * Returns the stored reference for the server ("s3:key", a Blob URL or /api/files/…).
 */
import { upload as blobUpload } from '@vercel/blob/client'

export type UploadMode = 's3' | 'blob' | 'local'
type Part = { PartNumber: number; ETag: string }

const api = async <T>(body: Record<string, unknown>): Promise<T> => {
  const r = await fetch('/api/desk/video/mpu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `upload error ${r.status}`)
  return j as T
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const waitOnline = () => (navigator.onLine ? Promise.resolve() : new Promise<void>((r) => window.addEventListener('online', () => r(), { once: true })))

function putPart(url: string, blob: Blob, onBytes: (n: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => onBytes(e.loaded)
    xhr.onload = () => {
      const etag = xhr.getResponseHeader('ETag')
      if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag)
      else reject(new Error(xhr.status ? `part ${xhr.status}${etag ? '' : ' (ETag hidden: bucket CORS must expose ETag)'}` : 'network'))
    }
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(blob)
  })
}

async function s3Upload(file: File, onProgress: (pct: number) => void): Promise<string> {
  const sig = `mpu:${file.name}:${file.size}:${file.lastModified}`
  let saved: { key: string; uploadId: string } | null = null
  try {
    saved = JSON.parse(localStorage.getItem(sig) || 'null')
  } catch {}
  let done = new Map<number, string>()
  if (saved) {
    try {
      done = new Map((await api<{ parts: Part[] }>({ action: 'list', ...saved })).parts.map((p) => [p.PartNumber, p.ETag]))
    } catch {
      saved = null // the unfinished upload expired: start again
    }
  }
  if (!saved) {
    saved = await api<{ key: string; uploadId: string }>({ action: 'create', name: file.name, type: file.type || 'video/mp4' })
    try {
      localStorage.setItem(sig, JSON.stringify(saved))
    } catch {}
  }
  const size = Math.max(8 * 1024 * 1024, Math.ceil(file.size / 9000))
  const count = Math.max(1, Math.ceil(file.size / size))
  const sent = new Map<number, number>()
  for (const n of done.keys()) sent.set(n, Math.min(size, file.size - (n - 1) * size))
  const report = () => onProgress(Math.min(99, Math.round(([...sent.values()].reduce((a, b) => a + b, 0) / file.size) * 100)))
  report()
  const todo = Array.from({ length: count }, (_, i) => i + 1).filter((n) => !done.has(n))
  const worker = async () => {
    for (let n = todo.shift(); n !== undefined; n = todo.shift()) {
      const blob = file.slice((n - 1) * size, Math.min(file.size, n * size))
      for (let attempt = 0; ; attempt++) {
        try {
          await waitOnline()
          const { url } = await api<{ url: string }>({ action: 'sign', ...saved!, partNumber: n })
          const part = n
          done.set(n, await putPart(url, blob, (b) => (sent.set(part, b), report())))
          sent.set(n, blob.size)
          report()
          break
        } catch (e) {
          if (attempt >= 8) throw e
          await sleep(Math.min(30_000, 1000 * 2 ** attempt))
        }
      }
    }
  }
  await Promise.all([worker(), worker(), worker()])
  const { stored } = await api<{ stored: string }>({ action: 'complete', ...saved, parts: [...done.entries()].map(([PartNumber, ETag]) => ({ PartNumber, ETag })) })
  try {
    localStorage.removeItem(sig)
  } catch {}
  onProgress(100)
  return stored
}

export async function uploadVideo(file: File, mode: UploadMode, onProgress: (pct: number) => void): Promise<string> {
  if (mode === 's3') return s3Upload(file, onProgress)
  const pathname = `videos/original/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`
  if (mode === 'blob') {
    const r = await blobUpload(pathname, file, { access: 'public', handleUploadUrl: '/api/desk/video/upload', multipart: true, contentType: file.type || 'video/mp4', onUploadProgress: (p) => onProgress(Math.round(p.percentage)) })
    return r.url
  }
  return new Promise<string>((res, rej) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', `/api/desk/video/local?name=${encodeURIComponent(file.name)}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status === 200 ? res(JSON.parse(xhr.responseText).url) : rej(new Error(xhr.responseText || 'upload failed')))
    xhr.onerror = () => rej(new Error('नेटवर्क त्रुटि'))
    xhr.send(file)
  })
}
