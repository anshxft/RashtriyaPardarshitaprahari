import type { Metadata } from 'next'
import { FormPage } from '@/components/FormPage'
import { contactFields } from '@/content/forms'
import { assertLang, t } from '@/lib/i18n'

export const dynamic = 'force-dynamic' // reads searchParams
type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ topic?: string; ref?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).contact }
}

export default async function ContactPage({ params, searchParams }: Props) {
  const lang = assertLang((await params).lang)
  const sp = await searchParams
  // "Spotted an error?" links arrive with ?topic=correction&ref=<article-slug>
  const defaults: Record<string, string> = {}
  if (sp.topic === 'correction') {
    defaults.topic = 'correction'
    if (sp.ref) defaults.subject = `${lang === 'hi' ? 'सुधार' : 'Correction'}: ${String(sp.ref).slice(0, 120)}`
  }
  const intro =
    lang === 'hi'
      ? 'सुझाव, सुधार का अनुरोध या शिकायत — हमें लिखें। सुधार के अनुरोधों पर हम सुधार नीति के अनुसार कार्रवाई करते हैं।'
      : 'Feedback, a correction request or a grievance — write to us. Correction requests are handled under our Correction Policy.'
  return <FormPage lang={lang} kind="contact" fields={contactFields} title={t(lang).contact} intro={intro} defaults={defaults} />
}
