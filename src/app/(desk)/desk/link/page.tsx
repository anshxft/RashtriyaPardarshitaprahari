import { LinkEditor } from '@/components/desk/LinkEditor'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { categoryOptions, mayPublish } from '@/lib/deskData'

export const metadata = { title: 'लिंक न्यूज़' }

export default async function LinkPage() {
  const user = (await currentUser())!
  const [categories, portal] = await Promise.all([
    categoryOptions(),
    (await db()).find({ collection: 'categories', where: { slug: { equals: 'sambandhit-portal' } }, limit: 1, depth: 0 }),
  ])
  return <LinkEditor categories={categories} defaultCategory={portal.docs[0]?.id ?? null} mayPublish={mayPublish(user)} />
}
