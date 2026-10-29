/* eslint-disable @next/next/no-img-element */
import { siteUrl } from '@/lib/paths'
import type { EpStory } from '@/lib/epaper'
import type { Lang } from '@/lib/i18n'
import { TricolorName } from '../TricolorName'

/**
 * Phone reading view of the day's edition (client's sketch): info strip → lead story (2 of 3 columns) with the next
 * two stories stacked beside it → the rest three to a row → footer strip. Real text at readable sizes, scrolls down;
 * the A3 pages stay one tap away for print / download.
 */
export function MobileEdition({ lang, siteName, dateLabel, weekday, regNo, stories, ad }: { lang: Lang; siteName: string; dateLabel: string; weekday: string; regNo?: string | null; stories: EpStory[]; ad?: EpStory | null }) {
  const hi = lang === 'hi'
  const [lead, second, third, ...rest] = stories
  const snippet = (s: EpStory, n: number) => (
    <p className="mt-1.5 text-[13px] leading-snug text-[#333]" style={{ display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {s.subheadline || s.paragraphs.join(' ')}
    </p>
  )
  const label = (txt?: string | null) => txt && <div className="mb-1 text-[11px] font-semibold text-[#8f1d1f]">{txt}</div>
  const head = (s: EpStory, size: string) => <h2 className={`font-display font-extrabold leading-tight text-[#111] ${size}`}>{s.title}</h2>
  const photo = (s: EpStory, ratio: string) =>
    s.photo && (
      <div className={`mt-2 overflow-hidden rounded bg-[#eee] ${ratio}`}>
        <img src={s.photo.src} alt={s.photo.alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
    )
  const card = 'block rounded-lg border border-[#e2e2e2] bg-white p-2.5 active:bg-[#faf7f2]'

  return (
    <div className="space-y-2 text-[#111]">
      <header className="rounded-lg bg-gradient-to-b from-[#fbfcfe] to-[#e9eef5] px-2 pt-2 pb-1.5 text-center">
        <div className="font-display text-[26px] leading-tight font-black whitespace-nowrap">
          <TricolorName name={siteName} />
        </div>
        <p className="text-[11px] font-semibold text-[#b8860b]">{hi ? 'ई-पेपर संस्करण' : 'E-Paper Edition'}</p>
      </header>
      <div className="rounded-lg bg-[#13294b] px-2 py-1.5 text-center text-[12px] leading-snug font-semibold text-white">
        {weekday}, {dateLabel} | {hi ? 'मूल्य: निःशुल्क' : 'Price: Free'}
        {regNo && ` | ${hi ? 'पंजीकरण सं.' : 'Regd. No.'} ${regNo}`}
        <br />
        {siteUrl().replace(/^https?:\/\/(www\.)?/, 'www.')}
      </div>

      {lead && (
        <div className="grid grid-cols-3 gap-2">
          <a href={lead.url} className={`${card} ${second ? 'col-span-2' : 'col-span-3'}`}>
            {label(lead.category || (hi ? 'मुख्य खबर' : 'Lead story'))}
            {head(lead, 'text-[21px]')}
            {photo(lead, 'aspect-[4/3]')}
            {snippet(lead, 6)}
          </a>
          {second && (
            <div className={`${card} flex flex-col`}>
              <a href={second.url}>
                {label(second.category)}
                {head(second, 'text-[16px]')}
                {photo(second, 'aspect-square')}
                {snippet(second, 3)}
              </a>
              {third && (
                <a href={third.url} className="mt-2 border-t border-[#e2e2e2] pt-2">
                  {label(third.category)}
                  {head(third, 'text-[15px]')}
                  {snippet(third, 3)}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {rest.map((s) => (
            <a key={s.id} href={s.url} className={card}>
              {label(s.category)}
              {head(s, 'text-[15px]')}
              {photo(s, 'aspect-square')}
              {snippet(s, 4)}
            </a>
          ))}
        </div>
      )}

      {ad?.photo && (
        <div className="rounded-lg border border-dashed border-[#999] bg-white p-1.5">
          <div className="mb-1 text-center text-[10px] font-bold tracking-wider text-[#666]">{hi ? 'विज्ञापन / ADVERTISEMENT' : 'ADVERTISEMENT'}</div>
          {ad.ad?.link ? (
            <a href={ad.ad.link} target="_blank" rel="noreferrer sponsored">
              <img src={ad.photo.src} alt={ad.photo.alt} className="mx-auto w-full" />
            </a>
          ) : (
            <img src={ad.photo.src} alt={ad.photo.alt} className="mx-auto w-full" />
          )}
        </div>
      )}

      <footer className="rounded-lg bg-[#f1efec] px-2 py-1.5 text-center text-[11.5px] font-semibold text-[#333]">
        {stories.length} {hi ? 'समाचार' : 'stories'} • {hi ? 'पूरी खबर पढ़ने के लिए खबर पर टैप करें' : 'Tap a story to read it in full'} • {siteName}
      </footer>
    </div>
  )
}
