import type { Layout } from './layout'

export type SaveMode = 'draft' | 'submit' | 'publish' | 'schedule'

export type NewsInput = {
  id?: number
  locale: 'hi' | 'en'
  mode: SaveMode
  format?: string
  title: string
  subheadline?: string
  reporterName?: string
  reporterId?: number | null
  location?: string
  categoryId: number | null
  paragraphs: string[]
  excerpt?: string
  heroImageId?: number | null
  layout: Layout
  scheduleAt?: string // ISO
  editNote?: string
  linkCard?: { url: string; siteName?: string; description?: string; imageUrl?: string }
}

export type SaveResult =
  | {
      ok: true
      id: number
      status: 'draft' | 'submitted' | 'published' | 'scheduled'
      newsId?: string | null
      slug?: string | null
      urls: { web: string; print: string; short?: string; preview: string }
      qrSvg?: string
    }
  | { ok: false; error: string }

export type CategoryOption = { id: number; label: string }
export type TeamOption = { id: number; name: string; designation?: string | null }
