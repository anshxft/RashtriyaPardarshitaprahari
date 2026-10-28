/**
 * One-off: first advertisement (सावित्री प्रेस) on the home page, inside stories and in the e-paper column, and switches
 * ads on in Site Settings. Safe to run twice. Production needs BLOB_READ_WRITE_TOKEN in .env.vercel (image storage).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { log, payload } from './lib'

if (process.env.DATABASE_URL?.startsWith('postgres') && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN missing in .env.vercel — the ad image would not reach the website. Stopped.')
  process.exit(1)
}

const TITLE = 'सावित्री प्रेस — शादी कार्ड एवं प्रिंटिंग'
const found = (await payload.find({ collection: 'ads', where: { title: { equals: TITLE } }, limit: 1, depth: 0 })).docs[0]
if (found) log('ad already there — id', found.id)
else {
  const buf = readFileSync(path.join(process.cwd(), 'news-photos', 'ad-savitri-press.jpg'))
  const img = await payload.create({ collection: 'media', locale: 'hi', data: { alt: TITLE, credit: 'विज्ञापन' } as never, file: { data: buf, mimetype: 'image/jpeg', name: 'ad-savitri-press.jpg', size: buf.length } })
  const ad = await payload.create({ collection: 'ads', data: { title: TITLE, image: img.id, placements: ['home-top', 'article', 'epaper'], active: true } as never })
  log('ad created — id', ad.id)
}
await payload.updateGlobal({ slug: 'site-settings', data: { adsEnabled: true } as never })
log('ads switched on ✔')
process.exit(0)
