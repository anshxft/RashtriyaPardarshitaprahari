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
      <h1 className="border-b-2 border-brand-600 pb-4 font-display text-4xl font-extrabold text-navy-900 dark:text-white">{d.correctionsLog}</h1>
      {hi ? (
        <div className="mt-4 space-y-3 text-lg leading-relaxed">
          <p>
            राष्ट्रीय पारदर्शिता प्रहरी प्रकाशित समाचारों एवं सामग्री में तथ्यात्मक शुद्धता और पारदर्शिता बनाए रखने के लिए प्रतिबद्ध है। किसी सामग्री में त्रुटि की सूचना मिलने पर उपलब्ध तथ्यों एवं प्रमाणों के आधार पर उसकी जांच की जाएगी। आवश्यक पाए जाने पर सुधार किया जाएगा तथा महत्वपूर्ण संशोधनों का विवरण और तिथि दर्ज की जा सकती है। सामान्य वर्तनी, व्याकरण या प्रारूप संबंधी बदलावों को अलग से दर्ज करना आवश्यक नहीं है।
          </p>
          <p className="font-semibold">
            सुधार हेतु संपर्क:{' '}
            <a href="mailto:official@rashtriyapardarshitaprahari.org" className="text-link underline">
              official@rashtriyapardarshitaprahari.org
            </a>
          </p>
          <p>
            <Link href={paths.page(lang, 'correction-policy')} className="text-link underline">
              {d.correctionPolicyLink}
            </Link>
          </p>
        </div>
      ) : (
        <p className="mt-4 text-muted">
          We acknowledge our mistakes publicly. Every correction made to a published story is listed here.{' '}
          <Link href={paths.page(lang, 'correction-policy')} className="text-link underline">
            {d.correctionPolicyLink}
          </Link>
        </p>
      )}
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
