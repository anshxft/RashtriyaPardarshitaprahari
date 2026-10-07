import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { canPublish } from '@/access'
import { EpaperBoard } from '@/components/epaper/EpaperBoard'
import { currentUser } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { getEditionStories, getEpaperAd, listEditions } from '@/lib/epaperData'
import { assertLang, formatDate, t } from '@/lib/i18n'

export const dynamic = 'force-dynamic' // depends on who is looking (editors get the layout tools)

type Props = { params: Promise<{ lang: string; date: string }> }
const label = (date: string, lang: 'hi' | 'en') => formatDate(new Date(`${date}T12:00:00+05:30`).toISOString(), lang)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  return { title: `${t(assertLang(p.lang)).epaper} · ${p.date}` }
}

export default async function EpaperPage({ params }: Props) {
  const p = await params
  const lang = assertLang(p.lang)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) notFound()
  const [stories, editions, settings, user, ad] = await Promise.all([getEditionStories(lang, p.date), listEditions(), getSettings(lang), currentUser(), getEpaperAd()])
  return (
    <EpaperBoard
      lang={lang}
      date={p.date}
      dateLabel={label(p.date, lang)}
      siteName={settings.siteName || t(lang).siteName}
      descriptor={settings.descriptor}
      ad={ad}
      stories={stories}
      editions={editions.map((e) => ({ ...e, label: label(e.date, lang) }))}
      canEdit={Boolean(user && canPublish({ user } as never))}
    />
  )
}
