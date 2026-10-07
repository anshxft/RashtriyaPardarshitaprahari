// Local end-to-end check of the Round 4 news lifecycle through Payload (same hooks the Desk uses):
//   npx payload run scripts/try-lifecycle.ts
// Creates a throwaway story, publishes, edits (version 1.1), archives, re-publishes (B), trashes, restores, purges,
// and prints the audit trail. Run against the LOCAL database only.
import config from '@payload-config'
import { getPayload } from 'payload'
import { newsStatus, versionLabel } from '../src/lib/newsStatus'
import { paragraphsToLexical } from '../src/lib/lexical'

const payload = await getPayload({ config })
if (!String(process.env.DATABASE_URL || '').startsWith('file:')) throw new Error('local SQLite only')
const admin = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })).docs[0]
const cat = (await payload.find({ collection: 'categories', limit: 1 })).docs[0]
const step = async (label: string, fn: () => Promise<unknown>) => {
  await fn()
  const a = await payload.findByID({ collection: 'articles', id, draft: true, depth: 0 }).catch(() => null)
  console.log(label.padEnd(26), a ? `${newsStatus(a).padEnd(10)} v${versionLabel(a.versionMinor)} ${a.newsId ?? ''} revisions=${a.revisions?.length ?? 0}` : 'GONE')
}

const doc = await payload.create({
  collection: 'articles',
  locale: 'hi',
  user: admin,
  draft: true,
  data: { title: 'जीवनचक्र परीक्षण खबर (काल्पनिक)', category: cat.id, reporterName: 'परीक्षण', location: 'रांची', content: paragraphsToLexical(['पहला पैरा।']), _status: 'draft' } as never,
})
const id = doc.id
console.log('created', id)
await step('publish', () => payload.update({ collection: 'articles', id, user: admin, data: { _status: 'published' } as never }))
await step('edit (headline)', () => payload.update({ collection: 'articles', id, user: admin, data: { title: 'जीवनचक्र परीक्षण खबर — बदली हेडलाइन', _status: 'published' } as never }))
await step('archive', () => payload.update({ collection: 'articles', id, user: admin, overrideAccess: true, data: { lifecycle: 'archived', _status: 'published' } as never, context: { auditAction: 'archive' } }))
await step('republish (B updated)', () => payload.update({ collection: 'articles', id, user: admin, overrideAccess: true, data: { lifecycle: 'active', _status: 'published' } as never, context: { auditAction: 'republish', republish: 'updated' } }))
await step('trash', () => payload.update({ collection: 'articles', id, user: admin, overrideAccess: true, data: { lifecycle: 'trashed', trashReason: 'Technical error', _status: 'published' } as never, context: { auditAction: 'delete', reason: 'Technical error' } }))
// public queries must not see it now
const pub = await payload.find({ collection: 'articles', where: { id: { equals: id } }, overrideAccess: false, depth: 0 })
console.log('visible to public while trashed:', pub.totalDocs)
await step('restore (→ archived)', () => payload.update({ collection: 'articles', id, user: admin, overrideAccess: true, data: { lifecycle: 'archived', _status: 'published' } as never, context: { auditAction: 'restore' } }))
const apiDelete = await payload.delete({ collection: 'articles', id, overrideAccess: false, user: admin }).then(() => 'DELETED (bad)').catch(() => 'blocked ✔')
console.log('API hard delete:', apiDelete)
await step('purge', () => payload.delete({ collection: 'articles', id, overrideAccess: true }))
const versions = await payload.findVersions({ collection: 'articles', where: { parent: { equals: id } }, limit: 0 })
const log = await payload.find({ collection: 'audit-log', where: { articleId: { equals: id } }, sort: 'createdAt', limit: 50, depth: 0 })
console.log('versions kept (before purge cleanup):', versions.totalDocs)
console.log('audit:', log.docs.map((e) => `${e.action}${e.version ? `@${e.version}` : ''}${e.changedFields ? `[${e.changedFields}]` : ''}${e.reason ? `(${e.reason})` : ''}`).join(' → '))
const tamper = await payload.update({ collection: 'audit-log', id: log.docs[0].id, overrideAccess: false, user: admin, data: { action: 'x' } as never }).then(() => 'EDITED (bad)').catch(() => 'blocked ✔')
console.log('audit entry edit by admin via API:', tamper)
process.exit(0)
