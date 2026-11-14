import { revalidatePath } from 'next/cache'
import { paths } from './paths'

/**
 * After a story goes live, changes or comes down: refresh only what shows it — its own page (both languages), the home
 * page, the e-paper and video pages. Section / tag / search lists are always made fresh anyway. Refreshing the whole
 * site on every save made every page be rebuilt again and again (heavy on hosting limits).
 */
export function refreshStory(slug?: string | null) {
  revalidatePath('/[lang]', 'page')
  revalidatePath('/[lang]/epaper/[date]', 'page')
  revalidatePath('/[lang]/video/[slug]', 'page')
  revalidatePath('/[lang]/corrections', 'page')
  if (!slug) return
  for (const l of ['hi', 'en'] as const) {
    const p = paths.article(l, slug)
    revalidatePath(p)
    try {
      const raw = decodeURI(p)
      if (raw !== p) revalidatePath(raw)
    } catch {
      /* not encoded */
    }
  }
}
