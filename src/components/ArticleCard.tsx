import Link from 'next/link'
import { asCat, cardImage, type Card } from '@/lib/data'
import { formatDate, type Lang } from '@/lib/i18n'
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

/** Whole card is clickable via the stretched title link; category link sits above it. */
export function ArticleCard({ a, lang, variant = 'card', priority }: { a: Card; lang: Lang; variant?: Variant; priority?: boolean }) {
  const href = paths.article(lang, a.slug)
  const img = cardImage(a, variant === 'lead' ? 'hero' : 'card')
  const label = asCat(a.category)?.title
  const title = (
    <Link href={href} className="after:absolute after:inset-0 hover:text-navy-700 dark:hover:text-gold-300">
      {a.title}
    </Link>
  )
  const date = <time dateTime={a.publishedAt} className="text-xs text-muted">{formatDate(a.publishedAt, lang)}</time>

  if (variant === 'lead')
    return (
      <article className="group relative">
        <Cover img={img} label={label} sizes="(min-width:1024px) 60vw, 100vw" priority={priority} className="aspect-[16/9]" />
        <div className="mt-4 space-y-2">
          <Meta a={a} lang={lang} />
          <h2 className="font-display text-3xl leading-tight font-extrabold text-navy-900 md:text-4xl dark:text-fg">{title}</h2>
          {a.excerpt && <p className="text-lg text-muted">{a.excerpt}</p>}
          {date}
        </div>
      </article>
    )

  if (variant === 'row')
    return (
      <article className="group relative flex gap-4 border-b border-line py-4 last:border-0">
        <Cover img={img} label={label} sizes="160px" className="aspect-video w-32 shrink-0 sm:w-44" />
        <div className="min-w-0 space-y-1">
          <Meta a={a} lang={lang} />
          <h3 className="font-display text-lg leading-snug font-bold">{title}</h3>
          {a.excerpt && <p className="line-clamp-2 hidden text-sm text-muted sm:block">{a.excerpt}</p>}
          {date}
        </div>
      </article>
    )

  if (variant === 'compact')
    return (
      <article className="group relative border-b border-line py-3 last:border-0">
        <Meta a={a} lang={lang} />
        <h3 className="mt-1 font-display text-base leading-snug font-bold">{title}</h3>
      </article>
    )

  return (
    <article className="group relative flex flex-col">
      <Cover img={img} label={label} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
      <div className="mt-3 space-y-1.5">
        <Meta a={a} lang={lang} />
        <h3 className="font-display text-lg leading-snug font-bold">{title}</h3>
        {a.excerpt && <p className="line-clamp-2 text-sm text-muted">{a.excerpt}</p>}
        {date}
      </div>
    </article>
  )
}
