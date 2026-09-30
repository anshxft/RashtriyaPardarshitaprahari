/** Fictional sample profiles for "हमारी टीम" (demoContent = true → removed by `npm run demo:remove`). */
import { bilingual, log } from './lib'

type S = { slug: string; tier: string; state?: string; district?: string; order: number; hi: Record<string, string>; en: Record<string, string> }

const SAMPLES: S[] = [
  {
    slug: 'sample-editor-in-chief',
    tier: 'editor-in-chief',
    order: 1,
    hi: { name: '[प्रधान संपादक का नाम]', designation: 'प्रधान संपादक', workArea: 'संपूर्ण संपादकीय विभाग', bio: '(नमूना) असली प्रोफ़ाइल Desk → हमारी टीम में जोड़ें।' },
    en: { name: '[Editor-in-Chief name]', designation: 'Editor-in-Chief', workArea: 'Entire editorial department', bio: '(Sample) Add the real profile under Desk → Team.' },
  },
  {
    slug: 'sample-state-bureau-bihar',
    tier: 'state-bureau',
    state: 'Bihar',
    district: 'Patna',
    order: 10,
    hi: { name: 'नमूना सदस्य (काल्पनिक)', designation: 'राज्य ब्यूरो प्रमुख, बिहार', workArea: 'पटना और आसपास के ज़िले', bureau: 'पटना ब्यूरो', idNumber: 'SAMPLE-001', bio: '(नमूना) यह एक काल्पनिक प्रोफ़ाइल है।' },
    en: { name: 'Sample member (fictional)', designation: 'State Bureau Chief, Bihar', workArea: 'Patna and nearby districts', bureau: 'Patna bureau', idNumber: 'SAMPLE-001', bio: '(Sample) A fictional profile.' },
  },
  {
    slug: 'sample-assistant-bureau-up',
    tier: 'assistant-bureau',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    order: 10,
    hi: { name: 'नमूना सदस्य (काल्पनिक)', designation: 'सहायक ब्यूरो, उत्तर प्रदेश', workArea: 'लखनऊ', bureau: 'लखनऊ ब्यूरो', idNumber: 'SAMPLE-002', bio: '(नमूना) यह एक काल्पनिक प्रोफ़ाइल है।' },
    en: { name: 'Sample member (fictional)', designation: 'Assistant Bureau, Uttar Pradesh', workArea: 'Lucknow', bureau: 'Lucknow bureau', idNumber: 'SAMPLE-002', bio: '(Sample) A fictional profile.' },
  },
  {
    slug: 'sample-special-correspondent-delhi',
    tier: 'special-correspondent',
    state: 'Delhi',
    district: 'New Delhi',
    order: 10,
    hi: { name: 'नमूना संवाददाता (काल्पनिक)', designation: 'विशेष संवाददाता', workArea: 'केंद्र सरकार और मंत्रालय', bureau: 'दिल्ली ब्यूरो', idNumber: 'SAMPLE-003', experience: '(नमूना) जांच रिपोर्टिंग, RTI' },
    en: { name: 'Sample correspondent (fictional)', designation: 'Special Correspondent', workArea: 'Union government and ministries', bureau: 'Delhi bureau', idNumber: 'SAMPLE-003', experience: '(Sample) Investigations, RTI' },
  },
  {
    slug: 'sample-reporter-mp',
    tier: 'reporter',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    order: 10,
    hi: { name: 'नमूना संवाददाता (काल्पनिक)', designation: 'संवाददाता, भोपाल', workArea: 'भोपाल', bureau: 'भोपाल ब्यूरो', idNumber: 'SAMPLE-004' },
    en: { name: 'Sample reporter (fictional)', designation: 'Reporter, Bhopal', workArea: 'Bhopal', bureau: 'Bhopal bureau', idNumber: 'SAMPLE-004' },
  },
  {
    slug: 'sample-photographer-mh',
    tier: 'photographer',
    state: 'Maharashtra',
    district: 'Mumbai',
    order: 10,
    hi: { name: 'नमूना फोटोग्राफर (काल्पनिक)', designation: 'फोटोग्राफर', workArea: 'मुंबई', bureau: 'मुंबई ब्यूरो', idNumber: 'SAMPLE-005' },
    en: { name: 'Sample photographer (fictional)', designation: 'Photographer', workArea: 'Mumbai', bureau: 'Mumbai bureau', idNumber: 'SAMPLE-005' },
  },
]

export async function seedTeam() {
  for (const s of SAMPLES) {
    await bilingual(
      'team-members',
      s.slug,
      { ...s.hi, tier: s.tier, state: s.state, district: s.district, order: s.order, demoContent: true, publishContact: false, _status: 'published' },
      () => ({ ...s.en, _status: 'published' }),
    )
  }
  log('team samples:', SAMPLES.length)
}
