/**
 * Static page DRAFTS. ⚠ Replace with the exact policy wording from content.md, and have the legal pages
 * reviewed by a lawyer. Text in [square brackets] is a placeholder to fill in.
 * After seeding, edit these in Admin → Pages (the seed never overwrites an existing page).
 */
type P = { slug: string; title: { hi: string; en: string }; hi: string; en: string; legal?: boolean }

export const PAGES: P[] = [
  {
    slug: 'about-us',
    title: { hi: 'हमारे बारे में', en: 'About Us' },
    hi: `**राष्ट्रीय पारदर्शिता प्रहरी** एक ऑनलाइन राष्ट्रीय समाचार पत्र है, जिसका संचालन और प्रकाशन **[ट्रस्ट का पूरा नाम] (पारदर्शिता प्रहरी ट्रस्ट)** द्वारा किया जाता है। हमारा ध्येय वाक्य है — **खबर से आगे, जवाबदेही तक।**

## हमारे मूल्य
- **तथ्य** — हमारा आधार
- **पारदर्शिता** — हमारी पहचान
- **जवाबदेही** — हमारा संकल्प
- **जनहित** — हमारा उद्देश्य

## हम क्या करते हैं
हम सिर्फ खबर नहीं देते, बल्कि जनता के सवालों को ज़िम्मेदारों तक पहुंचाते हैं, उनके जवाब दर्ज करते हैं और यह भी बताते हैं कि आगे क्या कार्रवाई हुई।

## ट्रस्ट विवरण
- ट्रस्ट का नाम: [ट्रस्ट का पूरा नाम]
- पंजीकरण संख्या: [पंजीकरण संख्या]
- पंजीकृत पता: [पूरा पता]
- प्रधान संपादक: [प्रधान संपादक का नाम]
- प्रकाशक: [प्रकाशक का नाम]
- शिकायत अधिकारी: [नाम, ईमेल, फोन]

ये विवरण एडमिन → Site Settings में भी बदले जा सकते हैं।`,
    en: `**Rashtriya Pardarshita Prahari** is an online national newspaper run and published by **[Full name of Trust] (Pardarshita Prahari Trust)**. Our motto: **Beyond News. Towards Accountability.**

## Our values
- **Facts** — our foundation
- **Transparency** — our identity
- **Accountability** — our resolve
- **Public interest** — our purpose

## What we do
We do not stop at reporting. We carry the public's questions to those responsible, record their answers, and follow up on what action was taken.

## Trust details
- Name of Trust: [Full name of Trust]
- Registration number: [Registration number]
- Registered address: [Full address]
- Editor-in-Chief: [Editor-in-Chief's name]
- Publisher: [Publisher's name]
- Grievance officer: [Name, email, phone]

These details can also be edited in Admin → Site Settings.`,
  },
  {
    slug: 'editor-in-chief-message',
    title: { hi: 'प्रधान संपादक का संदेश', en: 'Editor-in-Chief’s Message' },
    hi: `[प्रधान संपादक का संदेश यहाँ लिखें। Admin → Pages → “प्रधान संपादक का संदेश” में जाकर पाठ बदलें और फोटो जोड़ें। तैयार होने पर “Feature this page as a block on the home page” चुनें।]`,
    en: `[Write the Editor-in-Chief’s message here. Go to Admin → Pages → “Editor-in-Chief’s Message” to edit the text and add a photo. When it is ready, tick “Feature this page as a block on the home page”.]`,
  },
  {
    slug: 'editorial-policy',
    title: { hi: 'संपादकीय नीति', en: 'Editorial Policy' },
    hi: `## स्वतंत्रता
हमारे संपादकीय निर्णय किसी राजनीतिक दल, सरकार, विज्ञापनदाता या दानदाता के प्रभाव से मुक्त हैं।

## सत्यापन
- हर तथ्य को कम से कम दो स्वतंत्र स्रोतों या मूल दस्तावेज़ से सत्यापित किया जाता है।
- आरोपों वाली हर खबर में संबंधित पक्ष को जवाब देने का उचित अवसर दिया जाता है, और उनका जवाब (या जवाब न देना) खबर में दर्ज किया जाता है।
- आरोप, जांच या मुकदमे से जुड़ी सामग्री प्रधान संपादक की स्वीकृति के बिना प्रकाशित नहीं होती।

## स्रोत और गोपनीयता
हम उपयोग किए गए स्रोतों और दस्तावेज़ों का उल्लेख करते हैं। जहां किसी व्यक्ति की सुरक्षा का प्रश्न हो, वहां स्रोत की पहचान गोपनीय रखी जाती है।

## भाषा और गरिमा
हम अपमानजनक, भड़काऊ या किसी समुदाय के प्रति घृणा फैलाने वाली भाषा का प्रयोग नहीं करते। पीड़ितों, बच्चों और यौन अपराध से प्रभावित व्यक्तियों की पहचान कानून के अनुसार सुरक्षित रखी जाती है।

## विज्ञापन और सामग्री का अंतर
प्रायोजित सामग्री, यदि कभी प्रकाशित हो, स्पष्ट रूप से "प्रायोजित" चिह्नित होगी।`,
    en: `## Independence
Our editorial decisions are free from the influence of any political party, government, advertiser or donor.

## Verification
- Every fact is verified with at least two independent sources or the original document.
- In every story containing allegations, the concerned party is given a fair opportunity to respond, and their response (or refusal) is recorded in the story.
- Content involving allegations, investigations or litigation is never published without the Editor-in-Chief's approval.

## Sources and confidentiality
We cite the sources and documents we use. Where a person's safety is at stake, the identity of the source is kept confidential.

## Language and dignity
We do not use abusive or inflammatory language, or language that spreads hatred against any community. The identities of victims, children and survivors of sexual offences are protected as required by law.

## Advertising and editorial separation
Sponsored content, if ever published, will be clearly labelled "Sponsored".`,
  },
  {
    slug: 'fact-check-policy',
    title: { hi: 'फैक्ट-चेक नीति', en: 'Fact-Check Policy' },
    hi: `## हम किन दावों की जांच करते हैं
जनहित से जुड़े वायरल दावे, सार्वजनिक हस्तियों के बयान और ऐसी सूचनाएं जिनसे लोगों को नुकसान हो सकता है।

## प्रक्रिया
- दावे का मूल स्रोत खोजना
- आधिकारिक आंकड़ों, दस्तावेज़ों और विशेषज्ञों से मिलान
- फोटो/वीडियो की रिवर्स सर्च और मेटाडेटा जांच
- दावा करने वाले पक्ष से प्रतिक्रिया लेना, जहां संभव हो

## निष्कर्ष के लेबल
- **सही** — दावा उपलब्ध प्रमाणों से पुष्ट है।
- **गलत** — दावा प्रमाणों के विपरीत है।
- **भ्रामक** — दावे में आंशिक सच है, पर संदर्भ गलत या अधूरा है।
- **अपुष्ट** — उपलब्ध प्रमाण न पुष्टि करते हैं, न खंडन।

नया प्रमाण मिलने पर निष्कर्ष बदला जा सकता है; ऐसा हर बदलाव सुधार लॉग में दर्ज होगा।`,
    en: `## What we check
Viral claims of public interest, statements by public figures, and information that could cause people harm.

## Process
- Trace the original source of the claim
- Match against official data, documents and experts
- Reverse-search photos/videos and check metadata
- Seek a response from the claimant where possible

## Verdict labels
- **True** — the claim is supported by available evidence.
- **False** — the claim contradicts the evidence.
- **Misleading** — partly true, but the context is wrong or incomplete.
- **Unverified** — available evidence neither confirms nor refutes it.

A verdict may change if new evidence emerges; every such change is recorded in the corrections log.`,
  },
  {
    slug: 'correction-policy',
    title: { hi: 'सुधार नीति', en: 'Correction Policy' },
    hi: `हम गलतियां स्वीकार करते हैं और उन्हें जल्द से जल्द, पारदर्शी तरीके से सुधारते हैं।

## कैसे बताएं
हर खबर के नीचे "गलती दिखी? हमें बताएं" लिंक है, या संपर्क फॉर्म में विषय "सुधार का अनुरोध" चुनें।

## हम क्या करते हैं
- तथ्यात्मक गलती: खबर में सुधार, और खबर के नीचे तारीख सहित सुधार-नोट।
- स्पष्टीकरण: जहां तथ्य सही हो पर प्रस्तुति से भ्रम हो।
- गंभीर गलती: प्रधान संपादक की समीक्षा के बाद प्रमुखता से सुधार।
- सभी सुधार सार्वजनिक **सुधार लॉग** पेज पर दर्ज होते हैं।

हम किसी प्रकाशित खबर को चुपचाप नहीं बदलते या हटाते।`,
    en: `We acknowledge mistakes and correct them promptly and transparently.

## How to tell us
Every story has a "Spotted an error? Tell us" link, or choose "Correction request" on the contact form.

## What we do
- Factual error: the story is corrected and a dated correction note is added below it.
- Clarification: where facts are right but the presentation could mislead.
- Serious error: corrected prominently after the Editor-in-Chief's review.
- All corrections are listed on the public **Corrections log** page.

We never silently change or delete a published story.`,
  },
  {
    slug: 'our-commitment',
    title: { hi: 'पाठकों के प्रति हमारी प्रतिबद्धता', en: 'Our Commitment to Readers' },
    hi: `- हम हर खबर में तथ्य और राय को अलग रखेंगे।
- हम स्रोत बताएंगे और जहां संभव हो मूल दस्तावेज़ दिखाएंगे।
- हम हर पक्ष को अपनी बात रखने का अवसर देंगे।
- हम गलती होने पर उसे सार्वजनिक रूप से सुधारेंगे।
- हम जनता के सवालों का फॉलो-अप करेंगे — सवाल से जवाब तक, और जवाब से कार्रवाई तक।
- हम आपकी निजी जानकारी की रक्षा करेंगे।`,
    en: `- We will keep facts and opinion separate in every story.
- We will name our sources and show original documents wherever possible.
- We will give every side the opportunity to be heard.
- We will correct our mistakes publicly.
- We will follow up on the public's questions — from question to answer, and from answer to action.
- We will protect your personal information.`,
  },
  {
    slug: 'privacy-policy',
    title: { hi: 'गोपनीयता नीति', en: 'Privacy Policy' },
    legal: true,
    hi: `यह नीति बताती है कि **[ट्रस्ट का पूरा नाम]** ("हम") इस वेबसाइट पर आपका व्यक्तिगत डेटा कैसे एकत्र और उपयोग करता है। यह नीति डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDP Act) को ध्यान में रखकर तैयार की गई है।

## हम क्या एकत्र करते हैं
- आप जो फॉर्म भरते हैं (समस्या/सूचना, मुलाकात अनुरोध, संपर्क): नाम, फोन, ईमेल, स्थान, विवरण और संलग्न फाइलें।
- तकनीकी जानकारी जो सुरक्षा और स्पैम रोकने के लिए आवश्यक है।

## उद्देश्य
केवल आपके अनुरोध की जांच, तथ्यों के सत्यापन और आपसे संपर्क के लिए। हम आपका डेटा बेचते नहीं हैं।

## सहमति और आपके अधिकार
फॉर्म भेजने से पहले आपकी स्पष्ट सहमति ली जाती है। आप कभी भी सहमति वापस ले सकते हैं, अपने डेटा की जानकारी, सुधार या मिटाने का अनुरोध कर सकते हैं — शिकायत अधिकारी को लिखें: [ईमेल]।

## गुमनामी
"गुमनाम रहें" चुनने पर हम आपकी पहचान कभी प्रकाशित नहीं करेंगे।

## संग्रहण अवधि
डेटा उतने समय तक रखा जाता है जितना उद्देश्य के लिए आवश्यक है: [अवधि, जैसे 24 महीने], उसके बाद मिटा दिया जाता है, जब तक कानूनन रखना आवश्यक न हो।

## सुरक्षा
संलग्न फाइलें सार्वजनिक नहीं होतीं और केवल अधिकृत संपादकीय टीम ही देख सकती है।

## संपर्क
डेटा संरक्षण / शिकायत अधिकारी: [नाम, ईमेल, पता]`,
    en: `This policy explains how **[Full name of Trust]** ("we") collects and uses your personal data on this website. It has been prepared with the Digital Personal Data Protection Act, 2023 (DPDP Act) in mind.

## What we collect
- Forms you fill in (issue/information, appointment request, contact): name, phone, email, location, details and attached files.
- Technical information needed for security and spam prevention.

## Purpose
Only to examine your request, verify facts and contact you. We do not sell your data.

## Consent and your rights
Your explicit consent is taken before a form is sent. You may withdraw consent at any time, and request access to, correction or erasure of your data — write to the grievance officer: [email].

## Anonymity
If you choose "remain anonymous", we will never publish your identity.

## Retention
Data is kept only as long as needed for the purpose: [period, e.g. 24 months], then deleted unless the law requires retention.

## Security
Attached files are never public and are visible only to the authorised editorial team.

## Contact
Data protection / grievance officer: [name, email, address]`,
  },
  {
    slug: 'terms-of-use',
    title: { hi: 'उपयोग की शर्तें', en: 'Terms of Use' },
    legal: true,
    hi: `इस वेबसाइट का उपयोग करके आप इन शर्तों से सहमत होते हैं।

## सामग्री का उपयोग
इस वेबसाइट की सामग्री [ट्रस्ट का पूरा नाम] की संपत्ति है। बिना लिखित अनुमति के पुनः प्रकाशन वर्जित है; स्रोत का उल्लेख और लिंक देकर संक्षिप्त अंश उद्धृत किए जा सकते हैं।

## उपयोगकर्ता द्वारा भेजी गई सामग्री
आप पुष्टि करते हैं कि आपके द्वारा भेजी गई जानकारी आपकी जानकारी में सत्य है और आपको उसे साझा करने का अधिकार है। झूठी या दुर्भावनापूर्ण सूचना भेजना कानूनन दंडनीय हो सकता है।

## बाहरी लिंक
बाहरी वेबसाइटों की सामग्री के लिए हम ज़िम्मेदार नहीं हैं।

## क्षेत्राधिकार
इन शर्तों से संबंधित विवाद [शहर] के न्यायालयों के अधीन होंगे।`,
    en: `By using this website you agree to these terms.

## Use of content
Content on this website is the property of [Full name of Trust]. Republication without written permission is prohibited; brief excerpts may be quoted with credit and a link.

## User submissions
You confirm that information you send is true to the best of your knowledge and that you have the right to share it. Sending false or malicious information may be punishable by law.

## External links
We are not responsible for the content of external websites.

## Jurisdiction
Disputes relating to these terms are subject to the courts of [city].`,
  },
  {
    slug: 'disclaimer',
    title: { hi: 'अस्वीकरण', en: 'Disclaimer' },
    legal: true,
    hi: `इस वेबसाइट पर प्रकाशित सामग्री सामान्य जानकारी और जनहित के उद्देश्य से है। हम सटीकता का हर संभव प्रयास करते हैं, फिर भी किसी त्रुटि की सूचना मिलने पर सुधार नीति के अनुसार सुधार किया जाएगा।

- विचार/लेख अनुभाग में व्यक्त मत लेखकों के निजी हैं।
- "कानून की सरल भाषा" अनुभाग कानूनी सलाह नहीं है; किसी विशेष मामले में वकील से परामर्श लें।
- "डेमो" या "नमूना" के रूप में चिह्नित सामग्री केवल प्रदर्शन के लिए है।`,
    en: `Content on this website is published for general information and in the public interest. We make every effort to be accurate; any error reported to us will be corrected under our Correction Policy.

- Views expressed in the Opinion section are the authors' own.
- The "Law in Simple Words" section is not legal advice; consult a lawyer for any specific matter.
- Content marked "Demo" or "Sample" is for demonstration only.`,
  },
  {
    slug: 'grievance-policy',
    title: { hi: 'शिकायत निवारण नीति', en: 'Grievance Redressal Policy' },
    legal: true,
    hi: `यदि आपको हमारी किसी सामग्री से आपत्ति है, तो आप शिकायत दर्ज कर सकते हैं।

## कैसे शिकायत करें
संपर्क फॉर्म में विषय "शिकायत (ग्रिवांस)" चुनें, या शिकायत अधिकारी को सीधे लिखें:
- नाम: [शिकायत अधिकारी का नाम]
- ईमेल: [ईमेल]
- पता: [पता]

## समय-सीमा
- शिकायत की प्राप्ति-सूचना: [24 घंटे] के भीतर
- निपटारा: [15 दिन] के भीतर, कारण सहित उत्तर

## अपील
यदि आप निर्णय से संतुष्ट नहीं हैं, तो [अपील प्राधिकारी / स्व-नियामक संस्था, यदि लागू हो] के पास अपील कर सकते हैं।

यह प्रक्रिया लागू कानूनों (जैसे सूचना प्रौद्योगिकी नियम, 2021, यदि लागू हों) के अनुरूप वकील की समीक्षा के बाद अंतिम की जाएगी।`,
    en: `If you object to any of our content, you may file a grievance.

## How to complain
Choose "Grievance" on the contact form, or write directly to the grievance officer:
- Name: [Grievance officer's name]
- Email: [email]
- Address: [address]

## Timelines
- Acknowledgement: within [24 hours]
- Resolution: within [15 days], with a reasoned reply

## Appeal
If you are not satisfied, you may appeal to [appellate authority / self-regulatory body, if applicable].

This process will be finalised after a lawyer's review for conformity with applicable law (e.g. the IT Rules, 2021, if applicable).`,
  },
]
