import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Devanagari, Noto_Serif_Devanagari } from 'next/font/google'
import type { ReactNode } from 'react'
import { Footer, Header } from '@/components/Chrome'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { officeNumbers } from '@/lib/contact'
import { getSettings } from '@/lib/data'
import { isLang, t, type Lang } from '@/lib/i18n'
import { siteUrl } from '@/lib/paths'
import '../globals.css'

// Body: Noto Sans; headlines: Noto Serif (newspaper look). Both are one variable font file per subset.
// 'optional': on a slow first visit the system Devanagari font is kept instead of a late swap (better LCP); cached afterwards.
const body = Noto_Sans_Devanagari({ subsets: ['devanagari', 'latin'], variable: '--font-noto', display: 'optional' })
const display = Noto_Serif_Devanagari({ subsets: ['devanagari', 'latin'], variable: '--font-head', display: 'swap' })

// Empty list = nothing prerendered at build (no DB needed); pages render on first request, then cached (ISR).
export const generateStaticParams = async () => []
export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: l } = await params
  const lang: Lang = isLang(l) ? l : 'hi'
  const d = t(lang)
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${d.siteName} — ${d.tagline}`, template: `%s | ${d.siteName}` },
    description: d.submitIssueCta,
    openGraph: { siteName: d.siteName, locale: lang === 'hi' ? 'hi_IN' : 'en_IN', type: 'website', images: ['/og-default.jpg'] },
    twitter: { card: 'summary_large_image' },
    alternates: { languages: { hi: '/hi', en: '/en' }, types: { 'application/rss+xml': `/${lang}/feed.xml` } },
  }
}

// Sets the dark class before paint to avoid a flash.
// Light by default; dark only when the reader picked it with the ◐ button (remembered on this device).
const themeScript = `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const lang: Lang = isLang(l) ? l : 'hi' // invalid langs 404 at page level
  const s = await getSettings(lang)
  const wa = s.whatsappButton === false ? [] : officeNumbers(s.offices).filter((n) => n.whatsapp)
  return (
    <html lang={lang} className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <Header lang={lang} />
        <main id="main" className="mx-auto max-w-7xl px-4 pt-6">
          {children}
        </main>
        <Footer lang={lang} />
        <WhatsAppFloat
          numbers={wa}
          text={s.whatsappMessage || (lang === 'hi' ? 'नमस्ते, राष्ट्रीय पारदर्शिता प्रहरी।' : 'Hello, Rashtriya Pardarshita Prahari.')}
          label={lang === 'hi' ? 'व्हाट्सएप्प पर संपर्क करें' : 'Contact us on WhatsApp'}
          choose={lang === 'hi' ? 'किस कार्यालय से बात करनी है?' : 'Which office would you like to reach?'}
        />
      </body>
    </html>
  )
}
