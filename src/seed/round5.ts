/**
 * npm run seed:round5 — Round 5 client changes for an EXISTING database. Safe to run more than once.
 *  • descriptor without “आधिकारिक / Official”
 *  • section renames + 2 new sections
 *  • phone numbers removed from the two administrative offices (addresses kept)
 *  • Editor may re-publish
 *  • “संपादक का संदेश” page text + editor name
 */
import { bilingual, findSlug, log, payload } from './lib'
import { rt } from './helpers'

type Office = { id?: string; title?: string; phones?: unknown[] }
type S = { descriptor?: string; offices?: Office[] }

// ── Site settings
const NO_PHONES = ['प्रशासनिक कार्यालय', 'द्वितीय प्रशासनिक कार्यालय', 'Administrative Office', 'Second Administrative Office']
for (const [locale, word] of [
  ['hi', 'आधिकारिक '],
  ['en', 'Official '],
] as const) {
  const s = (await payload.findGlobal({ slug: 'site-settings', locale, depth: 0 })) as S
  const data: Record<string, unknown> = { editorName: 'श्री एके सिंह (राठौड़ साहब)' }
  if (s.descriptor?.includes(word)) data.descriptor = s.descriptor.replace(word, '')
  if (s.offices?.length) data.offices = s.offices.map((o) => (NO_PHONES.includes(o.title?.trim() || '') ? { ...o, phones: [] } : o))
  await payload.updateGlobal({ slug: 'site-settings', locale, data: data as never })
  log(`site settings (${locale}):`, Object.keys(data).join(', '))
}

// ── Sections
const RENAME = [
  ['bhrashtachar-par-nazar', 'भ्रष्टाचार पर पैनी नज़र', 'A Sharp Eye on Corruption'],
  ['mahila-bal', 'महिला और बाल विकास', 'Women & Child Development'],
  ['paryavaran', 'पर्यावरण संरक्षण', 'Environment Protection'],
] as const
for (const [slug, hi, en] of RENAME) {
  const c = await findSlug('categories', slug)
  if (!c) {
    log('section missing, skipped:', slug)
    continue
  }
  await payload.update({ collection: 'categories', id: c.id, locale: 'hi', data: { title: hi } as never })
  await payload.update({ collection: 'categories', id: c.id, locale: 'en', data: { title: en } as never })
  log('section renamed:', slug)
}
// New sections sit next to “पर्यावरण संरक्षण” (same parent / menu group).
const env = (await payload.find({ collection: 'categories', where: { slug: { equals: 'paryavaran' } }, limit: 1, depth: 0 })).docs[0] as
  | { parent?: number | null; menuGroup?: string; menuOrder?: number }
  | undefined
const NEW = [
  ['sanskriti-virasat', 'संस्कृति, विरासत और भारतीय ज्ञान परंपरा', 'Culture, Heritage & Indian Knowledge Tradition'],
  ['panchayati-raj', 'पंचायती राज और ग्रामीण विकास', 'Panchayati Raj & Rural Development'],
] as const
for (const [i, [slug, hi, en]] of NEW.entries()) {
  await bilingual('categories', slug, { title: hi, parent: env?.parent ?? undefined, menuGroup: env?.menuGroup || 'public', menuOrder: (env?.menuOrder ?? 500) + i + 1, showInMenu: true }, () => ({ title: en }))
  log('section ready:', slug)
}

// ── Editor may re-publish
const perms = (await payload.findGlobal({ slug: 'permissions', depth: 0 })) as unknown as Record<string, Record<string, boolean> | undefined>
await payload.updateGlobal({ slug: 'permissions', data: { republish: { ...(perms.republish || {}), editor: true, senior: true } } as never })
log('permissions: editor can re-publish')

