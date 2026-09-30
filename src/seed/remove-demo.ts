/** npm run demo:remove — deletes every demoContent article (incl. samples), their corrections, demo breaking news and sample media. */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const demo = await payload.find({ collection: 'articles', where: { demoContent: { equals: true } }, limit: 1000, depth: 0, draft: true })
const ids = demo.docs.map((d) => d.id)
// Sample documents = files attached to demo articles that carry the seed's "Sample" credit.
const fileIds = demo.docs.flatMap((d) => (d.documents || []).map((x) => (typeof x.file === 'object' ? x.file.id : x.file)))

if (ids.length) {
  await payload.delete({ collection: 'corrections', where: { article: { in: ids } } })
  // Unlink follow-ups first so relationships don't point at deleted docs.
  await payload.update({ collection: 'articles', where: { followUpOf: { in: ids } }, data: { followUpOf: null } })
  await payload.delete({ collection: 'articles', where: { id: { in: ids } } })
}
const b = await payload.delete({ collection: 'breaking-news', where: { demoContent: { equals: true } } })
const m = fileIds.length
  ? await payload.delete({ collection: 'media', where: { and: [{ id: { in: fileIds } }, { credit: { equals: 'Sample / नमूना (fictional)' } }] } })
  : { docs: [] }
await payload.delete({ collection: 'authors', where: { slug: { equals: 'sample-reporter' } } })
const tm = await payload.delete({ collection: 'team-members', where: { demoContent: { equals: true } } })
const vd = await payload.delete({ collection: 'videos', where: { demoContent: { equals: true } } })

console.log(`Removed ${ids.length} demo/sample articles, ${b.docs.length} breaking items, ${m.docs.length} sample files, ${tm.docs.length} sample team profiles, ${vd.docs.length} sample videos.`)
process.exit(0)
