// Self-check for form validation, file sniffing, rate limiting and slugs. Run: npm run check
import assert from 'node:assert/strict'
import { rateLimited, sniffType, validate } from '../src/lib/forms.ts'
import { slugify } from '../src/lib/slugify.ts'
import { GEO, pack, pageBottom, variantsFor, type EpStory } from '../src/lib/epaper.ts'
import { resolveLayout } from '../src/lib/layout.ts'
import { jwtUserId, passwordProblem, seal, totpAt, totpVerify, twofaIssue, twofaValid, unseal } from '../src/lib/security.ts'
import { buttonsFor, newsStatus, publishChecklist } from '../src/lib/newsStatus.ts'
import { allowed, DEFAULTS, matrixFrom } from '../src/lib/permissions.ts'
import { downloadName, slugLatin } from '../src/lib/fileName.ts'
import { mobile10, officeNumbers, waLink } from '../src/lib/contact.ts'
import { videoSize, watermarkArgs } from '../src/lib/videoArgs.ts'

const fields = [
  { name: 'name', type: 'text', label: { hi: '', en: '' }, required: true, identity: true, maxLength: 5 },
  { name: 'email', type: 'email', label: { hi: '', en: '' } },
  { name: 'state', type: 'select', label: { hi: '', en: '' }, required: true, options: [{ value: 'Bihar', hi: '', en: '' }] },
] as const
const fd = (o: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(o)) f.set(k, v)
  return f
}

// required / anonymity / select whitelist / email / maxLength
assert.deepEqual(Object.keys(validate([...fields] as never, fd({}), 'en').errors).sort(), ['name', 'state'])
assert.deepEqual(Object.keys(validate([...fields] as never, fd({ state: 'Bihar' }), 'en', true).errors), [])
assert.ok(validate([...fields] as never, fd({ name: 'A', state: 'Goa' }), 'en').errors.state)
assert.ok(validate([...fields] as never, fd({ name: 'A', state: 'Bihar', email: 'nope' }), 'en').errors.email)
assert.ok(validate([...fields] as never, fd({ name: 'toolong', state: 'Bihar' }), 'en').errors.name)

