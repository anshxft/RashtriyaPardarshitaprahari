import Link from 'next/link'
import { ArticleCard } from '@/components/ArticleCard'
import { SubmitCta } from '@/components/SubmitCta'
import { SectionTitle, Slot, VerdictBadge } from '@/components/ui'
import { EditorMessage } from '@/components/EditorMessage'
import { HOME_BLOCKS } from '@/content/site-structure'
import { asCat, getArticles, getBySlug, getCategory, getCategoryArticles, getSettings, type Card } from '@/lib/data'
import { assertLang, t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const revalidate = 60

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLang((await params).lang)
  const d = t(lang)

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
  const [editorPage, settings, aina, sampadkiya] = await Promise.all([
    getBySlug('pages', lang, 'editor-in-chief-message'),
    getSettings(lang),
    getCategoryArticles(lang, 'samaj-ka-aina', 3),
    getCategoryArticles(lang, 'sampadkiya', 3),
  ])
  const blocks = await Promise.all(
    HOME_BLOCKS.map(async (slug) => ({ slug, cat: (await getCategory(lang, slug))?.cat, items: (await getCategoryArticles(lang, slug, 4)).docs })),
  )

  if (!lead) return <p className="py-20 text-center text-muted">{d.noResults}</p>

  return (
    <div className="space-y-12">
      {/* Lead + latest list */}
      <section className="grid gap-8 lg:grid-cols-3" aria-label={d.topStories}>
        <div className="lg:col-span-2">
          <ArticleCard a={lead} lang={lang} variant="lead" priority />
        </div>
        <aside>
          <SectionTitle lang={lang} accent="red">{d.latest}</SectionTitle>
          {rest.slice(0, 6).map((a) => (
            <ArticleCard key={a.id} a={a} lang={lang} variant="compact" />
          ))}
        </aside>
      </section>

      <section>
        <SectionTitle lang={lang}>{d.topStories}</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rest.slice(6, 14).map((a) => (
            <ArticleCard key={a.id} a={a} lang={lang} />
          ))}
        </div>
      </section>

      <Slot name="ad-home-top" />

      {investigations.docs.length > 0 && (
        <section className="-mx-4 bg-navy-900 px-4 py-8 text-white sm:rounded-xl">
          <div className="mb-5 flex items-end justify-between border-b border-white/20 pb-2">
            <h2 className="font-display text-2xl font-bold text-gold-300">🔍 {d.investigations}</h2>
            <Link href={paths.category(lang, 'jaanch')} className="text-sm font-semibold text-gold-300 hover:underline">
              {d.viewAll} →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 [&_.text-muted]:text-white/70 [&_h3]:text-white">
            {investigations.docs.map((a) => (
              <ArticleCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {factChecks.docs.length > 0 && <FactCheckStrip items={factChecks.docs} lang={lang} />}

      {questions.docs.length > 0 && (
        <section>
          <SectionTitle lang={lang} href={paths.category(lang, 'sarkar-se-sawal')} accent="saffron">
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
                <SectionTitle lang={lang} href={paths.category(lang, c.slug)} accent="saffron">
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
          <SectionTitle lang={lang} href={paths.category(lang, 'jan-manch')} accent="green">
            {d.publicForum}
          </SectionTitle>
          {forum.docs.length ? forum.docs.map((a) => <ArticleCard key={a.id} a={a} lang={lang} variant="row" />) : <p className="text-muted">{d.comingSoon}</p>}
        </div>
        <SubmitCta lang={lang} />
      </section>

      {positive.docs.length > 0 && (
        <section className="rounded-xl border-2 border-india-600/30 bg-india-600/5 p-5">
          <SectionTitle lang={lang} href={paths.category(lang, 'sakaratmak-bharat')} accent="green">
            🌱 {d.positiveIndia}
          </SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {positive.docs.map((a) => (
              <ArticleCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <Newsletter lang={lang} />
    </div>
  )
}

function FactCheckStrip({ items, lang }: { items: Card[]; lang: Lang }) {
  const d = t(lang)
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <SectionTitle lang={lang} href={paths.category(lang, 'fact-check')} accent="red">
        ✔ {d.factCheck}
      </SectionTitle>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((a) => (
          <li key={a.id} className="group relative rounded-lg border border-line bg-bg p-4 shadow-sm">
            <VerdictBadge verdict={a.factCheck?.verdict} lang={lang} large />
            <h3 className="mt-3 font-display text-lg leading-snug font-bold">
              <Link href={paths.article(lang, a.slug)} className="after:absolute after:inset-0 hover:text-navy-700 dark:hover:text-gold-300">
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


function Newsletter({ lang }: { lang: Lang }) {
  const d = t(lang)
  return (
    <section className="rounded-xl bg-navy-900 p-6 text-white md:flex md:items-center md:justify-between md:gap-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-gold-300">📬 {d.newsletter}</h2>
        <p className="mt-1 text-white/85">{d.newsletterText}</p>
      </div>
      {/* Placeholder: connect to a newsletter provider later. */}
      <form className="mt-4 flex w-full max-w-md gap-2 md:mt-0" aria-disabled>
        <label className="sr-only" htmlFor="nl-email">Email</label>
        <input id="nl-email" type="email" disabled placeholder="email@example.com" className="min-w-0 flex-1 rounded-md bg-white/10 px-3 py-2 placeholder:text-white/50" />
        <button type="button" disabled className="cursor-not-allowed rounded-md bg-gold-400/60 px-4 py-2 font-bold text-navy-950">
          {d.comingSoon}
        </button>
      </form>
    </section>
  )
}
