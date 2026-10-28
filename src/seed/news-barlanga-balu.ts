/**
 * One-off (29 Oct 2026): publishes the Barlanga sand-mining story (text unchanged, no photo) in Hindi + English,
 * and adds English versions of the two earlier stories so the English site shows them too. Safe to run twice.
 */
import { paragraphsToLexical } from '../lib/lexical'
import { bilingual, findSlug, log, payload } from './lib'

type Tr = { title: string; subheadline: string; excerpt: string; location: string; reporterName: string; paras: string[] }
const enData = (t: Tr) => ({ title: t.title, subheadline: t.subheadline, excerpt: t.excerpt, location: t.location, reporterName: t.reporterName, content: paragraphsToLexical(t.paras) })

/** Adds English to a published Hindi story unless it already has an English title. */
async function addEnglish(hiTitle: string, t: Tr) {
  const doc = (await payload.find({ collection: 'articles', where: { title: { equals: hiTitle } }, locale: 'hi', limit: 1, depth: 0 })).docs[0]
  if (!doc) return log('not found, skipped:', hiTitle.slice(0, 40))
  const en = await payload.findByID({ collection: 'articles', id: doc.id, locale: 'en', fallbackLocale: false as never, depth: 0 })
  if (en.title) return log('English already there — id', doc.id)
  await payload.update({ collection: 'articles', id: doc.id, locale: 'en', data: { ...enData(t), _status: 'published' } as never })
  log('English added — id', doc.id)
}

