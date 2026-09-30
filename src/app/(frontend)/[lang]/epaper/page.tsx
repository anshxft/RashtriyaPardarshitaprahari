import { redirect } from 'next/navigation'
import { istDate } from '@/lib/articleHooks'
import { listEditions } from '@/lib/epaperData'
import { assertLang } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const dynamic = 'force-dynamic'

/** /hi/epaper → the newest edition that has stories (or today's, if none yet). */
export default async function EpaperIndex({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLang((await params).lang)
  const latest = (await listEditions(1))[0]?.date ?? istDate(new Date())
  redirect(paths.epaper(lang, latest))
}
