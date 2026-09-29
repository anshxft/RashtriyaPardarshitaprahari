/**
 * npm run seed — idempotent: creates anything missing (matched by slug), never overwrites existing content.
 * Seeds: sections/menu, site settings (placeholders), static pages, authors, tags, DEMO news, SAMPLE formats, breaking news.
 */
import config from '@payload-config'
import { getPayload, type CollectionSlug } from 'payload'
import { SECTIONS } from '../content/site-structure'
import { DEMO, DEMO_BREAKING } from './demo'
import { rt, sampleLetterPng, samplePdf } from './helpers'
import { PAGES } from './pages'
import { SAMPLES } from './samples'

const payload = await getPayload({ config })
const log = (...a: unknown[]) => console.log('•', ...a)
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

async function findSlug(collection: CollectionSlug, slug: string) {
  const r = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
  return r.docs[0] as { id: number } | undefined
}

/** Create in Hindi, then add the English locale. Returns id (existing or new). */
async function bilingual(collection: CollectionSlug, slug: string, hi: Record<string, unknown>, en: (doc: any) => Record<string, unknown>) {
  const existing = await findSlug(collection, slug)
  if (existing) return existing.id
  const doc = await payload.create({ collection, locale: 'hi', data: { ...hi, slug } as never, draft: false })
  await payload.update({ collection, id: doc.id, locale: 'en', data: en(doc) as never, draft: false })
  return doc.id as number
}

// ── Sections (menu)
const catIds: Record<string, number> = {}
let order = 0
for (const s of SECTIONS) {
  order += 10
  catIds[s.slug] = await bilingual(
    'categories',
    s.slug,
    { title: s.title.hi, description: s.description.hi, menuGroup: s.group, menuOrder: order, showInMenu: true },
    () => ({ title: s.title.en, description: s.description.en }),
  )
  let sub = 0
  for (const c of s.children || []) {
    catIds[c.slug] = await bilingual(
      'categories',
      c.slug,
      { title: c.title.hi, description: c.description.hi, parent: catIds[s.slug], menuOrder: order + ++sub, showInMenu: true },
      () => ({ title: c.title.en, description: c.description.en }),
    )
  }
}
log('sections:', Object.keys(catIds).length)

// ── Site settings (placeholders — fill in Admin → Site Settings)
const settings = await payload.findGlobal({ slug: 'site-settings', locale: 'hi' })
if (!settings.siteName) {
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'hi',
    data: {
      siteName: 'राष्ट्रीय पारदर्शिता प्रहरी',
      tagline: 'खबर से आगे, जवाबदेही तक',
      trustName: 'पारदर्शिता प्रहरी ट्रस्ट',
      trustRegistrationNo: '[ट्रस्ट पंजीकरण संख्या]',
      editorName: '[संपादक का नाम]',
      publisherName: '[प्रकाशक का नाम]',
      address: '[पूरा पता]\n[शहर, राज्य, पिन कोड]',
      email: 'contact@example.org',
      phone: '+91-00000-00000',
      grievanceOfficer: { name: '[शिकायत अधिकारी का नाम]', email: 'grievance@example.org' },
      social: { facebook: '', x: '', youtube: '', instagram: '', whatsappChannel: '', telegram: '' },
    },
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      siteName: 'Rashtriya Pardarshita Prahari',
      tagline: 'Beyond News. Towards Accountability.',
      trustName: 'Pardarshita Prahari Trust',
      editorName: '[Editor name]',
      publisherName: '[Publisher name]',
      address: '[Full address]\n[City, State, PIN]',
      grievanceOfficer: { name: '[Grievance officer name]' },
    },
  })
  log('site settings: placeholders set')
}

// ── Static pages
for (const p of PAGES) {
  await bilingual('pages', p.slug, { title: p.title.hi, content: rt(p.hi), legalReviewPending: Boolean(p.legal), showInFooter: true }, () => ({ title: p.title.en, content: rt(p.en) }))
}
log('pages:', PAGES.length)

