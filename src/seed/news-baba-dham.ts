/**
 * One-off: publishes “विशेष श्रृंखला : भाग–1 — सत्यनारायण बाबाधाम, रायगढ़” with its four photos (./news-photos, git-ignored).
 * Text is the editor's, unchanged. Safe to run twice: an existing story with the same title is left alone.
 * Production: needs BLOB_READ_WRITE_TOKEN in .env.vercel so the photos reach the website's storage.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { paragraphsToLexical } from '../lib/lexical'
import { bilingual, findSlug, log, payload } from './lib'

if (process.env.DATABASE_URL?.startsWith('postgres') && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN missing in .env.vercel — photos would not reach the website. Stopped.')
  process.exit(1)
}

const TITLE = 'छत्तीसगढ़ के रायगढ़ जिले के श्री श्री 108 श्री सत्यनारायण बाबाधाम पहुंची राष्ट्रीय पारदर्शिता प्रहरी की संपादकीय टीम, गणमान्य लोगों के साथ किया परिसर का निरीक्षण'
const exists = await payload.find({ collection: 'articles', where: { title: { equals: TITLE } }, locale: 'hi', limit: 1, depth: 0 }) // live docs only (old versions of deleted tests must not count)
if (exists.docs[0]) {
  log('story already there — id', exists.docs[0].id)
  process.exit(0)
}

const CREDIT = 'राष्ट्रीय पारदर्शिता प्रहरी'
async function photo(file: string, alt: string) {
  const buf = readFileSync(path.join(process.cwd(), 'news-photos', file))
  const m = await payload.create({ collection: 'media', locale: 'hi', data: { alt, credit: CREDIT } as never, file: { data: buf, mimetype: 'image/jpeg', name: file, size: buf.length } })
  return m.id as number
}
const hero = await photo('baba-dham-garbhagriha.jpg', 'रायगढ़ स्थित श्री श्री 108 श्री सत्यनारायण बाबाधाम परिसर')
const board = await photo('baba-dham-vivaran-patt.jpg', 'बाबाधाम परिसर में प्रदर्शित श्री श्री 108 श्री सत्यनारायण बाबा जी का विवरण-पट्ट')
const years1 = await photo('baba-tapasya-2002-2013.jpg', 'धाम परिसर में प्रदर्शित वर्ष 2002 से 2013 तक के चित्र')
const years2 = await photo('baba-tapasya-2014-2025.jpg', 'धाम परिसर में प्रदर्शित वर्ष 2014 से 2025 तक के चित्र')

const P = [
  'रायगढ़, 28 अक्टूबर 2026।',
  'राष्ट्रीय पारदर्शिता प्रहरी की संपादकीय टीम ने 27 अक्टूबर 2026 की रात रायगढ़ के कई गणमान्य लोगों के साथ श्री श्री 108 श्री सत्यनारायण बाबाधाम परिसर का निरीक्षण किया। इस दौरान धाम से जुड़ी धार्मिक आस्था, सांस्कृतिक विरासत और उपलब्ध स्थानीय जानकारियों को समझने की दिशा में पहल की गई।',
  'भारतीय संस्कृति में धार्मिक एवं आध्यात्मिक स्थलों का महत्व केवल पूजा-अर्चना तक सीमित नहीं है। ये स्थल स्थानीय समाज की मान्यताओं, परंपराओं, सामूहिक स्मृतियों और सांस्कृतिक पहचान से भी जुड़े होते हैं। इसी दृष्टिकोण से राष्ट्रीय पारदर्शिता प्रहरी की संपादकीय टीम ने बाबाधाम परिसर का अवलोकन किया, ताकि धाम से संबंधित विभिन्न पहलुओं को क्रमबद्ध तरीके से पाठकों के सामने प्रस्तुत किया जा सके।',
  'धाम परिसर में प्रदर्शित विवरण-पट्ट पर बाबा की तपस्या, मंदिर निर्माण और धार्मिक गतिविधियों से संबंधित जानकारियां अंकित हैं। इन विवरणों के साथ स्थानीय लोगों की स्मृतियों और उपलब्ध अभिलेखों का अध्ययन इस स्थल की सांस्कृतिक पृष्ठभूमि को बेहतर ढंग से समझने में सहायक हो सकता है।',
  'राष्ट्रीय पारदर्शिता प्रहरी इस निरीक्षण से संबंधित जानकारी को एक विशेष श्रृंखला के रूप में क्रमशः प्रकाशित करेगा। आगामी भागों में धाम से जुड़ी उपलब्ध जानकारियों, स्थानीय परंपराओं, ऐतिहासिक विवरणों और अन्य महत्वपूर्ण पहलुओं को अलग-अलग प्रस्तुत किया जाएगा। उद्देश्य है कि पाठकों तक सूचनाएं व्यवस्थित, संतुलित और तथ्यपरक तरीके से पहुंचें।',
  'यह विशेष श्रृंखला केवल एक धार्मिक स्थल के परिचय तक सीमित नहीं रहेगी, बल्कि स्थानीय सांस्कृतिक विरासत को समझने, उसकी स्मृतियों को संकलित करने और संरक्षण के प्रति जागरूकता बढ़ाने का प्रयास भी होगी।',
  'राष्ट्रीय पारदर्शिता प्रहरी — तथ्य • पारदर्शिता • जवाबदेही • जनहित',
  'संपादकीय टिप्पणी: यह समाचार 27 अक्टूबर 2026 की रात संपादकीय टीम द्वारा किए गए परिसर निरीक्षण तथा उपलब्ध जानकारी के आधार पर तैयार किया गया है। धाम से संबंधित ऐतिहासिक विवरणों की स्वतंत्र पुष्टि आवश्यकतानुसार उपलब्ध अभिलेखों और अन्य विश्वसनीय स्रोतों से की जाएगी।',
]

// Body paragraphs with the three other photos placed where the text talks about them (the e-paper uses the text only).
const doc = paragraphsToLexical(P) as unknown as { root: { children: unknown[] } }
const upload = (id: number) => ({ type: 'upload', version: 3, format: '', relationTo: 'media', value: id, fields: null })
const kids = doc.root.children
kids.splice(4, 0, upload(board)) // after the paragraph about the विवरण-पट्ट
kids.splice(5, 0, upload(years1), upload(years2))
const note = kids[kids.length - 1] as { children: { format: number }[] }
note.children.forEach((t) => (t.format = 2)) // editorial note in italics

const tagIds: number[] = []
for (const [slug, hi, en] of [
  ['chhattisgarh', 'छत्तीसगढ़', 'Chhattisgarh'],
  ['raigarh', 'रायगढ़', 'Raigarh'],
  ['vishesh-shrinkhla', 'विशेष श्रृंखला', 'Special series'],
] as const)
  tagIds.push(await bilingual('tags', slug, { title: hi }, () => ({ title: en })))

const cat = await findSlug('categories', 'sanskriti-virasat')
const a = await payload.create({
  collection: 'articles',
  locale: 'hi',
  data: {
    title: TITLE,
    subheadline: 'विशेष श्रृंखला : भाग–1 · संस्कृति, विरासत एवं भारतीय ज्ञान परंपरा',
    excerpt: 'संपादकीय टीम ने 27 अक्टूबर की रात रायगढ़ के गणमान्य लोगों के साथ बाबाधाम परिसर का निरीक्षण किया; धाम से जुड़ी जानकारी विशेष श्रृंखला में क्रमशः प्रकाशित होगी।',
    category: cat?.id,
    heroImage: hero,
    content: doc,
    location: 'रायगढ़, छत्तीसगढ़',
    reporterName: 'संपादकीय टीम',
    tags: tagIds,
    format: 'news',
    publishedAt: new Date().toISOString(),
    _status: 'published',
  } as never,
})
log('published — id', a.id, a.newsId)
process.exit(0)
