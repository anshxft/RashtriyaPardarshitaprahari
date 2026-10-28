/**
 * One-off (29 Oct 2026): publishes the Magadh project air-quality story (text unchanged, no photo) in Hindi + English,
 * and puts the school-closure line in the red ticker as a 24-hour flash. Safe to run twice.
 */
import { paragraphsToLexical } from '../lib/lexical'
import { bilingual, findSlug, log, payload } from './lib'

// ── 1. Ticker flash ──────────────────────────────────────────────────────────
const FLASH = 'चक्रवाती तूफान ‘अर्णब’ के प्रभाव और खराब मौसम के चलते रांची सहित राज्य के 16 जिलों में केजी से 12वीं तक के सभी स्कूल बंद हैं।'
const flashExists = (await payload.find({ collection: 'breaking-news', where: { text: { equals: FLASH } }, locale: 'hi', limit: 1, depth: 0 })).docs[0]
if (flashExists) log('flash already there — id', flashExists.id)
else {
  const f = await payload.create({ collection: 'breaking-news', locale: 'hi', data: { text: FLASH, status: 'active', duration: '24h' } as never })
  await payload.update({ collection: 'breaking-news', id: f.id, locale: 'en', data: { text: "Due to Cyclone 'Arnab' and bad weather, all schools from KG to Class 12 are closed in 16 districts of the state, including Ranchi." } as never })
  log('flash live — id', f.id)
}

