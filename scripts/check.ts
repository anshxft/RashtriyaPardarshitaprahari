// Self-check for form validation, file sniffing, rate limiting and slugs. Run: npm run check
import assert from 'node:assert/strict'
import { rateLimited, sniffType, validate } from '../src/lib/forms.ts'
import { slugify } from '../src/lib/slugify.ts'

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

console.log('all checks passed')
