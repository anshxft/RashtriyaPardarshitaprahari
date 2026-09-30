import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/ArticleView'
import { currentUser } from '@/lib/auth'
import { getArticleForPreview } from '@/lib/data'
import { assertLang } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Draft preview for logged-in editors: the same component as the public story page. */
export default async function PreviewArticle({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const p = await params
  const lang = assertLang(p.lang)
  const user = await currentUser()
  if (!user) notFound()
  const a = await getArticleForPreview(lang, p.id, user)
  if (!a) notFound()
  return <ArticleView a={a} lang={lang} preview />
}