// file sniffing ignores the claimed MIME type
assert.equal(sniffType(Buffer.from('%PDF-1.7 ...')), 'application/pdf')
assert.equal(sniffType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0])), 'image/png')
assert.equal(sniffType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg')
assert.equal(sniffType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ')), 'image/webp')
assert.equal(sniffType(Buffer.from('<script>alert(1)</script>')), null)

// rate limit: 5 allowed, 6th blocked
for (let i = 0; i < 5; i++) assert.equal(rateLimited('t', 5), false)
assert.equal(rateLimited('t', 5), true)

// Devanagari slugs keep vowel signs
assert.equal(slugify('किसान आंदोलन: नई मांगें!'), 'किसान-आंदोलन-नई-मांगें')
assert.equal(slugify('  Road Safety 2026 '), 'road-safety-2026')

// ── e-paper packer: no overlaps, everything inside the page, pins honoured, long stories split (never shrink below 90%)
const story = (id: string, chars: number, o: Partial<EpStory['layout']> & { template?: string } = {}): EpStory => ({
  id,
  title: 'शीर्षक ' + id,
  paragraphs: Array.from({ length: Math.max(1, Math.ceil(chars / 400)) }, () => 'क'.repeat(400)),
  url: '/x',
  publishedAt: '2026-09-30T05:00:00Z',
  layout: resolveLayout({ columns: 2, ...o }, { hasPhoto: false }),
})
const fake = (s: EpStory, v: { cols: number; scale: number; take?: number }) => {
  const chars = s.paragraphs.slice(0, v.take ?? s.paragraphs.length).join('').length
  const perLine = Math.max(8, Math.floor((v.cols * 160) / (13.5 * v.scale * 0.55)))
  return 60 + Math.ceil(chars / perLine) * 22 * v.scale
}
const many = Array.from({ length: 30 }, (_, i) => story('s' + i, 300 + ((i * 397) % 2500), { columns: 1 + (i % 3) }))
many.push(story('pinned', 500, { epaperPage: 2 }), story('huge', 60000, { columns: 4, autoFit: true }))
const pages = pack(many, fake)
const all = pages.flatMap((p) => p.placed)
for (const p of pages)
  for (const a of p.placed) {
    assert.ok(a.x >= GEO.margin && a.x + a.w <= GEO.pageW - GEO.margin + 0.5, 'inside page width')
    assert.ok(a.y >= GEO.margin && a.y + a.h <= pageBottom + 0.5, 'inside page height')
    for (const b of p.placed) if (a !== b) assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'blocks never overlap')
  }
assert.equal(all.find((a) => a.id === 'pinned')!.page, 2, 'pinned page honoured')
assert.ok(all.filter((a) => a.id.startsWith('huge')).length > 1, 'huge story is continued on later pages')
assert.ok(all.every((a) => a.variant.scale >= 0.9 - 1e-9), 'font never below 90%')
assert.equal(variantsFor(story('x', 100, { autoFit: false }))[0].cols, 2)
assert.ok(variantsFor(story('x', 100)).every((v) => v.cols <= 4), 'widening capped at 4 columns')

// video logo: real-pixel size from video width (14% of 1280 = 180), top-right, never wider than 1080p; phone rotation swaps size
const g = watermarkArgs('i', 'l', 'o', {}, 1280)[watermarkArgs('i', 'l', 'o', {}, 1280).indexOf('-filter_complex') + 1]
assert.ok(g.includes('scale=180:-2') && g.includes('overlay=W-w-0.0250*W:0.0250*W'), g)
assert.ok(watermarkArgs('i', 'l', 'o', { sizePercent: 10 }, 4000).join(' ').includes('scale=192:-2'), 'capped at 1920 wide')
assert.deepEqual(videoSize('Stream #0:0: Video: h264, yuv420p, 1920x1080 [SAR 1:1]'), { w: 1920, h: 1080 })
assert.deepEqual(videoSize('Video: h264, 1920x1080, 30 fps\n rotate          : 90'), { w: 1080, h: 1920 })

// security: password rules, RFC 6238 TOTP test vector (secret "12345678901234567890"), sealed data, signed 2FA cookie
assert.ok(passwordProblem('short1A!') && passwordProblem('alllowercase1234!') && passwordProblem('NoSymbolsHere123') && passwordProblem('Prahari@2026xx'))
assert.equal(passwordProblem('Blue-Tiger#4809'), null)
const RFC = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
assert.equal(totpAt(RFC, 1), '287082')
assert.equal(totpVerify(RFC, '287082', 0, 59_000), 1)
assert.equal(totpVerify(RFC, '287082', 1, 59_000), null, 'a code that was already used is refused')
assert.equal(totpVerify(RFC, '000000', 0, 59_000), null)
assert.equal(unseal(seal('गुप्त')).toString(), 'गुप्त')
assert.throws(() => unseal(seal('x').slice(0, -2) + 'AA'))
const ck = twofaIssue(7)
assert.ok(twofaValid(ck, 7) && !twofaValid(ck, 8) && !twofaValid(ck.slice(0, -1) + 'x', 7) && !twofaValid(ck, 7, Date.now() + 9 * 3600_000) && !twofaValid(undefined, 7))
assert.equal(jwtUserId('a.' + Buffer.from('{"id":5}').toString('base64url') + '.c'), '5')

// contact numbers: every common way of writing an Indian mobile number → 10 digits; junk never becomes a link
for (const v of ['9431924522', '94319 24522', '+91-9431924522', '919431924522', '09431924522']) assert.equal(mobile10(v), '9431924522')
for (const v of ['12345', '5431924522', '', null]) assert.equal(mobile10(v), null)
assert.equal(waLink('9835704715', 'नमस्ते'), 'https://wa.me/919835704715?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87')
assert.deepEqual(officeNumbers([{ title: 'A', phones: [{ number: '9431924522', kind: 'whatsapp' }, { number: '8580074522', kind: 'call' }, { number: 'x' }] }]).map((n) => [n.number, n.call, n.whatsapp]), [['9431924522', false, true], ['8580074522', true, false]])

// role matrix: admin always; editor publishes but cannot delete published news by default; matrix edits take effect
const ed = { id: 2, role: 'editor' }, rep = { id: 3, role: 'reporter' }, adm = { id: 1, role: 'admin' }
assert.ok(allowed(adm, 'trashPublished') && allowed(ed, 'publish') && !allowed(ed, 'trashPublished') && !allowed(rep, 'publish'))
assert.ok(!allowed({ id: 2, role: 'editor', canPublish: false }, 'publish'), 'per-user publish switch')
assert.ok(allowed(ed, 'trashPublished', matrixFrom({ trashPublished: { editor: true } })), 'admin can switch a right on')
assert.ok(!allowed(ed, 'publish', matrixFrom({ publish: { editor: false } })))
assert.deepEqual(matrixFrom(null), DEFAULTS)
assert.ok(!allowed({ id: 9, role: 'hacker' }, 'download') && !allowed(null, 'download'))
// status
const past = '2026-01-01T00:00:00Z', future = '2999-01-01T00:00:00Z'
assert.equal(newsStatus({ _status: 'draft' }), 'draft')
assert.equal(newsStatus({ _status: 'draft', reviewStatus: 'submitted' }), 'pending')
assert.equal(newsStatus({ _status: 'published', publishedAt: future }), 'scheduled')
assert.equal(newsStatus({ _status: 'published', publishedAt: past }), 'published')
assert.equal(newsStatus({ _status: 'published', publishedAt: past, versionMinor: 2 }), 'updated')
assert.equal(newsStatus({ _status: 'published', lifecycle: 'archived' }), 'archived')
assert.equal(newsStatus({ _status: 'published', lifecycle: 'trashed' }), 'trashed')
// buttons by status × role (Part 1.1 / 1.8)
const b = (s: Parameters<typeof buttonsFor>[0], u: Parameters<typeof buttonsFor>[1], owner: number) => buttonsFor(s, u, owner, {}, DEFAULTS)
assert.deepEqual(b('draft', rep, 3).main, ['edit', 'preview', 'delete'], 'reporter: own draft, no publish')
assert.deepEqual(b('draft', ed, 3).main, ['edit', 'preview', 'publish'], 'editor cannot trash someone else’s draft by default')
assert.deepEqual(b('published', ed, 3).main, ['preview', 'edit', 'download', 'share', 'archive'], 'editor: no re-publish / delete by default')
assert.ok(!b('published', ed, 3).more.includes('delete'))
assert.ok(b('published', adm, 3).main.includes('republish') && b('published', adm, 3).more.includes('delete'))
assert.deepEqual(b('trashed', ed, 2).main, [], 'only admin restores from trash')
assert.deepEqual(b('trashed', adm, 2).main, ['restoreTrash', 'purge'])
assert.ok(b('archived', { id: 5, role: 'senior' }, 3).main.includes('restorePublish'))
assert.ok(!b('pending', rep, 3).main.includes('approve') && b('pending', { id: 5, role: 'senior' }, 3).main.includes('approve'))
// publish checklist
assert.ok(publishChecklist({ title: 'x', reporterName: 'r', location: 'l', categoryId: 1, body: 'b' }).every((i) => !i.required || i.ok))
assert.ok(publishChecklist({ title: 'x', categoryId: 1, body: 'b' }).some((i) => i.required && !i.ok), 'reporter + location required')
// safe download names
assert.equal(slugLatin('बिहार में सड़क सुरक्षा'), 'bihar-men-sarak-suraksha')
assert.equal(downloadName('NTP-2026-09-30-0001', 'राम / "test" <x>?', '2026-09-30T20:00:00Z', 'MP4'), 'NTP-2026-10-01-0001'.replace('2026-10-01', '2026-09-30') + '_ram-test-x_2026-10-01.mp4')
assert.ok(downloadName(null, '', null, 'jpg') === 'NTP-DRAFT_news_undated.jpg')
assert.ok(/^[A-Za-z0-9_.-]+$/.test(downloadName('NTP-1', 'क्या?:*|\/ ॐ'.repeat(30), '2026-01-01', 'png')))

console.log('all checks passed')
