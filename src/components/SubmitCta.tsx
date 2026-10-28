import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export function SubmitCta({ lang }: { lang: Lang }) {
  const d = t(lang)
  return (
    <aside className="flex flex-col justify-between rounded-xl border border-line border-t-4 border-t-brand-600 bg-surface p-6">
      <div>
        <p className="font-display text-2xl leading-tight font-extrabold">{d.submitIssue}</p>
        <p className="mt-3">{d.submitIssueCta}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={paths.submit(lang)} className="rounded-md bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700">
          {d.submitIssueShort}
        </Link>
        <Link href={paths.appointment(lang)} className="rounded-md border-2 border-brand-600 px-4 py-2 font-bold text-brand-600 hover:bg-brand-600 hover:text-white">
          {d.appointment}
        </Link>
      </div>
    </aside>
  )
}
