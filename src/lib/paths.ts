import type { Lang } from './i18n'

const enc = (s?: string | null) => encodeURIComponent(s || '')
export const paths = {
  home: (l: Lang) => `/${l}`,
  article: (l: Lang, slug?: string | null) => `/${l}/news/${enc(slug)}`,
  category: (l: Lang, slug?: string | null) => `/${l}/section/${enc(slug)}`,
  tag: (l: Lang, slug?: string | null) => `/${l}/tag/${enc(slug)}`,
  author: (l: Lang, slug?: string | null) => `/${l}/author/${enc(slug)}`,
  page: (l: Lang, slug?: string | null) => `/${l}/${enc(slug)}`,
  search: (l: Lang, q?: string) => `/${l}/search${q ? `?q=${enc(q)}` : ''}`,
  corrections: (l: Lang) => `/${l}/corrections`,
  submit: (l: Lang) => `/${l}/submit-issue`,
  appointment: (l: Lang) => `/${l}/appointment`,
  contact: (l: Lang) => `/${l}/contact`,
  team: (l: Lang) => `/${l}/team`,
  epaper: (l: Lang, date?: string) => `/${l}/epaper${date ? `/${date}` : ''}`,
  videos: (l: Lang) => `/${l}/videos`,
  video: (l: Lang, slug?: string | null) => `/${l}/video/${enc(slug)}`,
  /** Permanent short link (used by QR codes and share links). Language-neutral. */
  newsShort: (newsId: string) => `/n/${encodeURIComponent(newsId)}`,
}

/** Route params may arrive percent-encoded (Devanagari slugs). */
export const decodeSlug = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
