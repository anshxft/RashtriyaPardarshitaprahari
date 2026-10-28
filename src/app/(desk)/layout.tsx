import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Devanagari, Noto_Serif_Devanagari } from 'next/font/google'
import type { ReactNode } from 'react'
import '../(frontend)/globals.css'

const body = Noto_Sans_Devanagari({ subsets: ['devanagari', 'latin'], variable: '--font-noto', display: 'swap' })
const display = Noto_Serif_Devanagari({ subsets: ['devanagari', 'latin'], variable: '--font-head', display: 'swap' })

export const metadata: Metadata = { title: { default: 'प्रहरी डेस्क', template: '%s | प्रहरी डेस्क' }, robots: { index: false, follow: false } }
export const viewport: Viewport = { themeColor: '#0b1f4d', width: 'device-width', initialScale: 1 }

/** Separate root layout for the editors' Desk (its own <html>), so it can never be indexed or inherit the public chrome. */
export default function DeskRoot({ children }: { children: ReactNode }) {
  return (
    <html lang="hi" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen bg-surface font-sans antialiased">{children}</body>
    </html>
  )
}
