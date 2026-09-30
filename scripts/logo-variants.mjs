// Regenerates logo sizes from public/logo-original.jpg. Run: node scripts/logo-variants.mjs
import sharp from 'sharp'
const src = 'public/logo-original.jpg'
await sharp(src).resize(512).png().toFile('public/logo.png')
await sharp(src).resize(160).webp({ quality: 90 }).toFile('public/logo-160.webp')
// Emblem = the globe + scales centre, circular, for favicon / tiny sizes.
const size = 500
const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`)
const emblem = await sharp(src).extract({ left: 385, top: 385, width: size, height: size })
  .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
await sharp(emblem).resize(256).png().toFile('public/emblem.png')
await sharp(emblem).resize(64).png().toFile('src/app/icon.png')
await sharp(src).resize(180).flatten({ background: '#ffffff' }).png().toFile('src/app/apple-icon.png')
await sharp(src).resize(1200, 630, { fit: 'contain', background: '#0b1f4d' }).jpeg({ quality: 85 }).toFile('public/og-default.jpg')
// Watermark for videos: the full round badge with the white square corners made transparent.
const wm = 900
const round = Buffer.from(`<svg width="${wm}" height="${wm}"><circle cx="${wm / 2}" cy="${wm / 2}" r="${wm / 2 - 6}"/></svg>`)
await sharp(src).resize(wm).composite([{ input: round, blend: 'dest-in' }]).png().toFile('public/logo-watermark.png')
console.log('done')
