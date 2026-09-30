/**
 * Public form definitions (fields, labels, options). Drives both the public forms and the admin inbox collections.
 * PLACEHOLDER wording — replace labels/options with the exact text from content.md.
 */
export type L = { hi: string; en: string }
export type FormField = {
  name: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'time'
  label: L
  required?: boolean
  /** Identity fields become optional when the sender chooses anonymity. */
  identity?: boolean
  options?: ({ value: string } & L)[]
  maxLength?: number
}

import { STATE_LIST } from './states'
const stateOptions = STATE_LIST.map((s) => ({ value: s.value, hi: s.hi, en: s.value }))

export const submissionFields: FormField[] = [
  { name: 'name', type: 'text', label: { hi: 'आपका नाम', en: 'Your name' }, required: true, identity: true, maxLength: 120 },
  { name: 'phone', type: 'tel', label: { hi: 'मोबाइल नंबर', en: 'Mobile number' }, required: true, identity: true, maxLength: 20 },
  { name: 'email', type: 'email', label: { hi: 'ईमेल (वैकल्पिक)', en: 'Email (optional)' }, identity: true, maxLength: 160 },
  { name: 'state', type: 'select', label: { hi: 'राज्य', en: 'State' }, required: true, options: stateOptions },
  { name: 'district', type: 'text', label: { hi: 'ज़िला', en: 'District' }, required: true, maxLength: 80 },
  { name: 'location', type: 'text', label: { hi: 'गांव / शहर / वार्ड', en: 'Village / town / ward' }, maxLength: 160 },
  {
    name: 'issueType',
    type: 'select',
    label: { hi: 'विषय', en: 'Type of issue' },
    required: true,
    options: [
      { value: 'public-problem', hi: 'जन समस्या', en: 'Public problem' },
      { value: 'corruption', hi: 'भ्रष्टाचार / अनियमितता', en: 'Corruption / irregularity' },
      { value: 'scheme', hi: 'सरकारी योजना का लाभ नहीं मिला', en: 'Government scheme benefit denied' },
      { value: 'food-safety', hi: 'खाद्य सुरक्षा / मिलावट', en: 'Food safety / adulteration' },
      { value: 'road-safety', hi: 'सड़क सुरक्षा', en: 'Road safety' },
      { value: 'farmers', hi: 'किसान से जुड़ा मुद्दा', en: 'Farmer issue' },
      { value: 'good-work', hi: 'अच्छा काम / सकारात्मक खबर', en: 'Good work / positive story' },
      { value: 'public-info', hi: 'जनहित सूचना', en: 'Public-interest information' },
      { value: 'other', hi: 'अन्य', en: 'Other' },
    ],
  },
  { name: 'department', type: 'text', label: { hi: 'संबंधित विभाग / अधिकारी', en: 'Department / official concerned' }, maxLength: 160 },
  { name: 'subject', type: 'text', label: { hi: 'शीर्षक (एक पंक्ति में)', en: 'Subject (one line)' }, required: true, maxLength: 160 },
  {
    name: 'description',
    type: 'textarea',
    label: { hi: 'पूरा विवरण — क्या, कब, कहां, कौन', en: 'Full details — what, when, where, who' },
    required: true,
    maxLength: 5000,
  },
  {
    name: 'complaintFiled',
    type: 'select',
    label: { hi: 'क्या पहले कहीं शिकायत की है?', en: 'Already complained anywhere?' },
    options: [
      { value: 'no', hi: 'नहीं', en: 'No' },
      { value: 'yes', hi: 'हां', en: 'Yes' },
    ],
  },
  { name: 'complaintRef', type: 'text', label: { hi: 'शिकायत संख्या / तारीख (यदि हो)', en: 'Complaint number / date (if any)' }, maxLength: 120 },
]

