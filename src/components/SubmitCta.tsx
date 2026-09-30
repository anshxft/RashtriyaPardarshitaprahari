import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export function SubmitCta({ lang }: { lang: Lang }) {
  const d = t(lang)
  return (
    <aside className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-saffron-500 to-gold-400 p-6 text-navy-950 shadow-lg">
      <div>
        <p className="font-display text-2xl leading-tight font-extrabold">{d.submitIssue}</p>
        <p className="mt-3">{d.submitIssueCta}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={paths.submit(lang)} className="rounded-md bg-navy-900 px-5 py-2.5 font-bold text-white hover:bg-navy-800">
          ✍ {d.submitIssueShort}
        </Link>
        <Link href={paths.appointment(lang)} className="rounded-md border-2 border-navy-900 px-4 py-2 font-bold hover:bg-navy-900 hover:text-white">
          {d.appointment}
        </Link>
      </div>
    </aside>
  )
}
