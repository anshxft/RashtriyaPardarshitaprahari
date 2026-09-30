import type { Metadata } from 'next'
import { FormPage } from '@/components/FormPage'
import { submissionFields } from '@/content/forms'
import { assertLang, t } from '@/lib/i18n'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).submitIssue }
}

export default async function SubmitIssuePage({ params }: Props) {
  const lang = assertLang((await params).lang)
  const d = t(lang)
  return <FormPage lang={lang} kind="submission" fields={submissionFields} title={d.submitIssue} intro={d.submitIssueCta} />
}
