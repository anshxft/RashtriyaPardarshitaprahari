import { notFound } from 'next/navigation'
import { NewsEditor } from '@/components/desk/NewsEditor'
import { currentUser } from '@/lib/auth'
import { categoryOptions, loadForm, mayPublish, teamOptions, todaysEdition } from '@/lib/deskData'

export const metadata = { title: 'खबर संपादित करें' }

export default async function EditNews({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params
  const locale = (await searchParams).lang === 'en' ? 'en' : 'hi'
  const user = (await currentUser())!
  const [loaded, categories, team, edition] = await Promise.all([loadForm(id, locale, user), categoryOptions(), teamOptions(), todaysEdition(locale)])
  if (!loaded) notFound()
  return (
    <NewsEditor
      key={`${id}-${locale}`}
      initial={loaded.form}
      locale={locale}
      categories={categories}
      team={team}
      edition={edition}
      mayPublish={mayPublish(user)}
      reference={locale === 'en' ? loaded.hi : undefined}
    />
  )
}
