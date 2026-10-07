import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { asMedia, db } from '@/lib/data'
import { downloadName } from '@/lib/fileName'
import { lexicalToText } from '@/lib/lexical'
import { allowed, loadPermissions } from '@/lib/permissions'
import { paths, siteUrl } from '@/lib/paths'
import { LOCAL_PREFIX, localPath, presignGet, S3_PREFIX } from '@/lib/storage'
import type { Article, Video } from '@/payload-types'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

export const dynamic = 'force-dynamic'

const attachment = (name: string) => `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`

/**
 * Editor/Admin downloads. Checked on the SERVER for every request (login + 2-step + "Download" right), recorded in the
 * audit log, served with a safe file name that carries the News ID. Public visitors get 403 — there is no public link.
 *   ?id=<article>&kind=copy   → published copy (UTF-8 text)
 *   ?id=<article>&kind=photo  → the story's photo / thumbnail
 *   ?video=<video>&kind=original|published|social|vertical|flash|thumbnail → video files: private storage answers only
 *     through a signed link valid 5 minutes, saved as NTP-ID_headline_date[_kind].mp4
 */
export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'login required' }, { status: 401 })
  const payload = await db()
  await loadPermissions(payload)
  if (!allowed(user, 'download')) return NextResponse.json({ error: 'not allowed' }, { status: 403 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  if (url.searchParams.get('video')) return videoDownload(Number(url.searchParams.get('video')), kind || '', user, payload, req)
  const id = Number(url.searchParams.get('id'))
  const a = Number.isFinite(id) ? await payload.findByID({ collection: 'articles', id, depth: 1, draft: true, locale: 'hi' }).catch(() => null) : null
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const date = a.firstPublishedAt || a.publishedAt
  const link = a.newsId ? `${siteUrl()}${paths.newsShort(a.newsId)}` : `${siteUrl()}${paths.article('hi', a.slug)}`

  let res: Response
  if (kind === 'copy') {
    const body = [
      a.title,
      a.subheadline || '',
      '',
      [a.reporterName && `रिपोर्ट: ${a.reporterName}`, a.location, date && new Date(date).toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' })].filter(Boolean).join(' | '),
      '',
      lexicalToText(a.content),
      '',
      '—',
      `News ID: ${a.newsId || '(अभी प्रकाशित नहीं)'}`,
      `मूल खबर / Verify: ${link}`,
      'राष्ट्रीय पारदर्शिता प्रहरी',
    ].join('\n')
    res = new Response('﻿' + body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'content-disposition': attachment(downloadName(a.newsId, a.title, date, 'txt')) } })
  } else if (kind === 'photo') {
    const m = asMedia(a.heroImage)
    const src = m?.url || a.externalImage?.url
    if (!src) return NextResponse.json({ error: 'no photo' }, { status: 404 })
    const file = await fetch(new URL(src, siteUrl()))
    if (!file.ok || !file.body) return NextResponse.json({ error: 'photo unavailable' }, { status: 502 })
    const ext = (m?.mimeType?.split('/')[1] || src.split('?')[0].split('.').pop() || 'jpg').replace('jpeg', 'jpg')
    res = new Response(file.body, { headers: { 'content-type': file.headers.get('content-type') || 'image/jpeg', 'content-disposition': attachment(downloadName(a.newsId, a.title, date, ext)) } })
  } else {
    return NextResponse.json({ error: 'unknown kind' }, { status: 400 })
  }
  await audit(payload, user, { action: 'download', newsId: a.newsId, articleId: a.id, collectionSlug: 'articles', title: a.title, details: { kind } }, req.headers)
  res.headers.set('cache-control', 'private, no-store')
  return res
}

const VIDEO_FIELD = { original: 'originalUrl', published: 'processedUrl', social: 'socialUrl', vertical: 'verticalUrl', flash: 'flashUrl', thumbnail: 'posterUrl' } as const

async function videoDownload(id: number, kind: string, user: NonNullable<Awaited<ReturnType<typeof currentUser>>>, payload: Awaited<ReturnType<typeof db>>, req: Request) {
  const field = VIDEO_FIELD[kind as keyof typeof VIDEO_FIELD]
  const v = Number.isFinite(id) && field ? ((await payload.findByID({ collection: 'videos', id, depth: 0, draft: true }).catch(() => null)) as Video | null) : null
  const stored = v?.[field]
  if (!v || !stored) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const aId = typeof v.article === 'object' ? v.article?.id : v.article
  const a = aId ? ((await payload.findByID({ collection: 'articles', id: aId, depth: 0, draft: true, locale: 'hi' }).catch(() => null)) as Article | null) : null
  const ext = kind === 'thumbnail' ? 'jpg' : 'mp4'
  const base = downloadName(a?.newsId, a?.title || v.title, a?.firstPublishedAt || v.createdAt, ext)
  const name = kind === 'published' ? base : base.replace(`.${ext}`, `_${kind}.${ext}`)
  await audit(payload, user, { action: 'download', newsId: a?.newsId, articleId: a?.id, collectionSlug: 'videos', title: a?.title || v.title, details: { kind, file: name } }, req.headers)
  const headers = { 'cache-control': 'private, no-store' }
  if (stored.startsWith(S3_PREFIX)) return NextResponse.redirect(await presignGet(stored.slice(S3_PREFIX.length), 300, name), { status: 302, headers })
  const type = ext === 'jpg' ? 'image/jpeg' : 'video/mp4'
  if (stored.startsWith(LOCAL_PREFIX)) {
    const file = localPath(decodeURIComponent(stored.slice(LOCAL_PREFIX.length)))
    return new Response(Readable.toWeb(createReadStream(file)) as never, { headers: { ...headers, 'content-type': type, 'content-disposition': attachment(name) } })
  }
  const res = await fetch(stored)
  if (!res.ok || !res.body) return NextResponse.json({ error: 'file unavailable' }, { status: 502 })
  return new Response(res.body, { headers: { ...headers, 'content-type': type, 'content-disposition': attachment(name) } })
}
