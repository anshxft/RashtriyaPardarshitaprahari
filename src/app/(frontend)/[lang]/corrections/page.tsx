import type { Metadata } from 'next'
import Link from 'next/link'
import { getCorrections } from '@/lib/data'
import { assertLang, formatDate, t } from '@/lib/i18n'
import { paths } from '@/lib/paths'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).correctionsLog }
}

export default async function CorrectionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  const items = await getCorrections(lang)
  const hi = lang === 'hi'
  const types = { correction: hi ? 'सुधार' : 'Correction', clarification: hi ? 'स्पष्टीकरण' : 'Clarification', update: hi ? 'अपडेट' : 'Update' }
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="border-b-4 border-gold-400 pb-4 font-display text-4xl font-extrabold text-navy-900 dark:text-gold-300">{d.correctionsLog}</h1>
      <p className="mt-4 text-muted">
        {hi
          ? 'हम अपनी गलतियां सार्वजनिक रूप से स्वीकार करते हैं। प्रकाशित खबरों में किए गए सभी सुधार यहां दर्ज हैं।'
          : 'We acknowledge our mistakes publicly. Every correction made to a published story is listed here.'}{' '}
        <Link href={paths.page(lang, 'correction-policy')} className="text-link underline">
          {d.correctionPolicyLink}
        </Link>
      </p>
      {items.length === 0 ? (
        <p className="py-12 text-center text-muted">{d.noResults}</p>
      ) : (
        <ol className="mt-8 space-y-6">
          {items.map((c) => {
            const art = typeof c.article === 'object' ? c.article : undefined
            return (
              <li key={c.id} className="rounded-lg border border-l-4 border-line border-l-alert-600 p-4">
                <p className="text-sm text-muted">
                  <time dateTime={c.date}>{formatDate(c.date, lang)}</time> · <strong>{types[(c.type || 'correction') as keyof typeof types]}</strong>
                </p>
                {art && (
                  <Link href={paths.article(lang, art.slug)} className="mt-1 block font-display text-lg font-bold text-link hover:underline">
                    {art.title}
                  </Link>
                )}
                <p className="mt-1">{c.summary}</p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