// ── Authors
const deskId = await bilingual(
  'authors',
  'prahari-desk',
  { name: 'प्रहरी डेस्क', designation: 'समाचार डेस्क', bio: 'राष्ट्रीय पारदर्शिता प्रहरी की समाचार डेस्क।' },
  () => ({ name: 'Prahari Desk', designation: 'News desk', bio: 'The news desk of Rashtriya Pardarshita Prahari.' }),
)
const sampleAuthorId = await bilingual(
  'authors',
  'sample-reporter',
  { name: 'नमूना संवाददाता', designation: 'काल्पनिक लेखक (डेमो)', bio: 'यह एक काल्पनिक प्रोफ़ाइल है, केवल नमूना सामग्री के लिए।' },
  () => ({ name: 'Sample Reporter', designation: 'Fictional author (demo)', bio: 'A fictional profile used only for sample content.' }),
)

// ── Tags
const TAGS: Record<string, [string, string]> = {
  fssai: ['FSSAI', 'FSSAI'], milavat: ['मिलावट', 'Adulteration'], msp: ['MSP', 'MSP'], kapas: ['कपास', 'Cotton'],
  'ayushman-bharat': ['आयुष्मान भारत', 'Ayushman Bharat'], 'uttar-pradesh': ['उत्तर प्रदेश', 'Uttar Pradesh'], mausam: ['मौसम', 'Weather'],
  mehngai: ['महंगाई', 'Inflation'], rbi: ['RBI', 'RBI'], 'supreme-court': ['सुप्रीम कोर्ट', 'Supreme Court'], 'chunav-ayog': ['चुनाव आयोग', 'Election Commission'],
  isro: ['इसरो', 'ISRO'], ssc: ['SSC', 'SSC'], bharti: ['भर्ती', 'Recruitment'], 'sadak-haadsa': ['सड़क हादसा', 'Road accident'],
  'asian-games': ['एशियाई खेल', 'Asian Games'], 'mahila-sashaktikaran': ['महिला सशक्तिकरण', "Women's empowerment"], namuna: ['नमूना', 'Sample'], rti: ['RTI', 'RTI'],
}
const tagIds: Record<string, number> = {}
for (const [slug, [hi, en]] of Object.entries(TAGS)) tagIds[slug] = await bilingual('tags', slug, { title: hi }, () => ({ title: en }))

// ── Demo news
for (const a of DEMO) {
  await bilingual(
    'articles',
    a.slug,
    {
      title: a.hi.title,
      excerpt: a.hi.excerpt,
      content: rt(a.hi.body),
      format: 'news',
      category: catIds[a.category],
      tags: (a.tags || []).map((t) => tagIds[t]).filter(Boolean),
      author: deskId,
      publishedAt: new Date(a.date).toISOString(),
      featured: Boolean(a.featured),
      externalImage: a.image || {},
      sources: a.sources,
      demoContent: true,
      reviewStatus: 'approved',
      _status: 'published',
    },
    () => ({ title: a.en.title, excerpt: a.en.excerpt, content: rt(a.en.body), _status: 'published' }),
  )
}
log('demo news:', DEMO.length)

// ── Sample documents (fictional) for Documents Speak
async function sampleMedia(name: string, mimetype: string, data: Buffer, alt: string) {
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: name } }, limit: 1 })
  if (existing.docs[0]) return existing.docs[0].id
  return (await payload.create({ collection: 'media', locale: 'hi', data: { alt, credit: 'Sample / नमूना (fictional)', license: 'Own' }, file: { data, mimetype, name, size: data.length } })).id
}
const pdfId = await sampleMedia(
  'sample-rti-reply.pdf',
  'application/pdf',
  samplePdf([
    'SAMPLE - FICTIONAL DOCUMENT - FOR DEMONSTRATION ONLY',
    'Sampurnapur Municipal Council (fictional)',
    'Reply under the Right to Information Act, 2005',
    'RTI No.: SMP/RTI/0000/2026 (fictional)',
    '',
    'Q1. Payments for repair of Ward 7 main road:',
    '    Bill A - dated 12-01-2026 - Rs 4,80,000 - paid',
    '    Bill B - dated 03-09-2026 - Rs 4,65,000 - paid',
    'Q2. Work verification certificate: attached',
    '',
    'Public Information Officer (fictional)',
  ]),
  'नमूना RTI जवाब (काल्पनिक)',
)
const pngId = await sampleMedia(
  'sample-payment-register.png',
  'image/png',
  await sampleLetterPng([
    'भुगतान रजिस्टर — नमूना (काल्पनिक)',
    'Payment register — SAMPLE (fictional)',
    'वार्ड 7 मुख्य सड़क मरम्मत',
    '12-01-2026   बिल A   ₹4,80,000   भुगतान',
    '03-09-2026   बिल B   ₹4,65,000   भुगतान',
    'सत्यापन: ________',
  ]),
  'नमूना भुगतान रजिस्टर (काल्पनिक)',
)

