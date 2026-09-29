import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Listing, pageNum } from '@/components/Listing'
import { asMedia, getArticles, getBySlug } from '@/lib/data'
import { assertLang } from '@/lib/i18n'
import { decodeSlug, paths } from '@/lib/paths'

export const dynamic = 'force-dynamic' // reads ?page=
type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const a = await getBySlug('authors', assertLang(p.lang), decodeSlug(p.slug))
  return a ? { title: a.name, description: a.bio || undefined } : {}
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  const author = await getBySlug('authors', lang, decodeSlug(p.slug))
  if (!author) notFound()
  const page = pageNum((await searchParams).page)
  const res = await getArticles(lang, { where: { author: { equals: author.id } }, limit: 13, page })
  const photo = asMedia(author.photo)
  return (
    <Listing
      lang={lang}
      title={
        <span className="flex items-center gap-4">
          {photo?.url && <Image src={photo.url} alt="" width={72} height={72} className="h-18 w-18 rounded-full object-cover" />}
          <span>
            {author.name}
            {author.designation && <span className="block text-base font-semibold text-saffron-600">{author.designation}</span>}
          </span>
        </span>
      }
      intro={author.bio}
      docs={res.docs}
      page={page}
      totalPages={res.totalPages}
      base={paths.author(lang, author.slug)}
    />
  )
}