// ── 2. Story ─────────────────────────────────────────────────────────────────
const TITLE = 'धूल की चादर में गांव: क्या स्वच्छ हवा का अधिकार केवल कागजों तक सीमित है?'
const P = [
  'स्वच्छ हवा किसी सुविधा का नाम नहीं, बल्कि प्रत्येक नागरिक का बुनियादी अधिकार है। जिस प्रकार स्वच्छ पेयजल और सुरक्षित स्वास्थ्य सेवाएं मानव जीवन के लिए आवश्यक हैं, उसी प्रकार प्रदूषण रहित वातावरण भी स्वस्थ समाज की आधारशिला है। इसलिए जहां बड़े पैमाने पर औद्योगिक और खनन गतिविधियां संचालित होती हैं, वहां वायु गुणवत्ता की निरंतर निगरानी केवल कानूनी औपचारिकता नहीं, बल्कि जनस्वास्थ्य की पहली सुरक्षा रेखा होती है।',
  'झारखंड के लातेहार और चतरा क्षेत्र में संचालित सीसीएल की मगध परियोजना देश की ऊर्जा आवश्यकताओं को पूरा करने में महत्वपूर्ण योगदान दे रही है। इसके साथ ही यह भी आवश्यक है कि परियोजना क्षेत्र के आसपास रहने वाले लोगों को स्वच्छ और सुरक्षित वातावरण उपलब्ध कराने के लिए सभी पर्यावरणीय उपाय पूरी गंभीरता से लागू हों।',
  'खनन क्षेत्रों में ड्रिलिंग, ब्लास्टिंग, ओवरबर्डन हटाने, कोयला लोडिंग और परिवहन जैसी गतिविधियों के कारण धूल उत्पन्न होना स्वाभाविक है। इसी कारण पर्यावरणीय प्रबंधन योजनाओं में नियमित जल छिड़काव, हरित पट्टी का विकास, ढके हुए परिवहन, सड़क रखरखाव और वायु गुणवत्ता की वैज्ञानिक निगरानी जैसे उपायों को महत्वपूर्ण स्थान दिया जाता है। इन उपायों का उद्देश्य उत्पादन रोकना नहीं, बल्कि उत्पादन और जनस्वास्थ्य के बीच संतुलन बनाए रखना है।',
  'सबसे महत्वपूर्ण प्रश्न यह है कि परियोजना के आसपास रहने वाले नागरिकों को अपने क्षेत्र की वायु गुणवत्ता की जानकारी कितनी आसानी से उपलब्ध है? यदि वायु गुणवत्ता की निगरानी नियमित रूप से हो रही है, तो उसके परिणाम सार्वजनिक रूप से प्रदर्शित किए जाने चाहिए। इससे नागरिकों का विश्वास बढ़ेगा और पर्यावरणीय प्रबंधन की पारदर्शिता भी मजबूत होगी।',
  'आज दुनिया के अनेक औद्योगिक क्षेत्रों में रियल टाइम एयर क्वालिटी मॉनिटरिंग सिस्टम लगाए जा रहे हैं, जिनकी जानकारी डिजिटल प्लेटफॉर्म पर भी उपलब्ध रहती है। ऐसी व्यवस्था स्थानीय समुदाय, प्रशासन और उद्योग के बीच विश्वास का मजबूत माध्यम बन सकती है।',
  'यह भी आवश्यक है कि परियोजना प्रभावित विद्यालयों, आंगनबाड़ी केंद्रों, स्वास्थ्य केंद्रों और घनी आबादी वाले गांवों के आसपास विशेष पर्यावरणीय निगरानी की व्यवस्था हो। बच्चे, बुजुर्ग और पहले से बीमार लोग वायु प्रदूषण के प्रति अधिक संवेदनशील होते हैं। इसलिए जनस्वास्थ्य को पर्यावरणीय प्रबंधन का केंद्र बिंदु बनाया जाना चाहिए।',
  'जनता पूछ रही है कि "क्या परियोजना क्षेत्र में वायु गुणवत्ता की 24 घंटे वैज्ञानिक निगरानी की व्यवस्था है? क्या वायु गुणवत्ता की मासिक और वार्षिक रिपोर्ट सार्वजनिक रूप से उपलब्ध कराई जाती है? क्या धूल नियंत्रण के लिए जल छिड़काव और अन्य उपायों की नियमित समीक्षा होती है? क्या कोयला परिवहन मार्गों पर धूल कम करने के लिए विशेष व्यवस्था की गई है? क्या परियोजना प्रभावित गांवों और विद्यालयों के आसपास विशेष वायु गुणवत्ता निगरानी की जाती है? क्या हरित पट्टी (ग्रीन बेल्ट) विकसित करने का लक्ष्य और उसकी वर्तमान स्थिति सार्वजनिक है? क्या स्थानीय नागरिकों की पर्यावरण संबंधी शिकायतों के समाधान के लिए प्रभावी और समयबद्ध व्यवस्था उपलब्ध है?"',
  'परियोजना क्षेत्र में अधिक से अधिक स्थानों पर रियल टाइम वायु गुणवत्ता निगरानी प्रणाली स्थापित की जाए। वायु गुणवत्ता के आंकड़े सार्वजनिक सूचना पट्टों और डिजिटल माध्यमों पर नियमित रूप से प्रदर्शित किए जाएं। कोयला परिवहन मार्गों पर नियमित जल छिड़काव, सड़क रखरखाव और हरित पट्टी के विस्तार को प्राथमिकता दी जाए। विद्यालयों, अस्पतालों और घनी आबादी वाले क्षेत्रों के आसपास विशेष पर्यावरणीय सुरक्षा योजना लागू की जाए। स्थानीय समुदाय की भागीदारी से पर्यावरण निगरानी समितियों का गठन किया जाए।',
  'देश को ऊर्जा देना निस्संदेह राष्ट्रीय दायित्व है, लेकिन उसी ऊर्जा को पैदा करने वाले क्षेत्रों के लोगों को स्वच्छ हवा उपलब्ध कराना भी उतना ही बड़ा दायित्व है। विकास की वास्तविक पहचान तब होगी, जब खदानों से निकलने वाला कोयला देश को रोशन करे और उन खदानों के आसपास बसे गांव भी स्वच्छ हवा, सुरक्षित पर्यावरण और बेहतर स्वास्थ्य के साथ आगे बढ़ें। उत्पादन और पर्यावरण का संतुलन ही भविष्य के जिम्मेदार विकास की सबसे बड़ी पहचान है।',
]
const EN = [
  'Clean air is not a facility; it is every citizen’s basic right. Just as safe drinking water and secure health services are essential to human life, a pollution-free environment is the foundation of a healthy society. So wherever industrial and mining activities run on a large scale, continuous air-quality monitoring is not merely a legal formality but the first line of defence for public health.',
  "CCL's Magadh project in the Latehar and Chatra area of Jharkhand is making an important contribution to meeting the country's energy needs. At the same time, it is necessary that all environmental measures are implemented with full seriousness so that people living around the project area get a clean and safe environment.",
  'In mining areas, dust is a natural result of drilling, blasting, overburden removal, coal loading and transport. That is why environmental management plans give an important place to regular water sprinkling, developing green belts, covered transport, road maintenance and scientific air-quality monitoring. The aim of these measures is not to stop production but to keep a balance between production and public health.',
  'The most important question is how easily citizens living around the project can get information about the air quality of their area. If air quality is being monitored regularly, the results should be displayed publicly. This will increase citizens’ trust and strengthen the transparency of environmental management.',
  'Today, real-time air-quality monitoring systems are being installed in many industrial areas around the world, with the information also available on digital platforms. Such a system can become a strong bridge of trust between the local community, the administration and industry.',
  'It is also necessary to have special environmental monitoring around project-affected schools, anganwadi centres, health centres and densely populated villages. Children, the elderly and people who are already ill are more sensitive to air pollution. Public health should therefore be made the centre of environmental management.',
  'The public is asking: "Is there 24-hour scientific air-quality monitoring in the project area? Are monthly and annual air-quality reports made publicly available? Are water sprinkling and other dust-control measures reviewed regularly? Have special arrangements been made to reduce dust on coal transport routes? Is special air-quality monitoring done around project-affected villages and schools? Are the green-belt target and its current status public? Is there an effective, time-bound system to resolve local citizens’ environmental complaints?"',
  'Real-time air-quality monitoring systems should be installed at as many places as possible in the project area. Air-quality data should be displayed regularly on public notice boards and digital media. Regular water sprinkling on coal transport routes, road maintenance and expansion of green belts should be given priority. A special environmental protection plan should be implemented around schools, hospitals and densely populated areas. Environmental monitoring committees should be formed with the participation of the local community.',
  'Giving energy to the country is undoubtedly a national duty, but providing clean air to the people of the areas that produce that energy is an equally big duty. The real mark of development will be when coal from the mines lights up the country and the villages around those mines also move forward with clean air, a safe environment and better health. Balancing production and the environment is the greatest mark of responsible development for the future.',
]

