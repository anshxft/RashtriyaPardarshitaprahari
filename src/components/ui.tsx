import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Img } from '@/lib/data'
import { t, type Lang } from '@/lib/i18n'

const pill = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 whitespace-nowrap'

const VERDICT_STYLE: Record<string, string> = {
  true: 'bg-india-600 text-white',
  false: 'bg-alert-600 text-white',
  misleading: 'bg-saffron-500 text-navy-950',
  unverified: 'bg-slate-500 text-white',
}
const VERDICT_ICON: Record<string, string> = { true: '✓', false: '✗', misleading: '!', unverified: '?' }

export const VerdictBadge = ({ verdict, lang, large }: { verdict?: string | null; lang: Lang; large?: boolean }) =>
  verdict ? (
    <span className={`${pill} ${VERDICT_STYLE[verdict]} ${large ? 'px-4 py-1.5 text-base' : ''}`}>
      <span aria-hidden>{VERDICT_ICON[verdict]}</span>
      {t(lang).verdicts[verdict as keyof ReturnType<typeof t>['verdicts']]}
    </span>
  ) : null

const Q_STYLE: Record<string, string> = {
  asked: 'bg-navy-100 text-navy-800 ring-1 ring-navy-700/30',
  responded: 'bg-gold-300 text-navy-950',
  action: 'bg-india-600 text-white',
}
export const QuestionBadge = ({ status, lang }: { status?: string | null; lang: Lang }) =>
  status ? <span className={`${pill} ${Q_STYLE[status]}`}>{t(lang).questionStatus[status as 'asked']}</span> : null

export const FormatBadge = ({ format, lang }: { format?: string | null; lang: Lang }) =>
  format && format !== 'news' ? (
    <span className={`${pill} bg-navy-900 text-gold-300`}>{t(lang).formats[format as 'news']}</span>
  ) : null

export const SampleBadge = ({ lang }: { lang: Lang }) => (
  <span className={`${pill} border border-dashed border-saffron-600 text-saffron-600`}>{t(lang).sample}</span>
)

export const SectionTitle = ({ children, href, lang, accent = 'gold' }: { children: ReactNode; href?: string; lang: Lang; accent?: 'gold' | 'saffron' | 'green' | 'red' }) => {
  const bar = { gold: 'bg-gold-500', saffron: 'bg-saffron-500', green: 'bg-india-600', red: 'bg-alert-600' }[accent]
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-line pb-2">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-navy-900 dark:text-gold-300">
        <span aria-hidden className={`inline-block h-6 w-1.5 rounded ${bar}`} />
        {children}
      </h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-link hover:underline">
          {t(lang).viewAll} →
        </Link>
      )}
    </div>
  )
}

/** Branded neutral placeholder when an article has no licensed image. */
export const Placeholder = ({ label }: { label?: string }) => (
  <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
    <Image src="/emblem.png" alt="" width={120} height={120} className="absolute -right-4 -bottom-4 opacity-20" />
    <div className="tricolor-rule absolute inset-x-0 top-0" />
    {label && <span className="px-4 text-center font-display text-lg font-bold text-gold-300">{label}</span>}
  </div>
)

/** Hosts allowed in next.config images.remotePatterns; anything else is shown unoptimised. */
const isKnownHost = (src: string) =>
  !src.startsWith('http') || /^https:\/\/[^/]*(wikimedia\.org|unsplash\.com|pexels\.com|vercel-storage\.com)\//.test(src)

export const Cover = ({ img, label, sizes, priority, className = 'aspect-video' }: { img?: Img; label?: string; sizes: string; priority?: boolean; className?: string }) => (
  <div className={`relative overflow-hidden rounded-lg bg-surface ${className}`}>
    {img ? (
      <Image src={img.src} alt={img.alt} fill sizes={sizes} priority={priority} unoptimized={!isKnownHost(img.src)} className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
    ) : (
      <Placeholder label={label} />
    )}
  </div>
)

export const Credit = ({ img, lang }: { img?: Img; lang: Lang }) =>
  img?.credit ? (
    <p className="mt-1 text-xs text-muted">
      {t(lang).imageCredit}:{' '}
      {img.creditUrl ? (
        <a href={img.creditUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {img.credit}
        </a>
      ) : (
        img.credit
      )}
    </p>
  ) : null

/** Ad slot: shows one live ad for its placement (Advertisement Manager) when ads are enabled; otherwise nothing at all. */
export async function Slot({ name }: { name: `ad-${string}` | 'donate' }) {
  const placement = name === 'ad-home-top' ? 'home-top' : name.startsWith('ad-article') ? 'article' : null
  if (!placement) return null
  const { getAd } = await import('@/lib/data')
  const ad = await getAd(placement)
  if (!ad) return null
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ad.image} alt={ad.title} loading="lazy" className="mx-auto max-h-64 w-auto max-w-full rounded" />
  )
  return (
    <aside aria-label="विज्ञापन / Advertisement" className="my-6 rounded-lg border border-dashed border-line p-2 text-center">
      <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">विज्ञापन / Advertisement</p>
      {ad.link ? (
        <a href={ad.link} target="_blank" rel="sponsored noopener noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
    </aside>
  )
}

export const Pagination = ({ page, totalPages, base, lang }: { page: number; totalPages: number; base: string; lang: Lang }) => {
  if (totalPages <= 1) return null
  const d = t(lang)
  const url = (p: number) => `${base}${base.includes('?') ? '&' : '?'}page=${p}`
  return (
    <nav aria-label={d.page} className="mt-8 flex items-center justify-center gap-3">
      {page > 1 && (
        <Link className="rounded border border-line px-4 py-2 hover:bg-surface" href={url(page - 1)} rel="prev">
          ← {d.prev}
        </Link>
      )}
      <span className="text-sm text-muted">
        {d.page} {page} / {totalPages}
      </span>
      {page < totalPages && (
        <Link className="rounded border border-line px-4 py-2 hover:bg-surface" href={url(page + 1)} rel="next">
          {d.next} →
        </Link>
      )}
    </nav>
  )
}
