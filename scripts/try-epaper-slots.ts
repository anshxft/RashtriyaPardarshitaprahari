// LOCAL ONLY: creates a fictional test ad (e-paper column) + a fictional “समाज का आइना” column for today, and switches
// ads on, so the e-paper slots can be seen:  npx payload run scripts/try-epaper-slots.ts
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { paragraphsToLexical } from '../src/lib/lexical'

const payload = await getPayload({ config })
if (!String(process.env.DATABASE_URL || '').startsWith('file:')) throw new Error('local SQLite only')
const admin = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })).docs[0]
const aina = (await payload.find({ collection: 'categories', where: { slug: { equals: 'samaj-ka-aina' } }, limit: 1 })).docs[0]
const img = await payload.create({ collection: 'media', data: { alt: 'परीक्षण विज्ञापन', credit: 'Sample' } as never, filePath: path.join(process.cwd(), 'public', 'og-default.jpg') })
await payload.create({ collection: 'ads', data: { title: 'परीक्षण विज्ञापन (नमूना)', image: img.id, placements: ['epaper', 'home-top'], active: true } as never })
await payload.updateGlobal({ slug: 'site-settings', data: { adsEnabled: true } as never })
await payload.create({
  collection: 'articles',
  locale: 'hi',
  user: admin,
  data: {
    title: 'समाज का आइना: पड़ोस की लाइब्रेरी (नमूना)',
    category: aina.id,
    reporterName: 'प्रधान संपादक',
    location: 'रांची',
    sample: true,
    demoContent: true,
    content: paragraphsToLexical(['यह एक काल्पनिक नमूना स्तंभ है, ताकि ई-पेपर में “समाज का आइना” की तय जगह देखी जा सके।', 'असली स्तंभ प्रधान संपादक लिखेंगे।']),
    _status: 'published',
  } as never,
})
console.log('✓ test ad + column created (local)')
process.exit(0)
