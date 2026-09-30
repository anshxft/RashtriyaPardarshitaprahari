/**
 * npm run seed:round3 — one-time content migration for an EXISTING database (Round 3 text corrections).
 *  • "जन मंच" → "जनता का मंच"; adds संपादकीय, समाज का आइना, संबंधित न्यूज़ पोर्टल
 *  • Editor → प्रधान संपादक in About / Editorial policy / Correction policy (overwrites those 3 pages' text)
 *  • creates the "प्रधान संपादक का संदेश" page (never overwritten) and sample team profiles
 * Safe to run more than once.
 */
import { SECTIONS } from '../content/site-structure'
import { rt } from './helpers'
import { bilingual, findSlug, log, payload, upsertBilingual } from './lib'
import { PAGES } from './pages'
import { seedTeam } from './team'

// ── Sections: only the ones Round 3 touched
const TOUCHED = ['jan-manch', 'sampadkiya', 'samaj-ka-aina', 'sambandhit-portal']
for (const parent of SECTIONS) {
  const parentDoc = await findSlug('categories', parent.slug)
  for (const s of [parent, ...(parent.children || []).map((c) => ({ ...c, parentSlug: parent.slug }))] as (typeof parent & { parentSlug?: string })[]) {
    if (!TOUCHED.includes(s.slug)) continue
    const existing = await findSlug('categories', s.slug)
    if (existing) {
      // rename only (keep the menu position / parent the editor may have changed)
      await payload.update({ collection: 'categories', id: existing.id, locale: 'hi', data: { title: s.title.hi, description: s.description.hi } as never })
      await payload.update({ collection: 'categories', id: existing.id, locale: 'en', data: { title: s.title.en, description: s.description.en } as never })
    } else {
      await bilingual(
        'categories',
        s.slug,
        { title: s.title.hi, description: s.description.hi, parent: parentDoc?.id, menuGroup: parent.group, menuOrder: 500, showInMenu: true },
        () => ({ title: s.title.en, description: s.description.en }),
      )
    }
    log('section:', s.slug)
  }
}

// ── Pages
for (const slug of ['about-us', 'editorial-policy', 'correction-policy']) {
  const p = PAGES.find((x) => x.slug === slug)!
  await upsertBilingual('pages', slug, { title: p.title.hi, content: rt(p.hi) }, { title: p.title.en, content: rt(p.en) })
  log('page updated:', slug)
}
const msg = PAGES.find((x) => x.slug === 'editor-in-chief-message')!
await bilingual('pages', msg.slug, { title: msg.title.hi, content: rt(msg.hi), legalReviewPending: false, showInFooter: false, showOnHome: false }, () => ({ title: msg.title.en, content: rt(msg.en) }))

// ── Settings placeholder wording (only if still the old placeholder)
for (const [locale, old, next] of [
  ['hi', '[संपादक का नाम]', '[प्रधान संपादक का नाम]'],
  ['en', '[Editor name]', '[Editor-in-Chief name]'],
] as const) {
  const s = await payload.findGlobal({ slug: 'site-settings', locale })
  if (s.editorName === old) await payload.updateGlobal({ slug: 'site-settings', locale, data: { editorName: next } })
}

await seedTeam()
log('round 3 content migration done ✔')
process.exit(0)
