/**
 * One-off (29 Oct 2026): replaces Anwar Ali's team photo with the better-quality one.
 * Put the photo at ./team-photos/anwar-ali-new.jpg (git-ignored) first. Needs BLOB_READ_WRITE_TOKEN in .env.vercel.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { log, payload } from './lib'

if (process.env.DATABASE_URL?.startsWith('postgres') && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN missing in .env.vercel — the photo would not reach the website. Stopped.')
  process.exit(1)
}
const file = ['anwar-ali-new.jpg', 'anwar-ali-new.jpeg', 'anwar-ali-new.png', 'anwar-ali-new.webp'].map((f) => path.join(process.cwd(), 'team-photos', f)).find(existsSync)
if (!file) {
  console.error('Photo not found: save it as team-photos/anwar-ali-new.jpg in the project folder. Stopped.')
  process.exit(1)
}
const doc = (await payload.find({ collection: 'team-members', where: { name: { like: 'अनवर' } }, locale: 'hi', limit: 1, depth: 0, draft: true })).docs[0] as { id: number; name: string } | undefined
if (!doc) {
  console.error('No team member named अनवर found. Stopped.')
  process.exit(1)
}
const ext = path.extname(file).slice(1).replace('jpg', 'jpeg')
const buf = readFileSync(file)
const media = await payload.create({ collection: 'media', locale: 'hi', data: { alt: doc.name } as never, file: { data: buf, mimetype: `image/${ext}`, name: path.basename(file), size: buf.length } })
await payload.update({ collection: 'team-members', id: doc.id, locale: 'hi', data: { photo: media.id } as never })
log('photo updated —', doc.name)
process.exit(0)
