import { NewsEditor } from '@/components/desk/NewsEditor'
import { currentUser } from '@/lib/auth'
import { categoryOptions, emptyForm, mayPublish, teamOptions, todaysEdition } from '@/lib/deskData'

export const metadata = { title: 'नई खबर' }

export default async function NewNews() {
  const user = (await currentUser())!
  const [categories, team, edition] = await Promise.all([categoryOptions(), teamOptions(), todaysEdition('hi')])
  return <NewsEditor initial={emptyForm()} locale="hi" categories={categories} team={team} edition={edition} mayPublish={mayPublish(user)} />
}