// ── 1. New story ─────────────────────────────────────────────────────────────
const TITLE = 'मुख्यमंत्री के पैतृक गांव नेमरा वाले बरलंगा थाना क्षेत्र में स्वर्णरेखा नदी से कथित अवैध बालू उठाव का आरोप, थाने के नाक के नीचे रातभर ट्रैक्टरों की आवाजाही!'
const P = [
  'बरलंगा (रामगढ़)। झारखंड के रामगढ़ जिले के बरलंगा थाना क्षेत्र में स्वर्णरेखा नदी के विभिन्न घाटों से कथित अवैध बालू उठाव का मामला गंभीर सवाल खड़े कर रहा है। स्थानीय स्तर पर मिली जानकारी के अनुसार, कुरकुटू घाट, पुलबंधा घाट, चारलू घाट, रामपुर घाट समेत अन्य घाटों से ट्रैक्टरों के माध्यम से बालू का उठाव किए जाने का आरोप है। स्थानीय ग्रामीणों के अनुसार, कुरकुटू घाट से शाम छह बजे के बाद रातभर बालू उठाव और ढुलाई की गतिविधियां संचालित होती हैं। यदि यह जानकारी सही है, तो सवाल उठना स्वाभाविक है कि संबंधित विभागों की निगरानी व्यवस्था आखिर कितनी प्रभावी है और इन गतिविधियों को रोकने के लिए जमीन पर क्या कदम उठाए जा रहे हैं।',
  'सबसे गंभीर आरोप यह है कि बालू उठाव और ढुलाई में लगे लोग कथित रूप से रैयतों की खेती योग्य जमीन को भी नुकसान पहुंचा रहे हैं। यदि ट्रैक्टरों की आवाजाही से किसानों के खेतों की मिट्टी, मेड़ या कृषि भूमि को नुकसान पहुंच रहा है, तो यह प्रभावित रैयतों के अधिकार और आजीविका से जुड़ा मामला है। संबंधित प्रशासन को प्रभावित जमीन का निरीक्षण कर शिकायतों की जांच करनी चाहिए तथा नुकसान की पुष्टि होने पर जिम्मेदारी निर्धारित करते हुए नियमानुसार कार्रवाई करनी चाहिए।',
  'स्थानीय स्तर पर मिली जानकारी के अनुसार, बरलंगा थाना परिसर से संबंधित नदी क्षेत्र की दूरी लगभग दो किलोमीटर बताई जाती है। ऐसे में सवाल है कि यदि घाटों से लगातार ट्रैक्टरों के जरिए बालू उठाव हो रहा है, तो इसकी जानकारी संबंधित अधिकारियों तक पहुंच रही है या नहीं? क्या नदी घाटों का नियमित निरीक्षण किया जाता है? क्या शाम और रात के समय होने वाली गतिविधियों पर निगरानी रखी जाती है? यदि बिना वैध अनुमति बालू उठाव हो रहा है, तो उसे रोकने के लिए अब तक क्या कार्रवाई की गई है? इन सवालों का जवाब वास्तविक जांच और कार्रवाई से ही सामने आ सकता है।',
  'मामले का एक अन्य महत्वपूर्ण पहलू बालू ढुलाई में लगे ट्रैक्टर चालकों के ड्राइविंग लाइसेंस की जांच से जुड़ा है। स्थानीय स्तर पर यह आशंका जताई जा रही है कि व्यापक जांच होने पर कुछ चालकों के पास वैध लाइसेंस नहीं होने की स्थिति सामने आ सकती है। हालांकि, बिना आधिकारिक जांच के यह दावा करना उचित नहीं होगा कि अधिकांश चालकों के पास लाइसेंस नहीं हैं। इसलिए संबंधित पुलिस और परिवहन विभाग को चालकों के ड्राइविंग लाइसेंस तथा लागू नियमों के अनुसार वाहनों के पंजीकरण, बीमा और अन्य आवश्यक दस्तावेजों की जांच करनी चाहिए। यदि कोई उल्लंघन पाया जाता है, तो नियमानुसार कार्रवाई की जानी चाहिए।',
  'स्वर्णरेखा नदी से बालू उठाव का मामला केवल खनन तक सीमित नहीं है। नदी के प्राकृतिक स्वरूप, पर्यावरण, सरकारी राजस्व और आसपास के ग्रामीणों के हितों से भी इसका सीधा संबंध है। यदि नदी से बालू का उठाव निर्धारित अनुमति और लागू शर्तों के विपरीत किया जाता है, तो इसके पर्यावरणीय और आर्थिक दुष्परिणाम हो सकते हैं। इसी तरह, यदि बालू ढुलाई के लिए निजी कृषि भूमि का इस्तेमाल बिना सहमति किया जा रहा है या खेतों को नुकसान पहुंचाया जा रहा है, तो इसकी स्वतंत्र जांच जरूरी है।',
  'झारखंड के मुख्यमंत्री हेमंत सोरेन का पैतृक गांव नेमरा भी बरलंगा थाना क्षेत्र में स्थित है। इस तथ्य के बावजूद कि क्षेत्र की प्राकृतिक संपदा की सुरक्षा और कानून का पालन सुनिश्चित करना संबंधित प्रशासन की जिम्मेदारी है, किसी अधिकारी की लापरवाही का निष्कर्ष केवल भौगोलिक निकटता के आधार पर नहीं निकाला जा सकता। वास्तविक स्थिति का पता निष्पक्ष जांच, उपलब्ध साक्ष्यों और संबंधित विभागों के पक्ष से ही चलेगा।',
  'अब सवाल यह है कि कुरकुटू, पुलबंधा, चारलू और रामपुर घाट समेत अन्य घाटों पर बालू उठाव की वास्तविक स्थिति क्या है? क्या इन घाटों पर बालू उठाव की वैध अनुमति है? क्या ट्रैक्टरों के माध्यम से होने वाली ढुलाई की जांच की जा रही है? क्या चालकों के लाइसेंस और वाहनों के दस्तावेजों का सत्यापन होता है? और क्या रैयतों की खेती योग्य जमीन को नुकसान पहुंचाने की शिकायतों पर कोई कार्रवाई हुई है? संबंधित विभागों को इन सवालों का स्पष्ट जवाब देना चाहिए।',
  'राष्ट्रीय पारदर्शिता प्रहरी संबंधित खनन विभाग, बरलंगा पुलिस, परिवहन विभाग और जिला प्रशासन से अपेक्षा करता है कि मामले की गंभीरता को देखते हुए संबंधित घाटों का निरीक्षण कराया जाए, शाम छह बजे के बाद से रातभर कथित रूप से होने वाली गतिविधियों की जांच की जाए तथा बालू उठाव, परिवहन और रैयती जमीन को नुकसान पहुंचाने के आरोपों की सत्यता सामने लाई जाए। यदि अवैध गतिविधियां प्रमाणित होती हैं, तो जिम्मेदार लोगों के विरुद्ध विधिसम्मत कार्रवाई की जाए और जांच के परिणाम सार्वजनिक किए जाएं।',
  'जनहित का सवाल स्पष्ट है—यदि नदी घाटों से कथित अवैध बालू उठाव और रातभर ट्रैक्टरों की आवाजाही की शिकायतें सामने आ रही हैं, तो उनकी वास्तविकता जांचने और कानून का पालन सुनिश्चित करने के लिए संबंधित विभाग जमीन पर क्या कर रहे हैं? जनता को केवल आश्वासन नहीं, बल्कि पारदर्शी जांच, स्पष्ट जवाब और कार्रवाई की वास्तविक स्थिति जानने का अधिकार है।',
  'तथ्य हमारा आधार, पारदर्शिता हमारी पहचान। जवाबदेही हमारा संकल्प, जनहित हमारा उद्देश्य।',
]
const EN: Tr = {
  title: "Alleged illegal sand lifting from Subarnarekha river in Barlanga police area, home of CM's ancestral village Nemra — tractors run all night right under the police station's nose",
  subheadline: "Questions over Kurkutu, Pulbandha, Charlu and Rampur ghats; allegation of damage to raiyats' farmland; demand to check tractor drivers' licences",
  excerpt: 'Villagers allege sand is lifted by tractors from several Subarnarekha ghats in Barlanga (Ramgarh) from 6 pm through the night; the paper asks the mining, police, transport departments and district administration to inspect and act.',
  location: 'Barlanga, Ramgarh (Jharkhand)',
  reporterName: 'Anwar Ali, Ramgarh District Bureau Chief',
  paras: [
    'Barlanga (Ramgarh). The alleged illegal lifting of sand from various ghats of the Subarnarekha river in the Barlanga police station area of Ramgarh district, Jharkhand, is raising serious questions. According to local information, sand is allegedly being lifted by tractors from Kurkutu ghat, Pulbandha ghat, Charlu ghat, Rampur ghat and other ghats. According to local villagers, sand lifting and transport from Kurkutu ghat goes on through the night after 6 pm. If this is correct, it is natural to ask how effective the monitoring by the departments concerned really is, and what steps are being taken on the ground to stop these activities.',
    'The most serious allegation is that those engaged in lifting and transporting sand are also damaging the cultivable land of raiyats (landholders). If tractor movement is damaging the soil, field bunds or farmland of farmers, it is a matter of the rights and livelihood of the affected raiyats. The administration should inspect the affected land, examine the complaints and, if damage is confirmed, fix responsibility and act as per rules.',
    'According to local information, the river area is said to be about two kilometres from the Barlanga police station premises. The question then is: if sand is being lifted continuously by tractors from the ghats, is this information reaching the officials concerned? Are the ghats inspected regularly? Are activities in the evening and at night monitored? If sand is being lifted without valid permission, what action has been taken so far to stop it? These questions can only be answered by a real investigation and action.',
    'Another important aspect is checking the driving licences of the tractor drivers transporting sand. There is local apprehension that a wider check may find some drivers without valid licences. However, without an official check it would not be proper to claim that most drivers lack licences. The police and transport department should therefore check drivers’ licences and, as per applicable rules, vehicle registration, insurance and other required documents. Any violation found should be dealt with as per rules.',
    "Sand lifting from the Subarnarekha is not just a mining issue. It is directly linked to the river's natural form, the environment, government revenue and the interests of nearby villagers. If sand is lifted contrary to the permitted limits and conditions, it can have environmental and economic consequences. Likewise, if private farmland is used for transport without consent, or fields are being damaged, an independent investigation is needed.",
    "Nemra, the ancestral village of Jharkhand Chief Minister Hemant Soren, is also in the Barlanga police station area. While protecting the area's natural resources and ensuring the rule of law is the responsibility of the administration, no official's negligence can be concluded merely on the basis of geographical proximity. The real situation will be known only through a fair investigation, available evidence and the response of the departments concerned.",
    "The question now is: what is the actual situation of sand lifting at Kurkutu, Pulbandha, Charlu, Rampur and other ghats? Is there valid permission for sand lifting at these ghats? Is transport by tractors being checked? Are drivers' licences and vehicle documents verified? And has any action been taken on complaints of damage to raiyats' farmland? The departments concerned should answer these questions clearly.",
    'Rashtriya Pardarshita Prahari expects the mining department, Barlanga police, transport department and district administration, given the seriousness of the matter, to inspect the ghats, investigate the activities allegedly carried out through the night from 6 pm, and bring out the truth of the allegations of sand lifting, transport and damage to raiyati land. If illegal activities are proven, lawful action should be taken against those responsible and the findings made public.',
    'The public-interest question is clear — if complaints of alleged illegal sand lifting and all-night tractor movement from river ghats are coming up, what are the departments doing on the ground to verify them and ensure the law is followed? The public has a right not just to assurances, but to a transparent investigation, clear answers and the actual status of action.',
    'Facts are our foundation, transparency our identity. Accountability is our resolve, public interest our purpose.',
  ],
}

