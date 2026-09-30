// Self-check for the link-card metadata reader and its SSRF guard. Run: npm run check
import assert from 'node:assert/strict'
import { isPrivateAddress, parseMeta } from '../src/lib/linkMeta.ts'

// Public vs internal addresses
for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.9', '172.31.255.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) assert.ok(isPrivateAddress(ip), `${ip} must be blocked`)
for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.63.0.1', '2606:4700:4700::1111']) assert.ok(!isPrivateAddress(ip), `${ip} must be allowed`)

// Open Graph first, relative image resolved, entities decoded, whitespace collapsed
const html = `<html><head><title>Fallback title</title>
<meta property="og:title" content="Big &amp; bold   headline">
<meta property="og:site_name" content="Example Times">
<meta property="og:description" content='Short "summary" here'>
<meta property="og:image" content="/img/cover.jpg">
</head></html>`
const m = parseMeta(html, 'https://www.example.com/news/1')
assert.equal(m.title, 'Big & bold headline')
assert.equal(m.siteName, 'Example Times')
assert.equal(m.description, 'Short "summary" here')
assert.equal(m.imageUrl, 'https://www.example.com/img/cover.jpg')

// Fallbacks: <title> and hostname; javascript: images are dropped
const n = parseMeta('<title>Only title</title><meta property="og:image" content="javascript:alert(1)">', 'https://news.example.org/x')
assert.equal(n.title, 'Only title')
assert.equal(n.siteName, 'news.example.org')
assert.equal(n.imageUrl, undefined)
console.log('link checks passed')