// ── Sample formats
const sampleIds: Record<string, number> = {}
for (const s of SAMPLES) {
  const docs = s.withDocuments
    ? [
        { file: pdfId, title: 'RTI जवाब (नमूना)', source: 'RTI जवाब — काल्पनिक नगर पालिका', reference: 'SMP/RTI/0000/2026' },
        { file: pngId, title: 'भुगतान रजिस्टर (नमूना)', source: 'नगर पालिका रिकॉर्ड — काल्पनिक', reference: 'Register p. 14' },
      ]
    : undefined
  sampleIds[s.key] = await bilingual(
    'articles',
    s.slug,
    {
      title: s.hi.title,
      excerpt: s.hi.excerpt,
      content: rt(s.hi.body),
      format: s.format,
      category: catIds[s.category],
      tags: [tagIds.namuna, ...(s.withDocuments ? [tagIds.rti] : [])],
      author: sampleAuthorId,
      publishedAt: daysAgo(s.daysAgo),
      factCheck: s.factCheck ? { verdict: s.factCheck.verdict, claim: s.factCheck.claim.hi, claimedBy: s.factCheck.claimedBy.hi } : undefined,
      questionStatus: s.questionStatus,
      askedTo: s.askedTo?.hi,
      followUpOf: s.followUpOf ? sampleIds[s.followUpOf] : undefined,
      tracker: s.tracker?.map((t) => ({ stage: t.stage, date: daysAgo(t.daysAgo), status: t.status, note: t.note.hi })),
      investigation: s.investigation ? Object.fromEntries(Object.entries(s.investigation).map(([k, v]) => [k, rt(v.hi)])) : undefined,
      documents: docs,
      sample: true,
      demoContent: true,
      legalReviewed: s.format === 'investigation',
      reviewStatus: 'approved',
      _status: 'published',
    },
    (doc) => ({
      title: s.en.title,
      excerpt: s.en.excerpt,
      content: rt(s.en.body),
      factCheck: s.factCheck ? { ...doc.factCheck, claim: s.factCheck.claim.en, claimedBy: s.factCheck.claimedBy.en } : undefined,
      askedTo: s.askedTo?.en,
      tracker: doc.tracker?.map((row: { id: string }, i: number) => ({ ...row, note: s.tracker![i].note.en })),
      investigation: s.investigation ? Object.fromEntries(Object.entries(s.investigation).map(([k, v]) => [k, rt(v.en)])) : undefined,
      documents: doc.documents?.map((row: { id: string; file: unknown }, i: number) => ({
        ...row,
        file: typeof row.file === 'object' && row.file ? (row.file as { id: number }).id : row.file,
        title: ['RTI reply (sample)', 'Payment register (sample)'][i],
        source: ['RTI reply — fictional municipality', 'Municipal records — fictional'][i],
      })),
      _status: 'published',
    }),
  )
}
log('samples:', SAMPLES.length)

// ── Sample correction (on the Documents Speak sample)
if ((await payload.count({ collection: 'corrections', where: { article: { equals: sampleIds.docs } } })).totalDocs === 0) {
  const c = await payload.create({
    collection: 'corrections',
    locale: 'hi',
    data: { article: sampleIds.docs, type: 'correction', date: daysAgo(3), summary: '(नमूना) पहले संस्करण में बिल B की राशि ₹4,56,000 लिखी गई थी। सही राशि ₹4,65,000 है।' },
  })
  await payload.update({ collection: 'corrections', id: c.id, locale: 'en', data: { summary: '(Sample) An earlier version gave Bill B as ₹4,56,000. The correct amount is ₹4,65,000.' } })
}

// ── Breaking news (demo)
if ((await payload.count({ collection: 'breaking-news' })).totalDocs === 0) {
  for (const b of DEMO_BREAKING) {
    const doc = await payload.create({ collection: 'breaking-news', locale: 'hi', data: { text: b.hi, link: `/hi/news/${b.slug}`, active: true, demoContent: true } })
    await payload.update({ collection: 'breaking-news', id: doc.id, locale: 'en', data: { text: b.en } })
  }
  log('breaking news:', DEMO_BREAKING.length)
}

log('done ✔')
process.exit(0)
