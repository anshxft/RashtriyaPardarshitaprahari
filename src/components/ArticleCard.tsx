import Link from 'next/link'
import { asCat, cardImage, type Card, type Img } from '@/lib/data'
import { t, timeAgo, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'
import { Cover, FormatBadge, QuestionBadge, SampleBadge, VerdictBadge } from './ui'

type Variant = 'lead' | 'card' | 'row' | 'compact'

const Meta = ({ a, lang }: { a: Card; lang: Lang }) => {
  const cat = asCat(a.category)
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {cat && (
        <Link href={paths.category(lang, cat.slug)} className="relative z-10 font-bold uppercase tracking-wide text-saffron-600 hover:underline">
          {cat.title}
        </Link>
      )}
      <FormatBadge format={a.format} lang={lang} />
      <VerdictBadge verdict={a.factCheck?.verdict} lang={lang} />
      <QuestionBadge status={a.questionStatus} lang={lang} />
      {a.sample && <SampleBadge lang={lang} />}
    </div>
  )
}

/**
 * Whole card is clickable via the stretched title link; the category link sits above it.
 * A story without a photo is a text card: never an empty picture frame.
 * A link-to-another-portal item opens the external site in a new tab and is visibly marked as external.
 */
export function ArticleCard({ a, lang, variant = 'card', priority }: { a: Card; lang: Lang; variant?: Variant; priority?: boolean }) {
  const d = t(lang)
  const external = a.format === 'link' && a.linkCard?.url ? a.linkCard : null
  const href = external ? external.url! : paths.article(lang, a.slug)
  const img: Img | undefined = cardImage(a, variant === 'lead' ? 'hero' : 'card') ?? (external?.imageUrl ? { src: external.imageUrl, alt: a.title } : undefined)
  const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {}
  const title = (
    <Link href={href} {...linkProps} className="after:absolute after:inset-0 hover:text-navy-700 dark:hover:text-gold-300">
      {a.title}
      {external && <span aria-hidden> ↗</span>}
    </Link>
  )
  const date = <time dateTime={a.publishedAt} className="text-xs text-muted">{timeAgo(a.publishedAt, lang)}</time>
  const source = external && (
    <p className="text-xs font-semibold text-link">
      {external.siteName ? `${external.siteName} · ` : ''}
      {d.viewRelatedPortal}
    </p>
  )
  const frame = external ? 'rounded-lg border border-dashed border-navy-700/50 bg-surface p-3' : ''
  const sub = a.subheadline || a.excerpt || external?.description

  if (variant === 'lead')
    return (
      <article className={`group relative ${frame}`}>
        {img && <Cover img={img} sizes="(min-width:1024px) 60vw, 100vw" priority={priority} className="mb-4 aspect-[16/9]" />}
        <div className="space-y-2">
          <Meta a={a} lang={lang} />
          <h2 className={`font-display leading-tight font-extrabold text-navy-900 dark:text-fg ${img ? 'text-3xl md:text-4xl' : 'border-l-8 border-gold-400 pl-4 text-4xl md:text-5xl'}`}>{title}</h2>
          {sub && <p className="text-lg text-muted">{sub}</p>}
          {source}
          {date}
        </div>
      </article>
    )

  if (variant === 'row')
    return (
      <article className={`group relative flex gap-4 border-b border-line py-4 last:border-0 ${frame}`}>
        {img && <Cover img={img} sizes="160px" className="aspect-video w-32 shrink-0 sm:w-44" />}
        <div className="min-w-0 space-y-1">
          <Meta a={a} lang={lang} />
          <h3 className="font-display text-lg leading-snug font-bold">{title}</h3>
          {sub && <p className="line-clamp-2 hidden text-sm text-muted sm:block">{sub}</p>}
          {source}
          {date}
        </div>
      </article>
    )

  if (variant === 'compact')
    return (
      <article className={`group relative border-b border-line py-3 last:border-0 ${frame}`}>
        <Meta a={a} lang={lang} />
        <h3 className="mt-1 font-display text-base leading-snug font-bold">{title}</h3>
        {source}
      </article>
    )

  return (
    <article className={`group relative flex flex-col ${img ? '' : 'border-t-4 border-gold-400 pt-3'} ${frame}`}>
      {img && <Cover img={img} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />}
      <div className={`${img ? 'mt-3' : ''} space-y-1.5`}>
        <Meta a={a} lang={lang} />
        <h3 className="font-display text-lg leading-snug font-bold">{title}</h3>
        {sub && <p className="line-clamp-2 text-sm text-muted">{sub}</p>}
        {source}
        {date}
      </div>
    </article>
  )
}
