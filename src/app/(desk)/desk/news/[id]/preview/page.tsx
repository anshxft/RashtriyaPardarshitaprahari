/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PreviewTabs } from '@/components/desk/PreviewTabs'
import { currentUser } from '@/lib/auth'
import { cardImage, getArticleForPreview } from '@/lib/data'
import { lexicalToText } from '@/lib/lexical'
import { siteUrl } from '@/lib/paths'

export const metadata = { title: 'प्रीव्यू' }

/** Everything exactly as the public will see it, before publishing: desktop, mobile and the social-share card. */
export default async function DeskPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = (await currentUser())!
  const a = await getArticleForPreview('hi', id, user)
  if (!a) notFound()
  const img = cardImage(a, 'hero')
  const host = new URL(siteUrl()).host
  const desc = a.excerpt || a.subheadline || lexicalToText(a.content).slice(0, 160)
  const social = (
    <div className="mx-auto max-w-lg space-y-4">
      <p className="text-sm text-muted">WhatsApp / Facebook / X पर लिंक भेजने पर कार्ड ऐसा दिखेगा:</p>
      <div className="overflow-hidden rounded-xl border border-line bg-bg shadow">
        {img ? <img src={img.src} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <img src="/og-default.jpg" alt="" className="aspect-[1.91/1] w-full object-cover" />}
        <div className="p-3">
          <p className="text-xs text-muted uppercase">{host}</p>
          <p className="font-bold leading-snug">{a.title}</p>
          {desc && <p className="mt-1 line-clamp-2 text-sm text-muted">{desc}</p>}
        </div>
      </div>
      {a.newsId && <p className="text-sm">News ID: <span className="font-mono">{a.newsId}</span></p>}
    </div>
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-extrabold text-navy-900">👁 प्रीव्यू</h1>
        <Link href={`/desk/news/${id}`} className="ml-auto rounded-full border border-line px-4 py-2 text-sm font-bold">
          ✎ संपादित करें
        </Link>
      </div>
      <p className="font-semibold">{a.title}</p>
      <PreviewTabs src={`/hi/preview/${id}`} social={social} />
    </div>
  )
}