// ── संपादक का संदेश (client's text, verbatim). No English version was supplied, so English shows the same Hindi text.
const MESSAGE = `तथ्य हमारा आधार, पारदर्शिता हमारी पहचान, जवाबदेही हमारा संकल्प, जनहित हमारा उद्देश्य।

लोकतंत्र में एक जागरूक और जिम्मेदार समाज के लिए विश्वसनीय सूचना, तथ्यपरक पत्रकारिता और सार्वजनिक जवाबदेही अत्यंत महत्वपूर्ण हैं। इसी उद्देश्य के साथ पंजीकृत ट्रस्ट ‘पारदर्शिता प्रहरी’ के द्वारा संचालित और प्रकाशित आधिकारिक ऑनलाइन राष्ट्रीय समाचारपत्र ‘राष्ट्रीय पारदर्शिता प्रहरी’ का प्रयास है कि समाचार केवल सूचना तक सीमित न रहे, बल्कि नागरिकों को तथ्यों को समझने, प्रश्न पूछने और अपने अधिकारों एवं कर्तव्यों के प्रति जागरूक होने का अवसर भी दे।

हमारा संपादकीय दृष्टिकोण स्पष्ट है—न आरोप, न अफवाह; केवल तथ्य, प्रमाण, पारदर्शिता, जवाबदेही और जनहित।

‘राष्ट्रीय पारदर्शिता प्रहरी’ किसी व्यक्ति, संस्था, राजनीतिक दल या विचारधारा के पक्ष अथवा विपक्ष में पत्रकारिता करने के बजाय उपलब्ध तथ्यों, दस्तावेजों, आधिकारिक सूचनाओं और संबंधित पक्षों के दृष्टिकोण के आधार पर विषयों को सामने रखने का प्रयास करेगा। किसी भी शिकायत, आरोप या गंभीर दावे को प्रकाशित करते समय उसके सत्यापन, स्रोत और संबंधित पक्ष का पक्ष जानने की प्रक्रिया को महत्व दिया जाएगा। जहां तथ्य अभी पूर्ण रूप से स्थापित न हों, वहां उसे उसी रूप में स्पष्ट किया जाएगा।

हम मानते हैं कि पत्रकारिता का दायित्व केवल सवाल उठाना नहीं, बल्कि सवालों को तथ्यों और प्रमाणों के साथ सार्वजनिक विमर्श का हिस्सा बनाना भी है। शासन-प्रशासन, सार्वजनिक संस्थानों, सामाजिक व्यवस्थाओं और जनहित से जुड़े विषयों पर आवश्यक प्रश्न पूछना लोकतांत्रिक व्यवस्था में नागरिक भागीदारी का महत्वपूर्ण हिस्सा है।

हमारी प्राथमिकता सनसनी नहीं, सार्थक सूचना है; विवाद नहीं, तथ्य हैं; प्रचार नहीं, जवाबदेही है; और किसी व्यक्ति विशेष को लक्ष्य बनाना नहीं, बल्कि जनहित से जुड़े विषयों को निष्पक्ष रूप से सामने रखना है।

‘राष्ट्रीय पारदर्शिता प्रहरी’ समाज के उन नागरिकों की आवाज को मंच देने का प्रयास करेगा, जिनके प्रश्न सार्वजनिक महत्व रखते हैं। साथ ही, संबंधित विभागों, संस्थाओं और जिम्मेदार पक्षों का उत्तर एवं पक्ष भी समान रूप से महत्वपूर्ण माना जाएगा।

हमारा विश्वास है कि मजबूत लोकतंत्र केवल संस्थाओं से नहीं, बल्कि जागरूक नागरिकों, स्वतंत्र विचार, विश्वसनीय सूचना और जवाबदेह व्यवस्था से बनता है।

इसी विश्वास के साथ हम पत्रकारिता को एक जिम्मेदार सार्वजनिक दायित्व के रूप में देखते हैं।

तथ्य सामने आएं, प्रश्न उठें, जवाबदेही तय हो और जनहित सर्वोपरि रहे—यही ‘राष्ट्रीय पारदर्शिता प्रहरी’ की संपादकीय प्रतिबद्धता है।

**— संपादक, श्री एके सिंह (राठौड़ साहब), राष्ट्रीय पारदर्शिता प्रहरी**`

const page = await findSlug('pages', 'editor-in-chief-message')
if (page) {
  await payload.update({ collection: 'pages', id: page.id, locale: 'hi', data: { title: 'संपादक का संदेश', content: rt(MESSAGE), showOnHome: true } as never, draft: false })
  await payload.update({ collection: 'pages', id: page.id, locale: 'en', data: { title: 'Editor’s Message', content: rt(MESSAGE) } as never, draft: false })
  log('editor message page updated')
} else {
  await bilingual('pages', 'editor-in-chief-message', { title: 'संपादक का संदेश', content: rt(MESSAGE), legalReviewPending: false, showInFooter: false, showOnHome: true }, () => ({ title: 'Editor’s Message', content: rt(MESSAGE) }))
  log('editor message page created')
}

log('round 5 content done ✔')
process.exit(0)
