import type { Metadata } from 'next'
import { FormPage } from '@/components/FormPage'
import { appointmentFields } from '@/content/forms'
import { assertLang, t } from '@/lib/i18n'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: t(assertLang((await params).lang)).appointment }
}

export default async function AppointmentPage({ params }: Props) {
  const lang = assertLang((await params).lang)
  const intro =
    lang === 'hi'
      ? 'संपादक, संवाददाता या ट्रस्ट प्रतिनिधि से मिलने के लिए अनुरोध भेजें। हम उपलब्धता के अनुसार पुष्टि करेंगे।'
      : 'Request a meeting with the editor, a reporter or a Trust representative. We will confirm based on availability.'
  return <FormPage lang={lang} kind="appointment" fields={appointmentFields} title={t(lang).appointment} intro={intro} />
}
