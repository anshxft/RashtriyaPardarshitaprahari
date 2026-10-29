/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArticleCard } from '@/components/ArticleCard'
import { SubmitCta } from '@/components/SubmitCta'
import { videoThumb } from '@/components/VideoPlayer'
import { SectionTitle, Slot, VerdictBadge } from '@/components/ui'
import { EditorMessage } from '@/components/EditorMessage'
import { FlashBox } from '@/components/FlashBox'
import { HOME_BLOCKS } from '@/content/site-structure'
import { asCat, cardImage, getArticles, getBySlug, getCategory, getCategoryArticles, getSettings, getVideos, type Card } from '@/lib/data'
import { getFlash } from '@/lib/flash'
import { assertLang, t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const revalidate = 60

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  const flash = await getFlash(lang)

  const [featured, latest, investigations, factChecks, questions, forum, positive] = await Promise.all([
    getArticles(lang, { where: { featured: { equals: true } }, limit: 1 }),
    getArticles(lang, { limit: 14 }),
    getArticles(lang, { where: { format: { equals: 'investigation' } }, limit: 4 }),
    getArticles(lang, { where: { format: { equals: 'factcheck' } }, limit: 4 }),
    getArticles(lang, { where: { or: [{ format: { in: ['question', 'tracker'] } }, { questionStatus: { exists: true } }] }, limit: 4 }),
    getCategoryArticles(lang, 'jan-manch', 3),
    getCategoryArticles(lang, 'sakaratmak-bharat', 4),
  ])
  const lead = featured.docs[0] || latest.docs[0]
  const rest = latest.docs.filter((a) => a.id !== lead?.id)
  const [editorPage, settings, aina, sampadkiya, videos] = await Promise.all([
    getBySlug('pages', lang, 'editor-in-chief-message'),
    getSettings(lang),
    getCategoryArticles(lang, 'samaj-ka-aina', 3),
    getCategoryArticles(lang, 'sampadkiya', 3),
    getVideos(lang, { limit: 4 }),
  ])
  const blocks = await Promise.all(
    HOME_BLOCKS.map(async (slug) => ({ slug, cat: (await getCategory(lang, slug))?.cat, items: (await getCategoryArticles(lang, slug, 4)).docs })),
  )

  if (!lead)
    return lang === 'en' ? (
      // English shows only translated stories; until there are some, point readers to the Hindi edition.
      <div className="py-20 text-center">
        <p className="text-lg">Our news is currently published in Hindi.</p>
        <Link href="/hi" className="mt-4 inline-block rounded-md bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700">
          हिंदी में पढ़ें / Read in Hindi →
        </Link>
      </div>
    ) : (
      <p className="py-20 text-center text-muted">{d.noResults}</p>
    )

  return (
    <div className="space-y-12">
      {flash.length > 0 && <FlashBox initial={flash} lang={lang} />}

      {/* Phones: newspaper-style front (client's layout) — lead 2/3 + two stories beside it, then three to a row */}
      <PhoneFront items={[lead, ...rest.slice(0, 11)]} lang={lang} />

      {/* Lead + latest list */}
      <section className="hidden gap-8 sm:grid lg:grid-cols-3" aria-label={d.topStories}>
        <div className="lg:col-span-2">
          <ArticleCard a={lead} lang={lang} variant="lead" priority />
        </div>
        <aside>
          <SectionTitle lang={lang}>{d.latest}</SectionTitle>
          {rest.slice(0, 6).map((a) => (
            <ArticleCard key={a.id} a={a} lang={lang} variant="compact" />
          ))}
        </aside>
      </section>

      <section className="hidden sm:block">
        <SectionTitle lang={lang}>{d.topStories}</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rest.slice(6, 14).map((a) => (
            <ArticleCard key={a.id} a={a} lang={lang} />
          ))}
        </div>
      </section>

      <Slot name="ad-home-top" lang={lang} />

      {videos.docs.length > 0 && (
        <section>
          <SectionTitle lang={lang} href={paths.videos(lang)}>
            {d.videos}
          </SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {videos.docs.map((v) => {
              const thumb = videoThumb(v)
              return (
                <article key={v.id} className="group relative">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-navy-900">
                    {thumb && <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    <span className="absolute inset-0 flex items-center justify-center text-4xl text-white/90 drop-shadow">▶</span>
                  </div>
                  <h3 className="mt-2 font-display leading-snug font-bold">
                    <Link href={paths.video(lang, v.slug)} className="after:absolute after:inset-0 hover:text-brand-600 dark:hover:text-white">
                      {v.title}
                    </Link>
                  </h3>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {investigations.docs.length > 0 && (
        <section>
          <SectionTitle lang={lang} href={paths.category(lang, 'jaanch')}>
            {d.investigations}
          </SectionTitle>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {investigations.docs.map((a) => (
              <ArticleCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {factChecks.docs.length > 0 && <FactCheckStrip items={factChecks.docs} lang={lang} />}

      {questions.docs.length > 0 && (
        <section>
          <SectionTitle lang={lang} href={paths.category(lang, 'sarkar-se-sawal')}>
            {lang === 'hi' ? 'सरकार से सीधा सवाल · शिकायत से समाधान' : 'Direct Questions · Complaint to Resolution'}
          </SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {questions.docs.map((a) => (
              <ArticleCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        {blocks
          .filter((b) => b.cat && b.items.length)
          .map((b) => (
            <section key={b.slug}>
              <SectionTitle lang={lang} href={paths.category(lang, b.slug)}>
                {b.cat!.title}
              </SectionTitle>
              <ArticleCard a={b.items[0]} lang={lang} />
              <div className="mt-2">
                {b.items.slice(1).map((a) => (
                  <ArticleCard key={a.id} a={a} lang={lang} variant="row" />
                ))}
              </div>
            </section>
          ))}
      </div>

      {/* Editor-in-Chief's message + the two special columns */}
      {(editorPage?.showOnHome || aina.docs.length > 0 || sampadkiya.docs.length > 0) && (
        <section className="grid gap-8 lg:grid-cols-3" aria-label={d.specialColumns}>
          {editorPage?.showOnHome && <EditorMessage page={editorPage} name={settings.editorName} lang={lang} />}
          {[
            { slug: 'sampadkiya', docs: sampadkiya.docs },
            { slug: 'samaj-ka-aina', docs: aina.docs },
          ]
            .filter((c) => c.docs.length)
            .map((c) => (
              <div key={c.slug}>
                <SectionTitle lang={lang} href={paths.category(lang, c.slug)}>
                  {asCat(c.docs[0].category)?.title}
                </SectionTitle>
                {c.docs.map((a) => (
                  <ArticleCard key={a.id} a={a} lang={lang} variant="compact" />
                ))}
              </div>
            ))}
        </section>
      )}

      {/* Public forum + submit CTA */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle lang={lang} href={paths.category(lang, 'jan-manch')}>
            {d.publicForum}
          </SectionTitle>
          {forum.docs.length ? forum.docs.map((a) => <ArticleCard key={a.id} a={a} lang={lang} variant="row" />) : <p className="text-muted">{d.comingSoon}</p>}
        </div>
        <SubmitCta lang={lang} />
      </section>

      {positive.docs.length > 0 && (
        <section>
          <SectionTitle lang={lang} href={paths.category(lang, 'sakaratmak-bharat')}>
            {d.positiveIndia}
          </SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {positive.docs.map((a) => (
              <ArticleCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

function FactCheckStrip({ items, lang }: { items: Card[]; lang: Lang }) {
  const d = t(lang)
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <SectionTitle lang={lang} href={paths.category(lang, 'fact-check')}>
        ✔ {d.factCheck}
      </SectionTitle>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((a) => (
          <li key={a.id} className="group relative rounded-lg border border-line bg-bg p-4 shadow-sm">
            <VerdictBadge verdict={a.factCheck?.verdict} lang={lang} large />
            <h3 className="mt-3 font-display text-lg leading-snug font-bold">
              <Link href={paths.article(lang, a.slug)} className="after:absolute after:inset-0 hover:text-brand-600 dark:hover:text-white">
                {a.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-muted">{asCat(a.category)?.title}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}


/** Phone-only front page: real headlines at readable sizes; each tile opens its story. */
function PhoneFront({ items, lang }: { items: Card[]; lang: Lang }) {
  const [lead, second, third, ...rest] = items
  const card = 'relative block rounded-lg border border-line bg-bg p-2.5 shadow-sm'
  const label = (a: Card) => {
    const c = asCat(a.category)
    return c && <div className="mb-1 text-[11px] font-semibold text-brand-600">{c.title}</div>
  }
  const head = (a: Card, size: string) => (
    <h3 className={`font-display leading-tight font-extrabold ${size}`}>
      <Link href={paths.article(lang, a.slug)} className="after:absolute after:inset-0">
        {a.title}
      </Link>
    </h3>
  )
  const photo = (a: Card, ratio: string, kind: 'hero' | 'card' = 'card') => {
    const img = cardImage(a, kind)
    return img && <img src={img.src} alt={img.alt} loading={kind === 'hero' ? 'eager' : 'lazy'} className={`mt-2 w-full rounded object-cover ${ratio}`} />
  }
  const text = (a: Card, lines: string) => (a.excerpt || a.subheadline) && <p className={`mt-1.5 text-[13px] leading-snug text-muted ${lines}`}>{a.excerpt || a.subheadline}</p>
  if (!lead) return null
  return (
    <section className="space-y-2 sm:hidden" aria-label={t(lang).topStories}>
      <div className="grid grid-cols-3 gap-2">
        <article className={`${card} ${second ? 'col-span-2' : 'col-span-3'}`}>
          {label(lead)}
          {head(lead, 'text-[20px]')}
          {photo(lead, 'aspect-[4/3]', 'hero')}
          {text(lead, 'line-clamp-5')}
        </article>
        {second && (
          <div className="flex flex-col gap-2">
            <article className={card}>
              {label(second)}
              {head(second, 'text-[15px]')}
              {photo(second, 'aspect-square')}
              {text(second, 'line-clamp-2')}
            </article>
            {third && (
              <article className={card}>
                {label(third)}
                {head(third, 'text-[15px]')}
                {text(third, 'line-clamp-3')}
              </article>
            )}
          </div>
        )}
      </div>
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {rest.map((a) => (
            <article key={a.id} className={card}>
              {label(a)}
              {head(a, 'text-[14px]')}
              {photo(a, 'aspect-square')}
              {text(a, 'line-clamp-3')}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