export const appointmentFields: FormField[] = [
  { name: 'name', type: 'text', label: { hi: 'नाम', en: 'Name' }, required: true, maxLength: 120 },
  { name: 'organisation', type: 'text', label: { hi: 'संस्था / पद (यदि हो)', en: 'Organisation / designation (if any)' }, maxLength: 160 },
  { name: 'phone', type: 'tel', label: { hi: 'मोबाइल नंबर', en: 'Mobile number' }, required: true, maxLength: 20 },
  { name: 'email', type: 'email', label: { hi: 'ईमेल', en: 'Email' }, maxLength: 160 },
  { name: 'state', type: 'select', label: { hi: 'राज्य', en: 'State' }, options: stateOptions },
  { name: 'city', type: 'text', label: { hi: 'शहर / ज़िला', en: 'City / district' }, maxLength: 80 },
  {
    name: 'meetingWith',
    type: 'select',
    label: { hi: 'किससे मिलना है', en: 'Meeting with' },
    required: true,
    options: [
      { value: 'editor', hi: 'प्रधान संपादक', en: 'Editor-in-Chief' },
      { value: 'reporter', hi: 'संवाददाता', en: 'Reporter' },
      { value: 'trust', hi: 'ट्रस्ट प्रतिनिधि', en: 'Trust representative' },
    ],
  },
  { name: 'purpose', type: 'text', label: { hi: 'मिलने का उद्देश्य', en: 'Purpose of meeting' }, required: true, maxLength: 200 },
  { name: 'preferredDate', type: 'date', label: { hi: 'पसंदीदा तारीख', en: 'Preferred date' }, required: true },
  { name: 'preferredTime', type: 'time', label: { hi: 'पसंदीदा समय', en: 'Preferred time' } },
  {
    name: 'mode',
    type: 'select',
    label: { hi: 'मुलाकात का तरीका', en: 'Mode' },
    required: true,
    options: [
      { value: 'in-person', hi: 'कार्यालय में', en: 'In person' },
      { value: 'phone', hi: 'फोन', en: 'Phone' },
      { value: 'video', hi: 'वीडियो कॉल', en: 'Video call' },
    ],
  },
  { name: 'message', type: 'textarea', label: { hi: 'संक्षिप्त विवरण', en: 'Brief details' }, maxLength: 2000 },
]

export const contactFields: FormField[] = [
  { name: 'name', type: 'text', label: { hi: 'नाम', en: 'Name' }, required: true, maxLength: 120 },
  { name: 'email', type: 'email', label: { hi: 'ईमेल', en: 'Email' }, required: true, maxLength: 160 },
  { name: 'phone', type: 'tel', label: { hi: 'मोबाइल (वैकल्पिक)', en: 'Mobile (optional)' }, maxLength: 20 },
  {
    name: 'topic',
    type: 'select',
    label: { hi: 'विषय', en: 'Topic' },
    required: true,
    options: [
      { value: 'general', hi: 'सामान्य', en: 'General' },
      { value: 'correction', hi: 'सुधार का अनुरोध', en: 'Correction request' },
      { value: 'grievance', hi: 'शिकायत (ग्रिवांस)', en: 'Grievance' },
      { value: 'feedback', hi: 'सुझाव', en: 'Feedback' },
    ],
  },
  { name: 'subject', type: 'text', label: { hi: 'शीर्षक', en: 'Subject' }, required: true, maxLength: 160 },
  { name: 'message', type: 'textarea', label: { hi: 'संदेश', en: 'Message' }, required: true, maxLength: 5000 },
]

export const CONSENT: L = {
  hi: 'मैं सहमति देता/देती हूं कि “राष्ट्रीय पारदर्शिता प्रहरी” मेरे द्वारा दी गई जानकारी का उपयोग केवल इस अनुरोध की जांच, सत्यापन और मुझसे संपर्क के लिए करे, जैसा कि गोपनीयता नीति में बताया गया है (डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023)। मैं कभी भी सहमति वापस ले सकता/सकती हूं।',
  en: 'I consent to Rashtriya Pardarshita Prahari using the information I provide only to examine, verify and contact me about this request, as described in the Privacy Policy (Digital Personal Data Protection Act, 2023). I can withdraw consent at any time.',
}

/** Kept under Vercel's 4.5 MB request limit. Raise only if you self-host or move uploads to direct-to-storage. */
export const UPLOAD = { maxFiles: 3, maxTotalMB: 4, accept: '.pdf,.jpg,.jpeg,.png,.webp' }