const exists = (await payload.find({ collection: 'articles', where: { title: { equals: TITLE } }, locale: 'hi', limit: 1, depth: 0 })).docs[0]
if (exists) log('story already there — id', exists.id)
else {
  const tagIds: number[] = []
  for (const [slug, hi, en] of [
    ['jharkhand', 'झारखंड', 'Jharkhand'],
    ['ramgarh', 'रामगढ़', 'Ramgarh'],
    ['barlanga', 'बरलंगा', 'Barlanga'],
    ['avaidh-balu-khanan', 'अवैध बालू खनन', 'Illegal sand mining'],
  ] as const)
    tagIds.push(await bilingual('tags', slug, { title: hi }, () => ({ title: en })))
  const cat = await findSlug('categories', 'sawal-sarvajanik-hit-ka')
  const a = await payload.create({
    collection: 'articles',
    locale: 'hi',
    data: {
      title: TITLE,
      subheadline: 'स्वर्णरेखा नदी के कुरकुटू, पुलबंधा, चारलू और रामपुर घाट पर उठे सवाल, रैयतों की खेती योग्य जमीन को नुकसान पहुंचाने का भी आरोप; ट्रैक्टर चालकों के लाइसेंस की जांच की मांग',
      excerpt: 'बरलंगा थाना क्षेत्र में स्वर्णरेखा नदी के घाटों से शाम छह बजे के बाद रातभर ट्रैक्टरों से कथित बालू उठाव का आरोप; खनन, पुलिस, परिवहन विभाग और जिला प्रशासन से जांच की अपेक्षा।',
      category: cat?.id,
      content: paragraphsToLexical(P),
      location: 'बरलंगा, रामगढ़ (झारखंड)',
      reporterName: 'अनवर अली, रामगढ़ जिला ब्यूरो प्रमुख',
      tags: tagIds,
      format: 'news',
      publishedAt: new Date().toISOString(),
      _status: 'published',
    } as never,
  })
  log('published — id', a.id, a.newsId)
}
await addEnglish(TITLE, EN)

