import { canPublish } from '@/access'
import { EpaperDesigner } from '@/components/epaper/EpaperDesigner'
import { istDate } from '@/lib/articleHooks'
import { currentUser } from '@/lib/auth'
import { getEditionStories, getEpaperAds, getEpaperFillers, getEpaperLayout, listEditions } from '@/lib/epaperData'
import { formatDate } from '@/lib/i18n'

export const metadata = { title: 'ई-पेपर डिज़ाइनर' }
export const dynamic = 'force-dynamic'

/** Desk → ई-पेपर डिज़ाइनर: drag / resize each story and ad on the A3 pages of one edition, then save. */
export default async function EpaperLayoutPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = (await currentUser())!
  if (!canPublish({ user } as never)) return <p className="rounded-xl border border-line bg-bg p-6 text-center text-muted">ई-पेपर डिज़ाइन केवल संपादक / एडमिन बदल सकते हैं।</p>
  const editions = await listEditions()
  const want = (await searchParams).date
  const date = want && /^\d{4}-\d{2}-\d{2}$/.test(want) ? want : editions[0]?.date || istDate(new Date())
  const [stories, ads, fillers, saved] = await Promise.all([getEditionStories('hi', date), getEpaperAds(), getEpaperFillers('hi'), getEpaperLayout(date)])
  const label = (d: string) => formatDate(new Date(`${d}T12:00:00+05:30`).toISOString(), 'hi')
  return (
    <EpaperDesigner
      key={date}
      date={date}
      dateLabel={label(date)}
      editions={editions.map((e) => ({ ...e, label: label(e.date) }))}
      stories={stories}
      ads={ads}
      fillers={fillers}
      saved={saved}
    />
  )
}
