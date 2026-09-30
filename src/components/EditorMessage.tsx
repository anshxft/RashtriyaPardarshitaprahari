import Image from 'next/image'
import Link from 'next/link'
import { asMedia } from '@/lib/data'
import { t, type Lang } from '@/lib/i18n'
import { teaser } from '@/lib/lexical'
import { paths } from '@/lib/paths'
import type { Page } from '@/payload-types'
import { SectionTitle } from './ui'

/** Home-page block: the Editor-in-Chief's message (content comes from Admin → Pages → editor-in-chief-message). */
export function EditorMessage({ page, name, lang }: { page: Page; name?: string | null; lang: Lang }) {
  const d = t(lang)
  const photo = asMedia(page.image)
  return (
    <div>
      <SectionTitle lang={lang} accent="green">
        {d.editorMessage}
      </SectionTitle>
      <div className="flex gap-4">
        {photo?.url && <Image src={photo.sizes?.thumb?.url || photo.url} alt={name || ''} width={96} height={96} className="h-24 w-24 shrink-0 rounded-full object-cover" />}
        <div>
          <p className="text-base leading-relaxed">{teaser(page.content, 260)}</p>
          {name && (
            <p className="mt-2 text-sm font-semibold">
              — {name}, <span className="text-saffron-600">{d.editor}</span>
            </p>
          )}
          <Link href={paths.page(lang, page.slug)} className="mt-2 inline-block text-sm font-semibold text-link hover:underline">
            {d.readMore} →
          </Link>
        </div>
      </div>
    </div>
  )
}
