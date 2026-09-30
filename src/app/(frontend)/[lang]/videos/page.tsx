/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'
import { pageNum } from '@/components/Listing'
import { Pagination } from '@/components/ui'
import { videoThumb } from '@/components/VideoPlayer'
import { getVideos } from '@/lib/data'
import { assertLang, formatDate, t } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).videos }
}

const dur = (s?: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '')

export default async function VideosPage({ params, searchParams }: Props) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  const page = pageNum((await searchParams).page)
  const res = await getVideos(lang, { limit: 12, page })
  return (
    <div>
      <h1 className="mb-6 border-b-4 border-gold-400 pb-4 font-display text-3xl font-extrabold text-navy-900 md:text-4xl dark:text-gold-300">🎬 {d.videos}</h1>
      {res.docs.length === 0 ? (
        <p className="py-12 text-center text-muted">{d.noResults}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {res.docs.map((v) => {
            const thumb = videoThumb(v)
            return (
              <article key={v.id} className="group relative">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-navy-900">
                  {thumb && <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />}
                  <span className="absolute inset-0 flex items-center justify-center text-5xl text-white/90 drop-shadow">▶</span>
                  {v.durationSec ? <span className="absolute right-2 bottom-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-bold text-white">{dur(v.durationSec)}</span> : null}
                </div>
                <h2 className="mt-2 font-display text-lg leading-snug font-bold">
                  <Link href={paths.video(lang, v.slug)} className="after:absolute after:inset-0 hover:text-navy-700 dark:hover:text-gold-300">
                    {v.title}
                  </Link>
                </h2>
                <p className="text-xs text-muted">{[v.location, formatDate(v.publishedAt, lang)].filter(Boolean).join(' · ')}</p>
              </article>
            )
          })}
        </div>
      )}
      <Pagination page={page} totalPages={res.totalPages} base={paths.videos(lang)} lang={lang} />
    </div>
  )
}
