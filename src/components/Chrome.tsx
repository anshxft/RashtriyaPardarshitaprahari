import Image from 'next/image'
import Link from 'next/link'
import { SPECIAL_COLUMNS, TAGLINE_FULL } from '@/content/brand'
import { getBreaking, getArticles, getCategories, getFooterPages, getMenu, getSettings } from '@/lib/data'
import { formatDate, t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'
import { LangSwitch, Nav, ThemeToggle } from './client'
import { FooterSection } from './FooterSection'
import { Offices } from './Offices'
import { SocialLinks } from './SocialLinks'
import { officeNumbers, waLink } from '@/lib/contact'

const GROUP_LABELS: Record<string, { hi: string; en: string }> = {
  news: { hi: 'खबरें', en: 'News' },
  accountability: { hi: 'जवाबदेही', en: 'Accountability' },
  public: { hi: 'जनहित', en: 'Public interest' },
  people: { hi: 'जन और विचार', en: 'People & ideas' },
}
const PRIMARY_COUNT = 8
/** Not empty and not a “[placeholder]” left from the setup drafts (those are never shown to readers). */
const filled = (v?: string | null) => Boolean(v && v.trim() && !/^\[.*\]$/.test(v.trim()))

export async function Header({ lang }: { lang: Lang }) {
  const d = t(lang)
  const [menu, settings] = await Promise.all([getMenu(lang), getSettings(lang)])
  const nav = menu.map((c) => ({ slug: c.slug!, title: c.title, group: c.menuGroup, children: c.children.map((k) => ({ slug: k.slug!, title: k.title })) }))
  const wa = officeNumbers(settings.offices).find((n) => n.whatsapp)
  const waHref = wa ? waLink(wa.number, settings.whatsappMessage) : null
  const groups = Object.entries(GROUP_LABELS).map(([key, l]) => ({ key, label: l[lang], items: nav.filter((c) => (c.group || 'news') === key) }))

  return (
    <header>
      <a href="#main" className="sr-only z-[200] bg-gold-400 p-2 text-navy-950 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <div className="bg-navy-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 text-sm">
          <span className="hidden lg:inline">{formatDate(new Date().toISOString(), lang)}</span>
          <nav aria-label={d.quickLinks} className="flex items-center gap-3 text-xs font-semibold text-gold-300 sm:gap-4 sm:text-sm">
            <Link href={paths.epaper(lang)} className="hover:underline">{d.epaper}</Link>
            <Link href={paths.videos(lang)} className="hover:underline">{d.videos}</Link>
            <Link href={paths.team(lang)} className="hover:underline">{d.team}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-gold-300 md:block">
              <SocialLinks social={settings.social} whatsapp={waHref} variant="icons" />
            </span>
            <Link href={paths.search(lang)} className="rounded px-2 py-0.5 hover:bg-white/10" aria-label={d.search}>
              <span aria-hidden>⌕</span> <span className="hidden sm:inline">{d.search}</span>
            </Link>
            <ThemeToggle label={d.darkMode} />
            <LangSwitch lang={lang} />
          </div>
          {/* Phones: the official social icons get their own thin row */}
          <div className="flex w-full justify-center border-t border-white/10 pt-1 text-gold-300 md:hidden">
            <SocialLinks social={settings.social} whatsapp={waHref} variant="icons" />
          </div>
        </div>
      </div>

      <div className="bg-bg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-5 md:py-4">
          <Link href={paths.home(lang)} className="flex min-w-0 items-center gap-3 md:gap-4">
            <Image src="/logo-160.webp" alt="" width={84} height={84} priority className="h-14 w-14 shrink-0 md:h-[84px] md:w-[84px]" />
            <span className="min-w-0">
              <span className="block truncate font-display text-xl leading-tight font-extrabold text-navy-900 sm:text-2xl md:text-4xl dark:text-gold-300">
                {settings.siteName || d.siteName}
              </span>
              {settings.descriptor && <span className="block text-xs leading-snug font-semibold text-navy-700 sm:text-sm dark:text-white/80">{settings.descriptor}</span>}
              <span className="block text-xs leading-snug font-semibold text-saffron-600 sm:text-sm md:text-base">{d.tagline}</span>
            </span>
          </Link>
          <Link
            href={paths.submit(lang)}
            className="ml-auto hidden shrink-0 rounded-md bg-saffron-500 px-4 py-2.5 font-bold text-navy-950 shadow hover:bg-saffron-600 hover:text-white md:block"
          >
            ✍ {d.submitIssueShort}
          </Link>
        </div>
      </div>
      <div className="tricolor-rule" />

      <div className="sticky top-0 z-40 bg-navy-900 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-2 lg:px-4">
          <Nav lang={lang} primary={nav.slice(0, PRIMARY_COUNT)} groups={groups} labels={{ all: d.allSections, menu: d.menu, close: d.close, home: d.home }} />
        </div>
      </div>
      <Ticker lang={lang} />
    </header>
  )
}

async function Ticker({ lang }: { lang: Lang }) {
  const d = t(lang)
  let items = await getBreaking(lang)
  let label = d.breaking
  if (!items.length) {
    const latest = await getArticles(lang, { limit: 6 })
    items = latest.docs.map((a) => ({ text: a.title, href: paths.article(lang, a.slug) }))
    label = d.latest
  }
  if (!items.length) return null
  const list = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((i, n) => (
        <li key={n} className="flex items-center px-6 whitespace-nowrap">
          <span aria-hidden className="mr-3 text-gold-300">◆</span>
          {i.href ? (
            <Link href={i.href} tabIndex={hidden ? -1 : undefined} className="hover:underline">
              {i.text}
            </Link>
          ) : (
            i.text
          )}
        </li>
      ))}
    </ul>
  )
  return (
    <div className="ticker border-b border-alert-700 bg-alert-600 text-white">
      <div className="mx-auto flex max-w-7xl items-stretch">
        <span className="z-10 flex shrink-0 items-center gap-2 bg-alert-700 px-3 py-2 text-sm font-extrabold tracking-wide uppercase">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" aria-hidden />
          {label}
        </span>
        <div className="relative flex-1 overflow-hidden py-2 text-sm font-semibold" role="region" aria-label={label}>
          <div className="ticker-track flex w-max" style={{ ['--ticker-duration' as string]: `${Math.max(25, items.length * 9)}s` }}>
            {list()}
            {list(true)}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function Footer({ lang }: { lang: Lang }) {
  const d = t(lang)
  const [menu, settings, pages, cats] = await Promise.all([getMenu(lang), getSettings(lang), getFooterPages(lang), getCategories(lang)])
  const s = settings
  const social = Object.entries(s.social || {}).filter(([k, v]) => k !== 'id' && v) as [string, string][]
  const fw = officeNumbers(s.offices).find((n) => n.whatsapp)
  const footerWa = fw ? waLink(fw.number, s.whatsappMessage) : null
  const special = SPECIAL_COLUMNS.map((slug) => cats.find((c) => c.slug === slug)).filter((c): c is NonNullable<typeof c> => Boolean(c))
  const specialSlugs: string[] = [...SPECIAL_COLUMNS]
  const subs = menu.flatMap((c) => c.children).filter((c) => !specialSlugs.includes(c.slug || ''))

  return (
    <footer className="mt-16 bg-navy-950 text-white/85">
      <div className="tricolor-rule" />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-2 md:gap-10 md:py-12 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/logo-160.webp" alt="" width={64} height={64} />
            <div>
              <p className="font-display text-xl font-bold text-gold-300">{s.siteName || d.siteName}</p>
              {s.descriptor && <p className="text-xs font-semibold text-white/70">{s.descriptor}</p>}
              <p className="text-sm leading-snug">{TAGLINE_FULL}</p>
            </div>
          </div>
          {social.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-gold-300">{d.followUs}</p>
              <SocialLinks social={s.social} whatsapp={footerWa} variant="chips" />
            </div>
          )}
          <dl className="mt-4 space-y-1 text-sm">
            {s.trustName && (
              <div>
                <dt className="inline text-white/60">Trust: </dt>
                <dd className="inline">{s.trustName}</dd>
              </div>
            )}
            {filled(s.trustRegistrationNo) && (
              <div>
                <dt className="inline text-white/60">{d.trustReg}: </dt>
                <dd className="inline">{s.trustRegistrationNo}</dd>
              </div>
            )}
            {filled(s.editorName) && (
              <div>
                <dt className="inline text-white/60">{d.editor}: </dt>
                <dd className="inline">{s.editorName}</dd>
              </div>
            )}
            {!s.offices?.length && s.address && (
              <div>
                <dt className="inline text-white/60">{d.address}: </dt>
                <dd className="inline whitespace-pre-line">{s.address}</dd>
              </div>
            )}
            {s.email && (
              <div>
                <dt className="inline text-white/60">Email: </dt>
                <dd className="inline">
                  <a href={`mailto:${s.email}`} className="underline">
                    {s.email}
                  </a>
                </dd>
              </div>
            )}
            {!s.offices?.length && s.phone && (
              <div>
                <dt className="inline text-white/60">{lang === 'hi' ? 'फोन' : 'Phone'}: </dt>
                <dd className="inline">{s.phone}</dd>
              </div>
            )}
          </dl>
          <FooterSection title={lang === 'hi' ? 'कार्यालय और हेल्पलाइन' : 'Offices & helplines'} className="mt-5">
            <Offices offices={s.offices || []} lang={lang} waText={s.whatsappMessage} variant="footer" />
          </FooterSection>
        </div>

        <FooterSection title={d.allSections}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {menu.map((c) => (
              <li key={c.id}>
                <Link href={paths.category(lang, c.slug)} className="hover:text-gold-300">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </FooterSection>

        <FooterSection title={d.quickLinks}>
          <ul className="space-y-1 text-sm">
            {special.map((c) => (
              <li key={c.id}>
                <Link href={paths.category(lang, c.slug)} className="font-semibold text-gold-300 hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href={paths.page(lang, 'editor-in-chief-message')} className="hover:text-gold-300">
                {d.editorMessage}
              </Link>
            </li>
            <li>
              <Link href={paths.team(lang)} className="hover:text-gold-300">
                {d.team}
              </Link>
            </li>
            <li>
              <Link href={paths.epaper(lang)} className="hover:text-gold-300">
                {d.epaper}
              </Link>
            </li>
            <li>
              <Link href={paths.videos(lang)} className="hover:text-gold-300">
                {d.videos}
              </Link>
            </li>
            {subs.map((c) => (
              <li key={c.id}>
                <Link href={paths.category(lang, c.slug)} className="hover:text-gold-300">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </FooterSection>

        <FooterSection title={d.policies}>
          <ul className="space-y-1 text-sm">
            {pages.map((p) => (
              <li key={p.id}>
                <Link href={paths.page(lang, p.slug)} className="hover:text-gold-300">
                  {p.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href={paths.corrections(lang)} className="hover:text-gold-300">
                {d.correctionsLog}
              </Link>
            </li>
            <li>
              <Link href={paths.submit(lang)} className="hover:text-gold-300">
                {d.submitIssueShort}
              </Link>
            </li>
            <li>
              <Link href={paths.appointment(lang)} className="hover:text-gold-300">
                {d.appointment}
              </Link>
            </li>
            <li>
              <Link href={paths.contact(lang)} className="hover:text-gold-300">
                {d.contact}
              </Link>
            </li>
          </ul>
        </FooterSection>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {s.trustName || s.siteName || d.siteName}. {d.rights}.{s.registrationNote ? ` ${s.registrationNote}` : ''}
      </div>
    </footer>
  )
}
