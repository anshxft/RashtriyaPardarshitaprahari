/**
 * Sections / menu (seeded into the Categories collection; after seeding, edit them in Admin → Categories).
 *
 * ⚠ PLACEHOLDER: content.md was not supplied yet. The 24 main items below are a draft built from the brief
 * and the logo's values (तथ्य | पारदर्शिता | जवाबदेही | जनहित). Replace titles/descriptions with the exact
 * wording from content.md, then re-run `npm run seed` (it only adds missing slugs) or edit in the admin.
 * The 9 named sub-sections from the brief are placed under their most relevant parent.
 */
import type { L } from './forms'

export type Section = {
  slug: string
  title: L
  description: L
  group: 'news' | 'accountability' | 'public' | 'people'
  children?: Omit<Section, 'group' | 'children'>[]
}

const d = (hi: string, en: string): L => ({ hi, en })

export const SECTIONS: Section[] = [
  // ── खबरें / News
  {
    slug: 'rashtriya',
    group: 'news',
    title: d('राष्ट्रीय', 'National'),
    description: d('देश की बड़ी खबरें, तथ्य के साथ।', 'Major national news, with facts.'),
    children: [{ slug: 'sambandhit-portal', title: d('संबंधित न्यूज़ पोर्टल', 'Related News Portals'), description: d('अन्य न्यूज़ पोर्टलों की चुनिंदा खबरों के लिंक।', 'Links to selected stories on other news portals.') }],
  },
  { slug: 'rajya', group: 'news', title: d('राज्य', 'States'), description: d('राज्यों से जुड़ी खबरें और जनहित के मुद्दे।', 'News and public issues from the states.') },
  {
    slug: 'gaon-shahar',
    group: 'news',
    title: d('गांव-शहर', 'Village & City'),
    description: d('स्थानीय मुद्दे, जो अक्सर सुर्खियों से छूट जाते हैं।', 'Local issues that often miss the headlines.'),
    children: [{ slug: 'gaon-se-rajdhani-tak', title: d('गांव से राजधानी तक', 'From Village to Capital'), description: d('गांव की आवाज़, राजधानी तक।', 'Voices from villages, carried to the capital.') }],
  },
  { slug: 'arthvyavastha', group: 'news', title: d('अर्थव्यवस्था', 'Economy'), description: d('महंगाई, रोज़गार, बजट — आम आदमी की नज़र से।', 'Prices, jobs, budgets — from the citizen’s view.') },
  { slug: 'vigyan-takneek', group: 'news', title: d('विज्ञान और तकनीक', 'Science & Tech'), description: d('विज्ञान, तकनीक और डिजिटल अधिकार।', 'Science, technology and digital rights.') },

  // ── जवाबदेही / Accountability
  { slug: 'jaanch', group: 'accountability', title: d('जांच रिपोर्ट', 'Investigation'), description: d('दस्तावेज़ों और ज़मीनी सच्चाई पर आधारित जांच।', 'Investigations based on documents and ground reality.') },
  { slug: 'fact-check', group: 'accountability', title: d('फैक्ट चेक', 'Fact Check'), description: d('वायरल दावों की पड़ताल: सही, गलत, भ्रामक या अपुष्ट।', 'Viral claims checked: true, false, misleading or unverified.') },
  {
    slug: 'sarkar-se-sawal',
    group: 'accountability',
    title: d('सरकार से सीधा सवाल', 'Direct Question to Government'),
    description: d('जनता के सवाल, ज़िम्मेदारों तक — और उनके जवाब।', 'Citizens’ questions to those responsible — and their answers.'),
    children: [
      { slug: 'janta-ke-10-sawal', title: d('जनता के 10 सवाल', 'Public’s 10 Questions'), description: d('हर मुद्दे पर जनता के 10 सीधे सवाल।', 'Ten direct public questions on an issue.') },
      { slug: 'humne-poocha', title: d('हमने पूछा, क्या जवाब मिला', 'We Asked — What Answer Came'), description: d('हमारे सवाल और मिले जवाब।', 'Our questions and the answers received.') },
      { slug: 'jawab-aaya', title: d('जवाब आया', 'Response Received'), description: d('जिन सवालों का जवाब आ गया।', 'Questions that received a response.') },
      { slug: 'karyawahi-hui', title: d('कार्रवाई हुई', 'Action Taken'), description: d('जहां खबर के बाद कार्रवाई हुई।', 'Where action followed our reporting.') },
    ],
  },
  { slug: 'shikayat-se-samadhan', group: 'accountability', title: d('शिकायत से समाधान तक', 'From Complaint to Resolution'), description: d('एक शिकायत का पूरा सफर — समस्या से परिणाम तक।', 'A complaint’s full journey — from problem to result.') },
  { slug: 'dastavez-bolte-hain', group: 'accountability', title: d('दस्तावेज़ बोलते हैं', 'Documents Speak'), description: d('आदेश, RTI जवाब और रिकॉर्ड — स्रोत के साथ।', 'Orders, RTI replies and records — with sources.') },
  { slug: 'bhrashtachar-par-nazar', group: 'accountability', title: d('भ्रष्टाचार पर नज़र', 'Corruption Watch'), description: d('अनियमितताओं पर तथ्य-आधारित रिपोर्टिंग।', 'Fact-based reporting on irregularities.') },

  // ── जनहित / Public interest
  { slug: 'kisan', group: 'public', title: d('किसान', 'Farmers'), description: d('खेती, मंडी, फसल बीमा और किसानों के अधिकार।', 'Farming, markets, crop insurance and farmers’ rights.') },
  { slug: 'yuva-rozgar', group: 'public', title: d('युवा और रोज़गार', 'Youth & Jobs'), description: d('भर्ती, परीक्षा, रोज़गार और कौशल।', 'Recruitment, exams, employment and skills.') },
  { slug: 'shiksha', group: 'public', title: d('शिक्षा', 'Education'), description: d('स्कूल, कॉलेज और शिक्षा व्यवस्था।', 'Schools, colleges and the education system.') },
  { slug: 'swasthya', group: 'public', title: d('स्वास्थ्य', 'Health'), description: d('अस्पताल, दवाइयां और जन स्वास्थ्य।', 'Hospitals, medicines and public health.') },
  { slug: 'khadya-suraksha', group: 'public', title: d('खाद्य सुरक्षा', 'Food Safety'), description: d('मिलावट, राशन और खाद्य मानक।', 'Adulteration, rations and food standards.') },
  { slug: 'sadak-suraksha', group: 'public', title: d('सड़क सुरक्षा', 'Road Safety'), description: d('सड़क हादसे, नियम और ज़िम्मेदारी।', 'Road accidents, rules and responsibility.') },
  { slug: 'mahila-bal', group: 'public', title: d('महिला और बाल', 'Women & Children'), description: d('महिलाओं और बच्चों की सुरक्षा व अधिकार।', 'Safety and rights of women and children.') },
  { slug: 'paryavaran', group: 'public', title: d('पर्यावरण', 'Environment'), description: d('प्रदूषण, जल, जंगल और जलवायु।', 'Pollution, water, forests and climate.') },
  { slug: 'upbhokta-adhikar', group: 'public', title: d('उपभोक्ता अधिकार', 'Consumer Rights'), description: d('ठगी से बचाव और उपभोक्ता के अधिकार।', 'Protection from fraud and consumer rights.') },

  // ── जन और विचार / People & ideas
  {
    slug: 'jan-manch',
    group: 'people',
    title: d('जनता का मंच', 'Public Forum'),
    description: d('जनता की बात, जनता की ज़ुबानी।', 'The public’s voice, in its own words.'),
    children: [{ slug: 'janta-ki-gawahi', title: d('जनता की गवाही', 'People’s Testimony'), description: d('प्रत्यक्षदर्शियों और प्रभावितों की बात।', 'Accounts from witnesses and those affected.') }],
  },
  {
    slug: 'kanoon-nyay',
    group: 'people',
    title: d('कानून और न्याय', 'Law & Justice'),
    description: d('अदालत, कानून और आपके अधिकार।', 'Courts, laws and your rights.'),
    children: [{ slug: 'kanoon-saral-bhasha', title: d('कानून की सरल भाषा', 'Law in Simple Words'), description: d('कानून, आसान शब्दों में।', 'The law, explained simply.') }],
  },
  {
    slug: 'sakaratmak-bharat',
    group: 'people',
    title: d('सकारात्मक भारत', 'Positive India'),
    description: d('बदलाव की कहानियां और प्रेरक पहल।', 'Stories of change and inspiring initiatives.'),
    children: [{ slug: 'achha-kaam', title: d('अच्छा काम', 'Good Work'), description: d('जहां किसी ने सच में अच्छा काम किया।', 'Where someone genuinely did good work.') }],
  },
  {
    slug: 'vichar',
    group: 'people',
    title: d('विचार', 'Opinion'),
    description: d('संपादकीय, विश्लेषण और विचार।', 'Editorials, analysis and opinion.'),
    children: [
      { slug: 'sampadkiya', title: d('संपादकीय', 'Editorial'), description: d('प्रधान संपादक का संपादकीय।', 'The Editor-in-Chief’s editorial.') },
      { slug: 'samaj-ka-aina', title: d('समाज का आइना', 'Society’s Mirror'), description: d('समाज की सच्ची तस्वीर, बिना लाग-लपेट।', 'A true picture of society, without varnish.') },
      { slug: 'bharat-navnirman-samvad', title: d('भारत नवनिर्माण संवाद', 'Bharat Navnirman Dialogue'), description: d('नए भारत के निर्माण पर संवाद।', 'Dialogue on building a new India.') }],
  },
]

/** Categories featured as blocks on the home page (in order). */
export const HOME_BLOCKS = ['rashtriya', 'rajya', 'kisan', 'yuva-rozgar', 'khadya-suraksha', 'sadak-suraksha']
