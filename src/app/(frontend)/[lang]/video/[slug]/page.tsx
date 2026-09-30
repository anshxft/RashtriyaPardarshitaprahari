import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShareButtons } from '@/components/client'
import { VideoPlayer, videoPoster } from '@/components/VideoPlayer'
import { getSettings, getVideo, getVideos } from '@/lib/data'
import { assertLang, formatDate, t } from '@/lib/i18n'
import { decodeSlug, paths, siteUrl } from '@/lib/paths'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const v = await getVideo(assertLang(p.lang), decodeSlug(p.slug))
  if (!v) return {}
  const poster = videoPoster(v)
  return { title: v.title, description: v.description || undefined, openGraph: { type: 'video.other', title: v.title, description: v.description || undefined, images: poster ? [poster] : ['/og-default.jpg'] }, robots: v.demoContent ? { index: false } : undefined }
}

export default async function VideoPage({ params }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const d = t(lang)
  const v = await getVideo(lang, decodeSlug(p.slug))
  if (!v) notFound()
  const [settings, more] = await Promise.all([getSettings(lang), getVideos(lang, { limit: 4 })])
  const url = `${siteUrl()}${paths.video(lang, v.slug)}`
  const ld = { '@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: v.description || v.title, uploadDate: v.publishedAt, thumbnailUrl: videoPoster(v), contentUrl: v.processedUrl || v.originalUrl, duration: v.durationSec ? `PT${v.durationSec}S` : undefined }
  const related = more.docs.filter((x) => x.id !== v.id).slice(0, 3)
  return (
    <article className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <p className="mb-2 text-sm text-muted">
        <Link href={paths.videos(lang)} className="hover:underline">
          ← {d.videos}
        </Link>
      </p>
      <h1 className="font-display text-3xl leading-tight font-extrabold text-navy-900 md:text-4xl dark:text-fg">{v.title}</h1>
      <p className="mt-2 text-sm text-muted">{[v.reporterName && `${d.reportBy}: ${v.reporterName}`, v.location && `📍 ${v.location}`, formatDate(v.publishedAt, lang, true)].filter(Boolean).join(' · ')}</p>
      <div className="mt-4">
        <VideoPlayer v={v} wm={settings.videoWatermark || {}} />
      </div>
      {v.description && <p className="mt-4 text-lg leading-relaxed">{v.description}</p>}
      <div className="mt-4">
        <ShareButtons url={url} title={v.title} labels={{ share: d.share, copy: d.copyLink, copied: d.copied }} />
      </div>
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold">{d.videos}</h2>
          <ul className="space-y-2">
            {related.map((x) => (
              <li key={x.id}>
                <Link href={paths.video(lang, x.slug)} className="font-semibold text-link hover:underline">
                  ▶ {x.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
