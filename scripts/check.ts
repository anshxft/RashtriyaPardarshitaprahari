// Self-check for form validation, file sniffing, rate limiting and slugs. Run: npm run check
import assert from 'node:assert/strict'
import { rateLimited, sniffType, validate } from '../src/lib/forms.ts'
import { slugify } from '../src/lib/slugify.ts'
import { GEO, pack, pageBottom, variantsFor, type EpStory } from '../src/lib/epaper.ts'
import { resolveLayout } from '../src/lib/layout.ts'

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

console.log('all checks passed')
