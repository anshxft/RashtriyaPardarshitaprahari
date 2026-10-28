/**
 * Team names + photos from ./team-photos (git-ignored). Safe to run more than once: a member is found by name,
 * created if missing, and gets the photo only when it has none yet.
 * Production: needs BLOB_READ_WRITE_TOKEN in .env.vercel so photos go to the same Blob storage as the website.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { log, payload } from './lib'

if (process.env.DATABASE_URL?.startsWith('postgres') && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN missing in .env.vercel — photos would not reach the website. Stopped.')
  process.exit(1)
}

type M = { file: string; hi: string; en: string; designation?: { hi: string; en: string }; tier?: string; replaces?: string }
const TEAM: M[] = [
  { file: 'arbind-kumar-singh.webp', hi: 'श्री अरबिंद कुमार सिंह (राठौड़ साहब)', en: 'Shri Arbind Kumar Singh (Rathaur Sahab)', designation: { hi: 'संपादक', en: 'Editor' }, tier: 'editor-in-chief', replaces: '[प्रधान संपादक का नाम]' },
  { file: 'radha-mohan.webp', hi: 'एडवोकेट राधा मोहन', en: 'Advocate Radha Mohan' },
  { file: 'lakhicharan-munda.webp', hi: 'श्री लखीचरण मुंडा', en: 'Shri Lakhicharan Munda' },
  { file: 'sanjeev-prasad-sahu.webp', hi: 'संजीव प्रसाद साहू', en: 'Sanjeev Prasad Sahu', designation: { hi: 'टीम सदस्य', en: 'Team member' }, tier: 'editorial' },
  { file: 'anwar-ali.webp', hi: 'अनवर अली', en: 'Anwar Ali', designation: { hi: 'टीम सदस्य', en: 'Team member' }, tier: 'editorial' },
  { file: 'sumit-prasad.webp', hi: 'सुमित प्रसाद', en: 'Sumit Prasad', designation: { hi: 'टीम सदस्य', en: 'Team member' }, tier: 'editorial' },
]

const find = async (name: string) =>
  (await payload.find({ collection: 'team-members', where: { name: { equals: name } }, locale: 'hi', limit: 1, depth: 0, draft: true })).docs[0] as { id: number; photo?: unknown } | undefined

for (const m of TEAM) {
  let doc = (await find(m.hi)) || (m.replaces ? await find(m.replaces) : undefined)
  if (!doc) {
    doc = (await payload.create({ collection: 'team-members', locale: 'hi', data: { name: m.hi, designation: m.designation!.hi, tier: m.tier, state: 'Jharkhand', _status: 'published' } as never })) as never
    log('team: added —', m.hi)
  }
  const data: Record<string, unknown> = { name: m.hi, _status: 'published' }
  if (m.designation) data.designation = m.designation.hi
  if (m.tier) data.tier = m.tier
  if (!doc!.photo) {
    const buf = readFileSync(path.join(process.cwd(), 'team-photos', m.file))
    const media = await payload.create({ collection: 'media', locale: 'hi', data: { alt: m.hi } as never, file: { data: buf, mimetype: 'image/webp', name: m.file, size: buf.length } })
    data.photo = media.id
  }
  await payload.update({ collection: 'team-members', id: doc!.id, locale: 'hi', data: data as never })
  await payload.update({ collection: 'team-members', id: doc!.id, locale: 'en', data: { name: m.en, ...(m.designation ? { designation: m.designation.en } : {}), _status: 'published' } as never })
  log('team: ready —', m.hi)
}
log('team photos done ✔')
process.exit(0)
