import { NextResponse } from 'next/server'
import { publicArticleWhere } from '@/collections/Articles'
import { db } from '@/lib/data'
import { paths } from '@/lib/paths'

export const dynamic = 'force-dynamic'

/** Permanent short link (QR codes + share links): /n/NTP-2026-09-30-0001 → the story's page. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id).toUpperCase().slice(0, 40)
  const res = await (await db()).find({ collection: 'articles', where: { and: [publicArticleWhere(), { newsId: { equals: id } }] }, limit: 1, depth: 0, select: { slug: true } })
  const slug = res.docs[0]?.slug
  if (!slug) return new Response('Story not found', { status: 404 })
  return NextResponse.redirect(new URL(paths.article('hi', slug), req.url), 308)
}
