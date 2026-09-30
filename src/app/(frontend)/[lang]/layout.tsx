import type { Metadata, Viewport } from 'next'
import { Mukta, Noto_Sans_Devanagari } from 'next/font/google'
import type { ReactNode } from 'react'
import { Footer, Header } from '@/components/Chrome'
import { isLang, t, type Lang } from '@/lib/i18n'
import { siteUrl } from '@/lib/paths'
import '../globals.css'

// Noto = one variable font file per subset; Mukta only in the two heading weights (fewer font downloads → faster LCP).
// 'optional': on a slow first visit the system Devanagari font is kept instead of a late swap (better LCP); cached afterwards.
const body = Noto_Sans_Devanagari({ subsets: ['devanagari', 'latin'], variable: '--font-noto', display: 'optional' })
const display = Mukta({ subsets: ['devanagari', 'latin'], weight: ['700', '800'], variable: '--font-mukta', display: 'swap' })

// Empty list = nothing prerendered at build (no DB needed); pages render on first request, then cached (ISR).
export const generateStaticParams = async () => []
export const viewport: Viewport = { themeColor: '#0b1f4d', width: 'device-width', initialScale: 1 }

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
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const lang: Lang = isLang(l) ? l : 'hi' // invalid langs 404 at page level
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
      </body>
    </html>
  )
}