const exists = (await payload.find({ collection: 'articles', where: { title: { equals: TITLE } }, locale: 'hi', limit: 1, depth: 0 })).docs[0]
if (exists) log('story already there — id', exists.id)
else {
  const tagIds: number[] = []
  for (const [slug, hi, en] of [
    ['jharkhand', 'झारखंड', 'Jharkhand'],
    ['latehar', 'लातेहार', 'Latehar'],
    ['chatra', 'चतरा', 'Chatra'],
    ['ccl', 'सीसीएल', 'CCL'],
    ['vayu-pradushan', 'वायु प्रदूषण', 'Air pollution'],
  ] as const)
    tagIds.push(await bilingual('tags', slug, { title: hi }, () => ({ title: en })))
  const cat = (await findSlug('categories', 'paryavaran')) ?? (await findSlug('categories', 'sawal-sarvajanik-hit-ka'))
  const a = await payload.create({
    collection: 'articles',
    locale: 'hi',
    data: {
      title: TITLE,
      subheadline: 'मगध परियोजना क्षेत्र में वायु गुणवत्ता, जनस्वास्थ्य और पर्यावरणीय निगरानी पर एक गंभीर विमर्श',
      excerpt: 'सीसीएल की मगध परियोजना के आसपास के गांवों में वायु गुणवत्ता की निगरानी, उसके आंकड़ों की सार्वजनिक उपलब्धता और धूल नियंत्रण के उपायों पर सवाल।',
      category: cat?.id,
      content: paragraphsToLexical(P),
      location: 'लातेहार-चतरा (झारखंड)',
      reporterName: 'संजीव प्रसाद साहू, लातेहार-चतरा जिला ब्यूरो प्रमुख। संपर्क : 9798770045',
      tags: tagIds,
      format: 'news',
      publishedAt: new Date().toISOString(),
      _status: 'published',
    } as never,
  })
  await payload.update({
    collection: 'articles',
    id: a.id,
    locale: 'en',
    data: {
      title: 'Villages under a blanket of dust: Is the right to clean air limited to paper?',
      subheadline: 'A serious discussion on air quality, public health and environmental monitoring in the Magadh project area',
      excerpt: "Questions on air-quality monitoring around villages near CCL's Magadh project, public access to its data and dust-control measures.",
      location: 'Latehar-Chatra (Jharkhand)',
      reporterName: 'Sanjeev Prasad Sahu, Latehar-Chatra District Bureau Chief. Contact: 9798770045',
      content: paragraphsToLexical(EN),
      _status: 'published',
    } as never,
  })
  log('published — id', a.id, a.newsId)
}
process.exit(0)
