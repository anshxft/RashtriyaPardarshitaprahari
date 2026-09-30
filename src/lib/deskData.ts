import { canPublish } from '@/access'
import type { NewsForm } from '@/components/desk/NewsEditor'
import type { CategoryOption, TeamOption } from './deskTypes'
import { istDate } from './articleHooks'
import { asMedia, db } from './data'
import { getEditionStories } from './epaperData'
import type { Lang } from './i18n'
import { isPlainBody, lexicalToText } from './lexical'
import type { Article, User } from '@/payload-types'

/** Flat "Parent › Child" list for the category picker. */
export async function categoryOptions(): Promise<CategoryOption[]> {
  const res = await (await db()).find({ collection: 'categories', locale: 'hi', limit: 500, depth: 0, sort: 'menuOrder', pagination: false })
  const by = new Map(res.docs.map((c) => [c.id, c]))
  return res.docs
    .filter((c) => c.parent || res.docs.some((k) => k.parent === c.id) || true)
    .map((c) => ({ id: c.id, label: c.parent && by.get(c.parent as number) ? `${by.get(c.parent as number)!.title} › ${c.title}` : c.title }))
    .sort((a, b) => a.label.localeCompare(b.label, 'hi'))
}

export async function teamOptions(): Promise<TeamOption[]> {
  const res = await (await db()).find({ collection: 'team-members', locale: 'hi', where: { _status: { equals: 'published' } }, limit: 1000, depth: 0, pagination: false, select: { name: true, designation: true } })
  return res.docs.map((m) => ({ id: m.id, name: m.name, designation: m.designation }))
}

/** Today's (IST) published stories: the real edition the new story will be placed into. */
export const todaysEdition = (lang: Lang) => getEditionStories(lang, istDate(new Date()))

export const emptyForm = (): NewsForm => ({
  title: '',
  subheadline: '',
  reporterName: '',
  reporterId: null,
  location: '',
  categoryId: null,
  body: '',
  photo: { id: null, url: null },
  credit: '',
  layout: { template: '1', autoFit: true, bodyScale: 100, inEpaper: true },
  scheduleAt: '',
  editNote: '',
  format: 'news',
  published: false,
})

/** Load one article (in one language, without falling back to Hindi) into the editor's form. */
export async function loadForm(id: string, locale: Lang, user: User): Promise<{ form: NewsForm; hi?: { title: string; body: string } } | null> {
  const payload = await db()
  const a = (await payload.findByID({ collection: 'articles', id, locale, fallbackLocale: false, depth: 1, draft: true, overrideAccess: false, user }).catch(() => null)) as Article | null
  if (!a) return null
  const media = asMedia(a.heroImage)
  const hi =
    locale === 'en'
      ? ((await payload.findByID({ collection: 'articles', id, locale: 'hi', depth: 0, draft: true, overrideAccess: false, user }).catch(() => null)) as Article | null)
      : null
  return {
    form: {
      id: a.id,
      title: a.title || '',
      subheadline: a.subheadline || '',
      reporterName: a.reporterName || '',
      reporterId: typeof a.reporter === 'object' ? (a.reporter?.id ?? null) : (a.reporter ?? null),
      location: a.location || '',
      categoryId: typeof a.category === 'object' ? a.category?.id : a.category,
      body: lexicalToText(a.content),
      photo: { id: media?.id ?? null, url: media ? media.sizes?.hero?.url || media.url || null : null },
      credit: media?.credit || '',
      layout: (a.layout as NewsForm['layout']) || {},
      scheduleAt: '',
      editNote: '',
      format: a.format || 'news',
      published: Boolean(a.firstPublishedAt),
      status: a.reviewStatus || undefined,
      newsId: a.newsId,
      slug: a.slug,
      richBody: !isPlainBody(a.content),
    },
    hi: hi ? { title: hi.title, body: lexicalToText(hi.content) } : undefined,
  }
}

export const mayPublish = (user: User) => canPublish({ user } as never)
