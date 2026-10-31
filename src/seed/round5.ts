/**
 * npm run seed:round5 — Round 5 client changes for an EXISTING database. Safe to run more than once.
 *  • descriptor without “आधिकारिक / Official”
 *  • section renames + 2 new sections
 *  • phone numbers removed from the two administrative offices (addresses kept)
 *  • Editor may re-publish
 *  • “संपादक का संदेश” page text + editor name
 */
import { bilingual, findSlug, log, payload } from './lib'
import { EDITOR_MESSAGE, EDITOR_MESSAGE_TITLE } from '../content/editorMessage'
import { rt } from './helpers'

type Office = { id?: string; title?: string; phones?: unknown[] }
type S = { descriptor?: string; offices?: Office[] }

// ── Site settings
const NO_PHONES = ['प्रशासनिक कार्यालय', 'द्वितीय प्रशासनिक कार्यालय', 'Administrative Office', 'Second Administrative Office']
for (const [locale, word] of [
  ['hi', 'आधिकारिक '],
  ['en', 'Official '],
] as const) {
  const s = (await payload.findGlobal({ slug: 'site-settings', locale, depth: 0 })) as S
  const data: Record<string, unknown> = { editorName: 'श्री एके सिंह (राठौड़ साहब)' }
  if (s.descriptor?.includes(word)) data.descriptor = s.descriptor.replace(word, '')
  if (s.offices?.length) data.offices = s.offices.map((o) => (NO_PHONES.includes(o.title?.trim() || '') ? { ...o, phones: [] } : o))
  await payload.updateGlobal({ slug: 'site-settings', locale, data: data as never })
  log(`site settings (${locale}):`, Object.keys(data).join(', '))
}

// ── Sections
const RENAME = [
  ['bhrashtachar-par-nazar', 'भ्रष्टाचार पर पैनी नज़र', 'A Sharp Eye on Corruption'],
  ['mahila-bal', 'महिला और बाल विकास', 'Women & Child Development'],
  ['paryavaran', 'पर्यावरण संरक्षण', 'Environment Protection'],
] as const
for (const [slug, hi, en] of RENAME) {
  const c = await findSlug('categories', slug)
  if (!c) {
    log('section missing, skipped:', slug)
    continue
  }
  await payload.update({ collection: 'categories', id: c.id, locale: 'hi', data: { title: hi } as never })
  await payload.update({ collection: 'categories', id: c.id, locale: 'en', data: { title: en } as never })
  log('section renamed:', slug)
}
// New sections sit next to “पर्यावरण संरक्षण” (same parent / menu group).
const env = (await payload.find({ collection: 'categories', where: { slug: { equals: 'paryavaran' } }, limit: 1, depth: 0 })).docs[0] as
  | { parent?: number | null; menuGroup?: string; menuOrder?: number }
  | undefined
const NEW = [
  ['sanskriti-virasat', 'संस्कृति, विरासत और भारतीय ज्ञान परंपरा', 'Culture, Heritage & Indian Knowledge Tradition'],
  ['panchayati-raj', 'पंचायती राज और ग्रामीण विकास', 'Panchayati Raj & Rural Development'],
] as const
for (const [i, [slug, hi, en]] of NEW.entries()) {
  await bilingual('categories', slug, { title: hi, parent: env?.parent ?? undefined, menuGroup: env?.menuGroup || 'public', menuOrder: (env?.menuOrder ?? 500) + i + 1, showInMenu: true }, () => ({ title: en }))
  log('section ready:', slug)
}

// ── Editor may re-publish
const perms = (await payload.findGlobal({ slug: 'permissions', depth: 0 })) as unknown as Record<string, Record<string, boolean> | undefined>
await payload.updateGlobal({ slug: 'permissions', data: { republish: { ...(perms.republish || {}), editor: true, senior: true } } as never })
log('permissions: editor can re-publish')

// ── संपादक का संदेश (client's text, verbatim). No English version was supplied, so English shows the same Hindi text.
const MESSAGE = EDITOR_MESSAGE // client's current text lives in src/content/editorMessage.ts

const page = await findSlug('pages', 'editor-in-chief-message')
if (page) {
  await payload.update({ collection: 'pages', id: page.id, locale: 'hi', data: { title: EDITOR_MESSAGE_TITLE.hi, content: rt(MESSAGE), showOnHome: true } as never, draft: false })
  await payload.update({ collection: 'pages', id: page.id, locale: 'en', data: { title: EDITOR_MESSAGE_TITLE.en, content: rt(MESSAGE) } as never, draft: false })
  log('editor message page updated')
} else {
  await bilingual('pages', 'editor-in-chief-message', { title: EDITOR_MESSAGE_TITLE.hi, content: rt(MESSAGE), legalReviewPending: false, showInFooter: false, showOnHome: true }, () => ({ title: EDITOR_MESSAGE_TITLE.en, content: rt(MESSAGE) }))
  log('editor message page created')
}

log('round 5 content done ✔')
process.exit(0)
