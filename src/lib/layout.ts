/** Newspaper layout presets + resolver. Pure (no server imports) so the Desk, the web page and the e-paper share it. */

export type Ink = 'default' | 'black' | 'navy' | 'red' | 'saffron' | 'green' | 'gray'
export type Size = 'sm' | 'md' | 'lg' | 'xl'
export type PhotoSize = 's' | 'm' | 'l' | 'full'
export type PhotoPos = 'top' | 'left' | 'right'
export type Align = 'left' | 'center' | 'justify'

export type Layout = {
  template?: string | null
  columns?: number | null
  inEpaper?: boolean | null
  epaperPage?: number | null
  epaperOrder?: number | null
  autoFit?: boolean | null
  bodyScale?: number | null
  headlineSize?: Size | null
  headlineInk?: Ink | null
  subheadlineSize?: Size | null
  subheadlineInk?: Ink | null
  reporterSize?: Size | null
  reporterInk?: Ink | null
  align?: Align | null
  photoSize?: PhotoSize | null
  photoPos?: PhotoPos | null
}

type Preset = { hi: string; en: string; columns: number; headlineSize: Size; photoSize: PhotoSize; photoPos: PhotoPos; noPhoto?: boolean; blurb: string }

/** The six ready-made templates. The editor only picks one and pastes. */
export const TEMPLATES: Record<string, Preset> = {
  '1': { hi: 'सामान्य खबर', en: 'Normal story', columns: 2, headlineSize: 'md', photoSize: 's', photoPos: 'top', blurb: '2 कॉलम · छोटी फोटो' },
  '2': { hi: 'बड़ी खबर', en: 'Big story', columns: 3, headlineSize: 'lg', photoSize: 'l', photoPos: 'top', blurb: '3 कॉलम · बड़ी हेडलाइन' },
  '3': { hi: 'लीड / मुख्य खबर', en: 'Lead story', columns: 4, headlineSize: 'xl', photoSize: 'full', photoPos: 'top', blurb: '4 कॉलम · सबसे बड़ी हेडलाइन और फोटो' },
  '4': { hi: 'फोटो वाली खबर', en: 'Story with photo', columns: 2, headlineSize: 'md', photoSize: 'm', photoPos: 'left', blurb: 'फोटो बाएं, टेक्स्ट दाएं' },
  '5': { hi: 'बिना फोटो की खबर', en: 'Story without photo', columns: 2, headlineSize: 'md', photoSize: 'm', photoPos: 'top', noPhoto: true, blurb: 'पूरा टेक्स्ट, कोई फोटो नहीं' },
  '6': { hi: 'लिंक आधारित खबर', en: 'Link-based item', columns: 1, headlineSize: 'md', photoSize: 's', photoPos: 'top', blurb: 'दूसरे पोर्टल का लिंक कार्ड' },
}

/** Named inks only (no free colours) so a layout can never inject CSS. Light variants are for dark backgrounds. */
export const INK: Record<Ink, string> = {
  default: 'inherit',
  black: '#111111',
  navy: '#0b1f4d',
  red: '#b3170f',
  saffron: '#c25a00',
  green: '#0b6b12',
  gray: '#4a5568',
}
export const INK_OPTIONS = Object.keys(INK) as Ink[]

export type ResolvedLayout = {
  template: string
  columns: number
  inEpaper: boolean
  epaperPage: number | null
  epaperOrder: number | null
  autoFit: boolean
  bodyScale: number
  headlineSize: Size
  headlineInk: Ink
  subheadlineSize: Size
  subheadlineInk: Ink
  reporterSize: Size
  reporterInk: Ink
  align: Align
  photoSize: PhotoSize
  photoPos: PhotoPos
  /** Only true when the story really has a photo AND the template allows one. No empty photo frame, ever. */
  showPhoto: boolean
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function resolveLayout(l: Layout | null | undefined, opts: { hasPhoto: boolean; format?: string | null }): ResolvedLayout {
  const template = opts.format === 'link' ? '6' : l?.template && TEMPLATES[l.template] ? l.template : '1'
  const p = TEMPLATES[template]
  return {
    template,
    columns: clamp(Math.round(l?.columns ?? p.columns), 1, 4),
    inEpaper: l?.inEpaper ?? true,
    epaperPage: l?.epaperPage || null,
    epaperOrder: l?.epaperOrder ?? null,
    autoFit: l?.autoFit ?? true,
    bodyScale: clamp(l?.bodyScale ?? 100, 75, 130),
    headlineSize: l?.headlineSize || p.headlineSize,
    headlineInk: l?.headlineInk || 'default',
    subheadlineSize: l?.subheadlineSize || 'md',
    subheadlineInk: l?.subheadlineInk || 'default',
    reporterSize: l?.reporterSize || 'sm',
    reporterInk: l?.reporterInk || 'default',
    align: l?.align || 'justify',
    photoSize: l?.photoSize || p.photoSize,
    photoPos: l?.photoPos || p.photoPos,
    showPhoto: opts.hasPhoto && !p.noPhoto,
  }
}
