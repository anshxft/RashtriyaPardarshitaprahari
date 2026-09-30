import { BreakingManager } from '@/components/desk/BreakingManager'
import { currentUser } from '@/lib/auth'
import { getArticles, db } from '@/lib/data'
import { mayPublish } from '@/lib/deskData'
import { paths } from '@/lib/paths'

export const metadata = { title: 'ब्रेकिंग न्यूज़' }

export default async function BreakingPage() {
  const user = (await currentUser())!
  if (!mayPublish(user)) return <p className="rounded-xl bg-bg p-6 text-center">ब्रेकिंग पट्टी केवल संपादक/एडमिन बदल सकते हैं।</p>
  const payload = await db()
  const [list, recent] = await Promise.all([
    payload.find({ collection: 'breaking-news', locale: 'hi', sort: '-createdAt', limit: 15, depth: 0 }),
    getArticles('hi', { limit: 20 }),
  ])
  return (
    <BreakingManager
      items={list.docs.map((b) => ({ id: b.id, text: b.text, link: b.link, active: Boolean(b.active), expiresAt: b.expiresAt }))}
      stories={recent.docs.map((a) => ({ title: a.title, href: paths.article('hi', a.slug) }))}
    />
  )
}
