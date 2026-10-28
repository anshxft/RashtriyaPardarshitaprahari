/**
 * npm run seed:round6 — Round 6 client content for an EXISTING database. Safe to run more than once.
 *  • new digital-news column “सवाल सार्वजनिक हित का”
 *  • two team profiles (legal advisor, national sports bureau chief) — ID numbers left empty until the client sends them
 *  • “सुधार एवं स्पष्टीकरण नीति” (client's text, verbatim) on the correction-policy page
 */
import { bilingual, findSlug, log, payload } from './lib'
import { rt } from './helpers'

// ── New column, placed right after “सरकार से सीधा सवाल” in the same menu group.
const near = (await payload.find({ collection: 'categories', where: { slug: { equals: 'sarkar-se-sawal' } }, limit: 1, depth: 0 })).docs[0] as
  | { menuGroup?: string; menuOrder?: number }
  | undefined
await bilingual(
  'categories',
  'sawal-sarvajanik-hit-ka',
  { title: 'सवाल सार्वजनिक हित का', menuGroup: near?.menuGroup || 'accountability', menuOrder: (near?.menuOrder ?? 100) + 1, showInMenu: true },
  () => ({ title: 'Questions of Public Interest' }),
)
log('section ready: sawal-sarvajanik-hit-ka')

// ── Team profiles (created once; later edits in the desk are never overwritten).
const TEAM = [
  {
    hi: {
      name: 'एडवोकेट राधा मोहन',
      designation: 'विधिक सलाहकार (Legal Advisor)',
      bureau: 'टेबल नंबर 103, प्रथम तल, व्यवहार न्यायालय, रांची, झारखंड',
      bio: 'नामांकन संख्या (Enrollment No.): 1374/2002 · लेजर संख्या (Ledger No.): 1528',
    },
    en: { name: 'Advocate Radha Mohan', designation: 'Legal Advisor', bureau: 'Table No. 103, First Floor, Civil Court, Ranchi, Jharkhand', bio: 'Enrollment No.: 1374/2002 · Ledger No.: 1528' },
    tier: 'other',
    district: 'Ranchi',
  },
  {
    hi: { name: 'श्री लखीचरण मुंडा', designation: 'राष्ट्रीय खेल ब्यूरो प्रमुख', bio: 'भूतपूर्व सैनिक' },
    en: { name: 'Shri Lakhicharan Munda', designation: 'National Sports Bureau Chief', bio: 'Ex-serviceman' },
    tier: 'editorial',
  },
] as const
for (const m of TEAM) {
  const found = await payload.find({ collection: 'team-members', where: { name: { equals: m.hi.name } }, locale: 'hi', limit: 1, depth: 0, draft: true })
  if (found.docs[0]) {
    log('team: already there —', m.hi.name)
    continue
  }
  const doc = await payload.create({
    collection: 'team-members',
    locale: 'hi',
    data: { ...m.hi, tier: m.tier, state: 'Jharkhand', ...('district' in m ? { district: m.district } : {}), _status: 'published' } as never,
  })
  await payload.update({ collection: 'team-members', id: doc.id, locale: 'en', data: { ...m.en, _status: 'published' } as never })
  log('team: added —', m.hi.name)
}

// ── Correction & clarification policy (client's text). English keeps its current text under the new title.
const POLICY = `## सत्य सर्वोपरि, जवाबदेही अनिवार्य

राष्ट्रीय पारदर्शिता प्रहरी सत्य, निष्पक्षता और जनहित आधारित पत्रकारिता के लिए प्रतिबद्ध है। हमारी प्रकाशित सामग्री में कोई तथ्यात्मक त्रुटि पाए जाने पर प्रमाणों की निष्पक्ष जाँच कर आवश्यक सुधार यथाशीघ्र किया जाएगा। महत्त्वपूर्ण सुधारों को पारदर्शिता के साथ सार्वजनिक किया जाएगा।

किसी समाचार से संबंधित व्यक्ति, संस्था अथवा विभाग को अपना पक्ष, स्पष्टीकरण या खंडन प्रस्तुत करने का उचित अवसर दिया जाएगा। प्रत्येक दावे और आपत्ति का मूल्यांकन उपलब्ध तथ्यों, दस्तावेजों और साक्ष्यों के आधार पर होगा।

न तथ्य छिपाए जाएँगे, न त्रुटियों को संरक्षण दिया जाएगा और न ही अनुचित दबाव में संपादकीय निर्णय लिए जाएँगे। सुधार एवं स्पष्टीकरण के लिए संबंधित समाचार का लिंक, स्पष्ट विवरण और उपलब्ध प्रमाण हमारे आधिकारिक संपर्क माध्यम से भेजें।

**राष्ट्रीय पारदर्शिता प्रहरी — तथ्य के प्रति प्रतिबद्ध, जवाबदेही के पक्षधर और जनहित के प्रहरी**`

const page = await findSlug('pages', 'correction-policy')
if (page) {
  await payload.update({ collection: 'pages', id: page.id, locale: 'hi', data: { title: 'सुधार एवं स्पष्टीकरण नीति', content: rt(POLICY) } as never, draft: false })
  await payload.update({ collection: 'pages', id: page.id, locale: 'en', data: { title: 'Correction & Clarification Policy' } as never, draft: false })
  log('correction policy updated')
} else log('correction-policy page not found — skipped')

log('round 6 content done ✔')
process.exit(0)
