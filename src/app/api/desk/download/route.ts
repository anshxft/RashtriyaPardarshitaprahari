import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { asMedia, db } from '@/lib/data'
import { downloadName } from '@/lib/fileName'
import { lexicalToText } from '@/lib/lexical'
import { allowed, loadPermissions } from '@/lib/permissions'
import { paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic'

const attachment = (name: string) => `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`

/**
 * Editor/Admin downloads. Checked on the SERVER for every request (login + 2-step + "Download" right), recorded in the
 * audit log, served with a safe file name that carries the News ID. Public visitors get 403 — there is no public link.
 *   ?id=<article>&kind=copy   → published copy (UTF-8 text)
 *   ?id=<article>&kind=photo  → the story's photo / thumbnail
 */
export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'login required' }, { status: 401 })
  const payload = await db()
  await loadPermissions(payload)
  if (!allowed(user, 'download')) return NextResponse.json({ error: 'not allowed' }, { status: 403 })

  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))
  const kind = url.searchParams.get('kind')
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
