/**
 * FICTIONAL "Sample" items that demonstrate the special formats. Places, people and documents are invented
 * (marked "काल्पनिक / fictional"). All have sample = true and demoContent = true.
 */
type T = { title: string; excerpt: string; body: string }
export type Sample = {
  key: string
  slug: string
  category: string
  format: 'factcheck' | 'tracker' | 'question' | 'documents' | 'investigation' | 'news'
  daysAgo: number
  hi: T
  en: T
  factCheck?: { verdict: 'true' | 'false' | 'misleading' | 'unverified'; claim: { hi: string; en: string }; claimedBy: { hi: string; en: string } }
  questionStatus?: 'asked' | 'responded' | 'action'
  askedTo?: { hi: string; en: string }
  followUpOf?: string
  tracker?: { stage: string; daysAgo: number; status: 'done' | 'progress' | 'pending'; note: { hi: string; en: string } }[]
  investigation?: Record<string, { hi: string; en: string }>
  withDocuments?: boolean
}

const F = { hi: '(काल्पनिक नमूना)', en: '(fictional sample)' }

export const SAMPLES: Sample[] = [
  {
    key: 'fc-dengue',
    slug: 'sample-fact-check-salt-water-dengue',
    category: 'fact-check',
    format: 'factcheck',
    daysAgo: 1,
    factCheck: {
      verdict: 'false',
      claim: { hi: 'नमक मिला गर्म पानी दिन में तीन बार पीने से डेंगू दो दिन में ठीक हो जाता है।', en: 'Drinking hot salt water three times a day cures dengue in two days.' },
      claimedBy: { hi: 'मैसेजिंग ऐप पर वायरल संदेश (काल्पनिक उदाहरण)', en: 'Viral messaging-app forward (fictional example)' },
    },
    hi: {
      title: 'फैक्ट चेक (नमूना): क्या नमक वाला गर्म पानी डेंगू ठीक करता है? नहीं',
      excerpt: 'डेंगू का कोई घरेलू "इलाज" नहीं है; लक्षण दिखें तो जांच और डॉक्टर की सलाह ज़रूरी।',
      body: `${F.hi} एक वायरल संदेश में दावा है कि नमक मिला गर्म पानी पीने से डेंगू दो दिन में ठीक हो जाता है।

## पड़ताल
डेंगू एक वायरल बीमारी है। इसकी कोई विशेष एंटीवायरल दवा नहीं है; उपचार लक्षणों के प्रबंधन, पर्याप्त तरल पदार्थ और डॉक्टर की निगरानी पर आधारित होता है। नमक वाला पानी वायरस को खत्म नहीं करता।

## निष्कर्ष
दावा **गलत** है। बुखार, तेज़ सिरदर्द, जोड़ों में दर्द जैसे लक्षण हों तो जांच कराएं और स्वयं दवा न लें।`,
    },
    en: {
      title: 'Fact check (sample): Does hot salt water cure dengue? No',
      excerpt: 'There is no home "cure" for dengue; get tested and consult a doctor if symptoms appear.',
      body: `${F.en} A viral message claims that drinking hot salt water cures dengue in two days.

## What we found
Dengue is a viral illness with no specific antiviral cure; treatment focuses on managing symptoms, fluids and medical supervision. Salt water does not kill the virus.

## Verdict
The claim is **false**. If you have fever, severe headache or joint pain, get tested and do not self-medicate.`,
    },
  },
  {
    key: 'fc-flood-photo',
    slug: 'sample-fact-check-old-flood-photo',
    category: 'fact-check',
    format: 'factcheck',
    daysAgo: 2,
    factCheck: {
      verdict: 'misleading',
      claim: { hi: 'यह तस्वीर इस हफ्ते सम्पूर्णपुर (काल्पनिक) शहर में आई बाढ़ की है।', en: 'This photo shows this week’s flood in Sampurnapur (fictional town).' },
      claimedBy: { hi: 'सोशल मीडिया पोस्ट (काल्पनिक उदाहरण)', en: 'Social media post (fictional example)' },
    },
    hi: {
      title: 'फैक्ट चेक (नमूना): बाढ़ की पुरानी तस्वीर को इस हफ्ते का बताकर शेयर किया गया',
      excerpt: 'तस्वीर असली है, लेकिन तीन साल पुरानी है — संदर्भ गलत है, इसलिए दावा भ्रामक।',
      body: `${F.hi} रिवर्स इमेज सर्च में यही तस्वीर तीन साल पहले की एक खबर में मिली। शहर में इस हफ्ते बारिश ज़रूर हुई, लेकिन तस्वीर उस घटना की नहीं है।

## निष्कर्ष
दावा **भ्रामक** है — तस्वीर सच्ची है, पर उसे गलत समय से जोड़ा गया है।`,
    },
    en: {
      title: 'Fact check (sample): old flood photo shared as this week’s',
      excerpt: 'The photo is real but three years old — the context is wrong, so the claim is misleading.',
      body: `${F.en} A reverse image search found the same photo in a report from three years ago. It did rain in the town this week, but the photo is not from that event.

## Verdict
The claim is **misleading** — a genuine photo attached to the wrong time.`,
    },
  },
  {
    key: 'fc-unverified',
    slug: 'sample-fact-check-new-bridge-date',
    category: 'fact-check',
    format: 'factcheck',
    daysAgo: 3,
    factCheck: {
      verdict: 'unverified',
      claim: { hi: 'नदी पर नया पुल अगले महीने खुल जाएगा।', en: 'The new river bridge will open next month.' },
      claimedBy: { hi: 'स्थानीय पोस्टर (काल्पनिक उदाहरण)', en: 'Local poster (fictional example)' },
    },
    hi: {
      title: 'फैक्ट चेक (नमूना): क्या नया पुल अगले महीने खुलेगा? अभी पुष्टि नहीं',
      excerpt: 'विभाग ने कोई आधिकारिक तारीख घोषित नहीं की; ठेकेदार और विभाग के बयान अलग-अलग।',
      body: `${F.hi} हमने लोक निर्माण विभाग से लिखित में पूछा। अब तक कोई आधिकारिक तारीख नहीं मिली, इसलिए दावा **अपुष्ट** है। जवाब आने पर यह फैक्ट चेक अपडेट होगा।`,
    },
    en: {
      title: 'Fact check (sample): will the new bridge open next month? Not confirmed',
      excerpt: 'No official date has been announced; statements from the contractor and department differ.',
      body: `${F.en} We asked the public works department in writing. No official date yet, so the claim is **unverified**. This fact check will be updated when a reply arrives.`,
    },
  },
  {
    key: 'tracker',
    slug: 'sample-tracker-handpump-rampur-kala',
    category: 'shikayat-se-samadhan',
    format: 'tracker',
    daysAgo: 1,
    tracker: [
      { stage: 'problem', daysAgo: 120, status: 'done', note: { hi: 'गांव का एकमात्र हैंडपंप खराब, 200 परिवार प्रभावित।', en: 'Village’s only hand pump broken; 200 families affected.' } },
      { stage: 'complaint', daysAgo: 95, status: 'done', note: { hi: 'ग्राम प्रधान और जन शिकायत पोर्टल पर शिकायत (संख्या काल्पनिक)।', en: 'Complaint to village head and public grievance portal (fictional number).' } },
      { stage: 'department', daysAgo: 60, status: 'done', note: { hi: 'मामला जल निगम के कनिष्ठ अभियंता को भेजा गया।', en: 'Forwarded to the water board’s junior engineer.' } },
      { stage: 'response', daysAgo: 20, status: 'done', note: { hi: 'विभाग: "पुर्ज़े मंगाए गए हैं, दो हफ्ते में मरम्मत।"', en: 'Department: "Parts ordered, repair within two weeks."' } },
      { stage: 'action', daysAgo: 3, status: 'progress', note: { hi: 'मरम्मत टीम गांव पहुंची, काम जारी।', en: 'Repair team reached the village; work under way.' } },
      { stage: 'result', daysAgo: 0, status: 'pending', note: { hi: 'पानी की आपूर्ति बहाल होने की पुष्टि बाकी।', en: 'Restoration of water supply yet to be confirmed.' } },
    ],
    hi: {
      title: 'शिकायत से समाधान तक (नमूना): रामपुर कला का बंद हैंडपंप — 4 महीने का सफर',
      excerpt: 'समस्या से लेकर कार्रवाई तक हर चरण की तारीख और स्थिति। परिणाम की पुष्टि अभी बाकी।',
      body: `${F.hi} रामपुर कला (काल्पनिक गांव) के लोगों ने हमें बताया कि गांव का एकमात्र हैंडपंप चार महीने से बंद है। हमने शिकायत के हर चरण को दस्तावेज़ों के साथ ट्रैक किया। ऊपर की टाइमलाइन में हर कदम की तारीख और स्थिति देखें। परिणाम की पुष्टि होते ही यह पेज अपडेट होगा।`,
    },
    en: {
      title: 'From complaint to resolution (sample): Rampur Kala’s broken hand pump — a 4-month journey',
      excerpt: 'Date and status of every step from problem to action. Final result still to be confirmed.',
      body: `${F.en} Residents of Rampur Kala (fictional village) told us their only hand pump had been broken for four months. We tracked every stage of the complaint with documents. See the timeline above for the date and status of each step. This page will be updated once the result is confirmed.`,
    },
  },
  {
    key: 'q-hospital',
    slug: 'sample-10-questions-district-hospital-medicines',
    category: 'janta-ke-10-sawal',
    format: 'question',
    daysAgo: 30,
    questionStatus: 'asked',
    askedTo: { hi: 'मुख्य चिकित्सा अधिकारी, सम्पूर्णपुर (काल्पनिक)', en: 'Chief Medical Officer, Sampurnapur (fictional)' },
    hi: {
      title: 'जनता के 10 सवाल (नमूना): ज़िला अस्पताल में ज़रूरी दवाएं क्यों नहीं मिल रहीं?',
      excerpt: 'मरीज़ों की शिकायतों के आधार पर हमने मुख्य चिकित्सा अधिकारी को 10 सवाल भेजे।',
      body: `${F.hi}
- दवा भंडार में पिछले तीन महीनों में किन दवाओं की कमी रही?
- आवश्यक दवा सूची की कितनी दवाएं अभी उपलब्ध हैं?
- दवा की मांग कब और किसे भेजी गई?
- मरीज़ों को बाहर से दवा खरीदने को क्यों कहा गया?
- शिकायत दर्ज कराने की व्यवस्था क्या है?

(बाकी 5 सवाल पूरे लेख में) — जवाब आने पर यहां लिंक जोड़ा जाएगा।`,
    },
    en: {
      title: 'Public’s 10 questions (sample): why are essential medicines missing at the district hospital?',
      excerpt: 'Based on patients’ complaints, we sent 10 questions to the Chief Medical Officer.',
      body: `${F.en}
- Which medicines were out of stock in the last three months?
- How many essential-list medicines are available now?
- When, and to whom, was the indent sent?
- Why were patients told to buy medicines outside?
- What is the complaint mechanism?

(Remaining 5 questions in full article) — the reply will be linked here when received.`,
    },
  },
  {
    key: 'q-response',
    slug: 'sample-response-received-district-hospital',
    category: 'jawab-aaya',
    format: 'question',
    daysAgo: 12,
    questionStatus: 'responded',
    followUpOf: 'q-hospital',
    askedTo: { hi: 'मुख्य चिकित्सा अधिकारी, सम्पूर्णपुर (काल्पनिक)', en: 'Chief Medical Officer, Sampurnapur (fictional)' },
    hi: {
      title: 'जवाब आया (नमूना): CMO ने माना — 14 दवाओं की कमी, नई खेप 10 दिन में',
      excerpt: 'हमारे 10 सवालों पर लिखित जवाब; कुछ सवालों के जवाब अब भी अधूरे।',
      body: `${F.hi} मुख्य चिकित्सा अधिकारी ने लिखित जवाब में माना कि 14 आवश्यक दवाओं की कमी थी और नई खेप 10 दिन में आने की बात कही। बाहर से दवा लिखने के सवाल पर जवाब नहीं मिला। हम इसका फॉलो-अप करेंगे।`,
    },
    en: {
      title: 'Response received (sample): CMO admits shortage of 14 medicines, new stock in 10 days',
      excerpt: 'Written reply to our 10 questions; some answers still incomplete.',
      body: `${F.en} In a written reply the Chief Medical Officer admitted a shortage of 14 essential medicines and said fresh stock would arrive within 10 days. There was no answer on patients being told to buy outside. We will follow up.`,
    },
  },
  {
    key: 'q-action',
    slug: 'sample-action-taken-district-hospital',
    category: 'karyawahi-hui',
    format: 'question',
    daysAgo: 2,
    questionStatus: 'action',
    followUpOf: 'q-hospital',
    hi: {
      title: 'कार्रवाई हुई (नमूना): ज़िला अस्पताल में दवाएं पहुंचीं, दवा काउंटर पर सूची लगी',
      excerpt: 'हमारी टीम ने अस्पताल जाकर उपलब्धता जांची; शिकायत नंबर भी प्रदर्शित।',
      body: `${F.hi} हमारी टीम ने अस्पताल जाकर देखा कि ज़्यादातर दवाएं पहुंच गई हैं और उपलब्ध दवाओं की सूची व शिकायत नंबर काउंटर पर लगाए गए हैं। दो दवाएं अब भी उपलब्ध नहीं थीं।`,
    },
    en: {
      title: 'Action taken (sample): medicines reach district hospital, stock list displayed',
      excerpt: 'Our team visited to check availability; a complaint number is now displayed too.',
      body: `${F.en} Our team visited and found most medicines had arrived, with a list of available medicines and a complaint number displayed at the counter. Two medicines were still unavailable.`,
    },
  },
  {
    key: 'docs',
    slug: 'sample-documents-rti-road-repair',
    category: 'dastavez-bolte-hain',
    format: 'documents',
    daysAgo: 4,
    withDocuments: true,
    hi: {
      title: 'दस्तावेज़ बोलते हैं (नमूना): RTI जवाब — एक ही सड़क की मरम्मत पर दो बार भुगतान?',
      excerpt: 'काल्पनिक नगर पालिका का RTI जवाब दिखाता है कि 8 महीने में एक सड़क पर दो बिल पास हुए।',
      body: `${F.hi} सूचना का अधिकार (RTI) के तहत मिले जवाब में सम्पूर्णपुर नगर पालिका (काल्पनिक) ने बताया कि वार्ड 7 की एक सड़क की मरम्मत के लिए आठ महीने के भीतर दो बार भुगतान हुआ। नीचे मूल दस्तावेज़ देखें। नगर पालिका का पक्ष जानने के लिए हमने लिखित सवाल भेजे हैं।`,
    },
    en: {
      title: 'Documents speak (sample): RTI reply — paid twice for repairing the same road?',
      excerpt: 'A fictional municipality’s RTI reply shows two bills cleared for one road within 8 months.',
      body: `${F.en} In a Right to Information (RTI) reply, Sampurnapur municipality (fictional) disclosed two payments within eight months for repairing the same road in ward 7. See the original documents below. We have sent written questions to the municipality for its side.`,
    },
  },
  {
    key: 'inv',
    slug: 'sample-investigation-streetlights',
    category: 'jaanch',
    format: 'investigation',
    daysAgo: 5,
    withDocuments: true,
    investigation: {
      issue: { hi: 'सम्पूर्णपुर (काल्पनिक) के 12 वार्डों में 2,000 नई स्ट्रीट लाइटें लगाने का भुगतान हुआ, लेकिन लोग कहते हैं कई गलियां अब भी अंधेरी हैं।', en: 'Sampurnapur (fictional) paid for 2,000 new streetlights across 12 wards, yet residents say many lanes are still dark.' },
      facts: { hi: '- टेंडर: 2,000 LED लाइटें\n- भुगतान: पूरी राशि\n- हमारी गिनती: 6 वार्डों में 1,000 में से 640 लाइटें लगी मिलीं', en: '- Tender: 2,000 LED lights\n- Payment: full amount\n- Our count: 640 of 1,000 lights found in 6 wards' },
      documents: { hi: 'टेंडर आदेश और भुगतान रजिस्टर की प्रतियां नीचे "दस्तावेज़ बोलते हैं" बॉक्स में।', en: 'Copies of the tender order and payment register are in the "Documents Speak" box below.' },
      response: { hi: 'नगर पालिका ने कहा कि बची लाइटें "स्टोर में" हैं और दो हफ्ते में लगेंगी।', en: 'The municipality said the remaining lights are "in store" and will be installed in two weeks.' },
      groundReality: { hi: 'स्टोर में हमें 120 लाइटें ही दिखीं। कई खंभों पर पुरानी खराब लाइटें लगी हैं।', en: 'We found only 120 lights in the store. Many poles still carry old, broken fittings.' },
      publicQuestions: { hi: '- बाकी लाइटें कहां हैं?\n- पूरा भुगतान किस आधार पर हुआ?\n- सत्यापन किस अधिकारी ने किया?', en: '- Where are the remaining lights?\n- On what basis was full payment made?\n- Which official verified the work?' },
      answer: { hi: 'इन सवालों का जवाब अभी नहीं मिला है।', en: 'These questions are yet to be answered.' },
      followUp: { hi: 'दो हफ्ते बाद हमारी टीम फिर गिनती करेगी और यहां अपडेट देगी।', en: 'Our team will recount in two weeks and update here.' },
    },
    hi: {
      title: 'जांच (नमूना): 2,000 स्ट्रीट लाइटों का भुगतान, पर गलियां अब भी अंधेरी',
      excerpt: 'टेंडर, भुगतान और ज़मीनी गिनती का मिलान — एक काल्पनिक उदाहरण जो जांच रिपोर्ट का ढांचा दिखाता है।',
      body: `${F.hi} यह नमूना हमारी जांच रिपोर्ट का ढांचा दिखाता है: मुद्दा → तथ्य → दस्तावेज़ → संबंधित पक्ष का जवाब → ज़मीनी हकीकत → जनता के सवाल → जवाब → फॉलो-अप।`,
    },
    en: {
      title: 'Investigation (sample): paid for 2,000 streetlights, lanes still dark',
      excerpt: 'Matching tender, payment and a ground count — a fictional example showing our investigation format.',
      body: `${F.en} This sample shows our investigation template: Issue → Facts → Documents → Response → Ground reality → Public questions → Answer → Follow-up.`,
    },
  },
  {
    key: 'forum',
    slug: 'sample-peoples-testimony-bus-stop',
    category: 'janta-ki-gawahi',
    format: 'news',
    daysAgo: 6,
    hi: {
      title: 'जनता की गवाही (नमूना): "बस स्टॉप पर न छांव है, न पानी"',
      excerpt: 'रोज़ सफर करने वाले यात्रियों ने अपनी बात रखी — एक काल्पनिक उदाहरण।',
      body: `${F.hi} सम्पूर्णपुर बस अड्डे पर रोज़ आने-जाने वाले यात्रियों ने बताया कि गर्मी में छांव और पीने के पानी की कोई व्यवस्था नहीं है। बुज़ुर्गों और बच्चों को सबसे ज़्यादा परेशानी होती है। हम यह सवाल परिवहन विभाग तक ले जाएंगे।`,
    },
    en: {
      title: 'People’s testimony (sample): "No shade, no water at the bus stop"',
      excerpt: 'Daily commuters speak up — a fictional example.',
      body: `${F.en} Daily commuters at Sampurnapur bus stand said there is no shade or drinking water in the heat. The elderly and children suffer most. We will take the question to the transport department.`,
    },
  },
]