// ── 2. English for the earlier stories ───────────────────────────────────────
await addEnglish('विशेष जमीनी पड़ताल: राजधानी में छत, चास में बेबसी की धूप!', {
  title: 'Special ground report: A roof in the capital, helpless under the sun in Chas!',
  subheadline: 'Same state, same department — then why such a double standard of dignity between two cities?',
  excerpt: "Ranchi's vendors have a roof, water and toilets; in Bokaro's Chas, hundreds of small traders still sit on footpaths in sun and rain.",
  location: 'Chas, Bokaro (Jharkhand)',
  reporterName: 'Editorial team',
  paras: [
    "Drive along the gleaming roads of Ranchi, Jharkhand's capital, and stand before the multi-storey Atal Vendor Market, and for a moment it seems the system has truly begun to care for the poor trader standing in the last row. There is a solid roof overhead, clean drinking water, toilets and proper lighting; there, the fear of sun, storm or downpour does not swallow a small trader's day's earnings. The capital's vendor sells with his head held high, because the system has treated him not as an 'encroachment' on the road, but as a 'respected citizen' of the city.",
    'But step into the Chas Municipal Corporation area of Bokaro, within the same state, and that whole dream of development suddenly seems to die on a footpath covered in dust and mud.',
    "Whether it is Chas Checkpost, the narrow lanes of Machhli Patti, the corner of Hari Mandir or the dusty Jodhadih More — every morning here brings no new hope of livelihood, only a fresh, bitter struggle to feed the family. When the sky pours fire, clothes and vegetables scorch under thin tarpaulin; when rain lashes down, dirty water flowing underfoot washes away the day's earnings; and when bitter cold arrives, these small traders weighing vegetables with trembling hands carry just one question in their weary eyes — what is their fault? Who took away the basic dignity that street vendors are entitled to under the law, and why?",
    "For the hundreds of families who earn an honest living soaked in sweat all day, there is no fixed place to stand, not a sip of drinking water, and not a single toilet for a woman trader or customer. Is the sweat of Chas's cloth sellers and vegetable vendors worth less than that of Ranchi's traders? Or, in the files of the Urban Development and Housing Department, is the map of development considered complete only within Ranchi's limits?",
    'The question goes straight to the policymakers sitting in the air-conditioned offices of Chas Municipal Corporation, who close their eyes even after seeing this helplessness crawling on the footpaths. Did Chas officials ever take the trouble to prepare and send the government a proposal for a fully equipped vendor market and organised vending zones on the lines of Ranchi? If such a proposal was sent, in which red file has it been gathering dust for years? And if no such proposal was ever put on paper, has the corporation decided that the hundreds of traders enduring humiliation on Chas\'s roads all day were never worthy of a solid roof?',
    "This is not just about the livelihood of a few traders; it is a test of the entire civic geography of Chas. Until these small traders are given a complete, safe and organised place, the administration has no moral right to blame the city for encroachment and traffic jams. A modern vendor market is not just a building; it is proof of a city's humanity, where buyers get a clean environment, roads stay open and sellers get the self-respect our democracy promises.",
    "The time for silence is over. The people of Chas and their hard-working hands are demanding to know when the rulers' blind slumber will break, and when justice will come out of the files and reach the footpaths of Chas.",
  ],
})
await addEnglish(
  'छत्तीसगढ़ के रायगढ़ जिले के श्री श्री 108 श्री सत्यनारायण बाबाधाम पहुंची राष्ट्रीय पारदर्शिता प्रहरी की संपादकीय टीम, गणमान्य लोगों के साथ किया परिसर का निरीक्षण',
  {
    title: "Rashtriya Pardarshita Prahari's editorial team visits Shri Shri 108 Shri Satyanarayan Baba Dham in Raigarh, Chhattisgarh; inspects the premises with local dignitaries",
    subheadline: 'Special series: Part 1 · Culture, heritage and Indian knowledge tradition',
    excerpt: 'On the night of 27 October the editorial team inspected the Baba Dham premises with Raigarh dignitaries; information about the dham will be published in a special series.',
    location: 'Raigarh, Chhattisgarh',
    reporterName: 'Editorial team',
    paras: [
      'Raigarh, 28 October 2026.',
      "On the night of 27 October 2026, the editorial team of Rashtriya Pardarshita Prahari, along with several dignitaries of Raigarh, inspected the premises of Shri Shri 108 Shri Satyanarayan Baba Dham. The visit was an effort to understand the dham's religious faith, cultural heritage and available local information.",
      'In Indian culture, religious and spiritual places matter beyond worship. They are also linked to local beliefs, traditions, collective memory and cultural identity. With this view, the editorial team observed the Baba Dham premises so that different aspects of the dham can be presented to readers in an orderly way.',
      "Information boards displayed on the premises describe Baba's penance, the building of the temple and religious activities. Studying these, along with local people's memories and available records, can help better understand the cultural background of the place.",
      'Rashtriya Pardarshita Prahari will publish information from this inspection as a special series. Coming parts will separately present available information about the dham, local traditions, historical details and other important aspects, so that information reaches readers in an organised, balanced and factual way.',
      'This special series will not be limited to introducing a religious place; it will also be an effort to understand local cultural heritage, collect its memories and raise awareness about its preservation.',
      'Rashtriya Pardarshita Prahari — Facts • Transparency • Accountability • Public interest',
      "Editorial note: This report is based on the editorial team's inspection of the premises on the night of 27 October 2026 and the information available. Historical details about the dham will be independently verified, as needed, from available records and other reliable sources.",
    ],
  },
)
process.exit(0)
