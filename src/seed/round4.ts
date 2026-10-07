/**
 * npm run seed:round4 — Round 4 content for an EXISTING database. Safe to run more than once.
 *  • descriptor line, official email, 3 offices with helplines, WhatsApp message, social links
 *    (each only filled when still empty, so later admin edits are never overwritten)
 *  • About page: the old motto is replaced by the registered tagline (only that sentence is touched)
 */
import { TAGLINE_FULL } from '../content/brand'
import { log, payload } from './lib'

const UNIT = {
  hi: 'ऑनलाइन समाचारपत्र एवं डिजिटल न्यूज़ प्रकोष्ठ, राष्ट्रीय पारदर्शिता प्रहरी (पारदर्शिता प्रहरी ट्रस्ट द्वारा संचालित एवं प्रकाशित)',
  en: 'Online Newspaper & Digital News Cell, Rashtriya Pardarshita Prahari (run and published by Pardarshita Prahari Trust)',
}
const OFFICES = [
  {
    title: { hi: 'पंजीकृत कार्यालय', en: 'Registered Office' },
    address: {
      hi: 'गाड़ीगांव, शिवनगर, वार्ड नंबर सात, कोकर - खेलगांव रोड, रांची - 834001, राज्य - झारखंड।',
      en: 'Gadigaon, Shivnagar, Ward No. 7, Kokar - Khelgaon Road, Ranchi - 834001, Jharkhand.',
    },
    phones: [
      { number: '9431924522', kind: 'whatsapp' },
      { number: '8580074522', kind: 'call' },
    ],
  },
  {
    title: { hi: 'प्रशासनिक कार्यालय', en: 'Administrative Office' },
    address: {
      hi: 'मेन रोड भेलाटांड़, कपूरिया - कतरास रोड, निकट - टाटा डीएवी, प्रखंड - बाघमारा, धनबाद - 828103, राज्य - झारखंड।',
      en: 'Main Road Bhelatand, Kapuriya - Katras Road, near Tata DAV, Block - Baghmara, Dhanbad - 828103, Jharkhand.',
    },
    phones: [{ number: '9835704715', kind: 'both' }],
  },
  {
    title: { hi: 'द्वितीय प्रशासनिक कार्यालय', en: 'Second Administrative Office' },
    address: {
      hi: 'राष्ट्रीय पारदर्शिता प्रहरी, मेन रोड बालूमाथ, पोस्ट ऑफिस + प्रखंड - बालूमाथ, जिला - लातेहार, राज्य - झारखंड।',
      en: 'Rashtriya Pardarshita Prahari, Main Road Balumath, Post Office + Block - Balumath, District - Latehar, Jharkhand.',
    },
    phones: [{ number: '9798770045', kind: 'both' }],
  },
] as const

const SOCIAL = {
  instagram: 'https://www.instagram.com/rpp_03092026',
  x: 'https://x.com/RPP_03092026',
  youtube: 'https://www.youtube.com/@rashtriapardarshitaprahari',
}

type S = {
  descriptor?: string
  email?: string
  whatsappMessage?: string
  offices?: { id?: string }[]
  social?: Record<string, string | null>
}
const hi = (await payload.findGlobal({ slug: 'site-settings', locale: 'hi', depth: 0 })) as S
const en = (await payload.findGlobal({ slug: 'site-settings', locale: 'en', depth: 0 })) as S

const data: Record<string, unknown> = {}
if (!hi.descriptor) data.descriptor = 'आधिकारिक ई-पेपर और डिजिटल न्यूज़'
if (!hi.email || hi.email.endsWith('@example.org')) data.email = 'official@rashtriyapardarshitaprahari.org'
if (!hi.whatsappMessage) data.whatsappMessage = 'नमस्ते राष्ट्रीय पारदर्शिता प्रहरी, मुझे आपसे बात करनी है।'
const social = { ...(hi.social || {}) }
for (const [k, v] of Object.entries(SOCIAL)) if (!social[k]) social[k] = v
data.social = social
const newOffices = !hi.offices?.length
if (newOffices)
  data.offices = OFFICES.map((o) => ({
    title: o.title.hi,
    address: o.address.hi,
    unit: UNIT.hi,
    phones: o.phones.map((p) => ({ ...p })),
  }))
await payload.updateGlobal({ slug: 'site-settings', locale: 'hi', data: data as never })

// English: same array rows (ids from the Hindi save), English texts.
const after = (await payload.findGlobal({ slug: 'site-settings', locale: 'hi', depth: 0 })) as S
const enData: Record<string, unknown> = {}
if (!en.descriptor || en.descriptor === hi.descriptor) enData.descriptor = 'Official E-Paper & Digital News'
if (!en.whatsappMessage || en.whatsappMessage === after.whatsappMessage) enData.whatsappMessage = 'Hello Rashtriya Pardarshita Prahari, I would like to talk to you.'
if (newOffices)
  enData.offices = (after.offices || []).map((row, i) => ({
    ...row,
    title: OFFICES[i].title.en,
    address: OFFICES[i].address.en,
    unit: UNIT.en,
  }))
if (Object.keys(enData).length) await payload.updateGlobal({ slug: 'site-settings', locale: 'en', data: enData as never })
log('site settings:', Object.keys(data).join(', '), newOffices ? '(3 offices added)' : '(offices kept as they were)')

// About page: swap ONLY the old motto sentence for the registered tagline.
const OLD = [
  ['खबर से आगे, जवाबदेही तक।', `${TAGLINE_FULL}।`],
  ['Beyond News. Towards Accountability.', `${TAGLINE_FULL}।`],
] as const
for (const locale of ['hi', 'en'] as const) {
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about-us' } },
    locale,
    limit: 1,
    depth: 0,
  })
  const page = res.docs[0]
  if (!page) continue
  let json = JSON.stringify(page.content)
  for (const [a, b] of OLD) json = json.split(a).join(b)
  if (json !== JSON.stringify(page.content)) {
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale,
      data: { content: JSON.parse(json) } as never,
    })
    log(`about-us (${locale}): old motto replaced by the registered tagline`)
  }
}
log('round 4 content done ✔')
process.exit(0)
