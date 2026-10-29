/**
 * One-off (29 Oct 2026): publishes the Latehar Cyclone 'Arnab' school-closure story (text unchanged) with the
 * DEO's office order as its photo (./news-photos, git-ignored), Hindi + English. Safe to run twice.
 * Production needs BLOB_READ_WRITE_TOKEN in .env.vercel (image storage).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { paragraphsToLexical } from '../lib/lexical'
import { bilingual, findSlug, log, payload } from './lib'

if (process.env.DATABASE_URL?.startsWith('postgres') && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN missing in .env.vercel — the photo would not reach the website. Stopped.')
  process.exit(1)
}

const TITLE = 'लातेहार में चक्रवात ‘अर्नब’ को लेकर हाई अलर्ट: आपदा प्रबंधन कानून के तहत 12वीं तक की कक्षाएं स्थगित, स्कूलों में शिक्षकों की उपस्थिति और डिजिटल हाजिरी अनिवार्य'
const exists = (await payload.find({ collection: 'articles', where: { title: { equals: TITLE } }, locale: 'hi', limit: 1, depth: 0 })).docs[0]
if (exists) {
  log('story already there — id', exists.id)
  process.exit(0)
}

const buf = readFileSync(path.join(process.cwd(), 'news-photos', 'latehar-deo-karyalay-adesh.jpg'))
const hero = await payload.create({
  collection: 'media',
  locale: 'hi',
  data: { alt: 'जिला शिक्षा पदाधिकारी, लातेहार का कार्यालय-आदेश (ज्ञापांक 880, दिनांक 28.10.2026)', credit: 'कार्यालय-आदेश की प्रति' } as never,
  file: { data: buf, mimetype: 'image/jpeg', name: 'latehar-deo-karyalay-adesh.jpg', size: buf.length },
})
await payload.update({ collection: 'media', id: hero.id, locale: 'en', data: { alt: 'Office order of the District Education Officer, Latehar (Memo 880, dated 28.10.2026)', credit: 'Copy of the office order' } as never })

const P = [
  'लातेहार। चक्रवाती तूफान ‘अर्नब’ और उसके प्रभाव से होने वाली मूसलाधार बारिश की गंभीर चेतावनी के बीच लातेहार जिला प्रशासन ने व्यापक एहतियाती कदम उठाते हुए स्कूली विद्यार्थियों के हित में बड़ा फैसला लिया है। भारत मौसम विज्ञान विभाग, रांची द्वारा जारी पूर्वानुमान में झारखंड के विभिन्न हिस्सों में तेज आंधी-तूफान के साथ भारी वर्षा की चेतावनी दी गई है। विशेष रूप से लातेहार जिले को मौसम विभाग द्वारा ‘ऑरेंज जोन’ की श्रेणी में चिह्नित किया गया है, जिसके तहत यहां अत्यंत प्रतिकूल मौसम, तेज हवाओं और मूसलाधार बारिश की प्रबल आशंका जताई गई है। जिले में संभावित जान-माल के खतरे और बच्चों की सुरक्षा को सर्वोपरि रखते हुए प्रशासन ने त्वरित प्रभाव से आपदा प्रबंधन अधिनियम, 2005 की धारा-34 की शक्तियों का प्रयोग करते हुए यह आपात आदेश लागू किया है।',
  'जिला शिक्षा पदाधिकारी गौतम कुमार साहु द्वारा ज्ञापांक 880 के तहत जारी आधिकारिक कार्यालय-आदेश के अनुसार, लातेहार जिले की सीमा में संचालित सभी कोटि के सरकारी, गैर-सरकारी सहायता प्राप्त (अल्पसंख्यक विद्यालयों सहित) तथा सभी निजी विद्यालयों में प्रवेश वर्ग (नर्सरी/केजी) से लेकर 12वीं कक्षा तक का शैक्षणिक कार्य 29 अक्टूबर 2026 को पूरी तरह स्थगित रहेगा। उपायुक्त, लातेहार के विधिवत अनुमोदन से जारी इस आदेश में विद्यार्थियों को प्रतिकूल मौसम के दौरान घर पर ही सुरक्षित रहने की सलाह दी गई है, ताकि आवागमन के दौरान किसी भी प्रकार की अनहोनी से बचा जा सके।',
  'हालांकि, आदेश में यह भी स्पष्ट किया गया है कि यदि किसी निजी विद्यालय में 29 अक्टूबर को पूर्व से कोई परीक्षा निर्धारित है, तो उस परीक्षा को संचालित करने अथवा स्थगित रखने के संबंध में संबंधित विद्यालय प्रबंधन अपने स्तर पर स्वतंत्र रूप से निर्णय ले सकता है। वहीं दूसरी ओर, प्रशासन ने यह कड़ा रुख भी स्पष्ट किया है कि यह अवकाश केवल छात्र-छात्राओं के पठन-पाठन तक ही सीमित है। विद्यालय के सभी शिक्षकों और शिक्षकेतर कर्मियों को सामान्य दिनों की भांति अपने-अपने विद्यालय में ससमय उपस्थित रहना अनिवार्य होगा। कार्यदिवस के दौरान सभी शिक्षक और कर्मी गैर-शैक्षणिक कार्यों का निष्पादन करेंगे और राज्य सरकार के अधिकृत ‘ई-विद्यावाहिनी’ पोर्टल पर अपनी अनिवार्य डिजिटल उपस्थिति दर्ज कराएंगे।',
  'इस आपातकालीन आदेश के प्रभावी क्रियान्वयन और निगरानी हेतु इसकी प्रतिलिपि जिले के सभी प्रखंड शिक्षा प्रसार पदाधिकारियों, विद्यालय प्रभारियों, प्रधानाध्यापकों, संबंधित निकासी एवं व्ययन पदाधिकारियों तथा जिला शिक्षा अधीक्षक, लातेहार को आवश्यक कार्रवाई के लिए प्रेषित कर दी गई है। साथ ही, स्कूली शिक्षा एवं साक्षरता विभाग, झारखंड सरकार के प्राथमिक एवं माध्यमिक शिक्षा निदेशकों और विभागीय सचिव के आप्त सचिव को भी इस निर्णय से अवगत करा दिया गया है। जिले में चक्रवात के असर और मौसम की पल-पल बदलती स्थिति पर प्रशासनिक अमला पूरी सतर्कता से नजर बनाए हुए है।',
]
const EN = [
  "Latehar. Amid a serious warning of Cyclone 'Arnab' and the torrential rain it may bring, the Latehar district administration has taken wide precautionary steps and a major decision in the interest of school students. The forecast issued by the India Meteorological Department, Ranchi, warns of strong storms and heavy rain in various parts of Jharkhand. Latehar district in particular has been placed in the 'Orange Zone' by the Met department, indicating a strong possibility of very adverse weather, strong winds and torrential rain. Keeping the possible risk to life and property and the safety of children paramount, the administration has enforced this emergency order with immediate effect, using its powers under Section 34 of the Disaster Management Act, 2005.",
  'According to the official office order issued by District Education Officer Gautam Kumar Sahu under Memo No. 880, teaching from the entry class (nursery/KG) to Class 12 will remain fully suspended on 29 October 2026 in all government, non-government aided (including minority) and all private schools within Latehar district. Issued with the due approval of the Deputy Commissioner, Latehar, the order advises students to stay safe at home during the bad weather, to avoid any mishap while travelling.',
  "The order also makes clear that if a private school already has an exam scheduled on 29 October, the school management may decide on its own whether to hold or postpone it. At the same time, the administration has made it clear that the holiday applies only to students' classes. All teachers and non-teaching staff must be present at their schools on time as on normal days. During the working day they will carry out non-teaching work and record their mandatory digital attendance on the state government's 'e-Vidyavahini' portal.",
  'For effective implementation and monitoring of this emergency order, copies have been sent for necessary action to all block education extension officers, school in-charges, headmasters, the drawing and disbursing officers concerned and the District Superintendent of Education, Latehar. The directors of primary and secondary education of the School Education and Literacy Department, Government of Jharkhand, and the private secretary to the department secretary have also been informed. The administration is keeping a close watch on the cyclone and the fast-changing weather in the district.',
]

const tagIds: number[] = []
for (const [slug, hi, en] of [
  ['jharkhand', 'झारखंड', 'Jharkhand'],
  ['latehar', 'लातेहार', 'Latehar'],
  ['chakravat-arnab', 'चक्रवात अर्नब', 'Cyclone Arnab'],
  ['mausam', 'मौसम', 'Weather'],
] as const)
  tagIds.push(await bilingual('tags', slug, { title: hi }, () => ({ title: en })))

const cat = (await findSlug('categories', 'shiksha')) ?? (await findSlug('categories', 'gaon-shahar'))
const a = await payload.create({
  collection: 'articles',
  locale: 'hi',
  data: {
    title: TITLE,
    subheadline: 'मौसम विभाग द्वारा जिले को ऑरेंज जोन में डाले जाने के बाद उपायुक्त के अनुमोदन से शिक्षा विभाग ने जारी किया आपात आदेश; विद्यार्थियों की सुरक्षा सर्वोच्च प्राथमिकता, निजी स्कूलों को परीक्षा संचालन पर स्व-विवेक का अधिकार',
    excerpt: 'चक्रवात ‘अर्नब’ की चेतावनी पर लातेहार में 29 अक्टूबर को सभी स्कूलों में प्रवेश वर्ग से 12वीं तक पढ़ाई स्थगित; शिक्षकों को स्कूल में रहकर ई-विद्यावाहिनी पर हाजिरी दर्ज करनी होगी।',
    category: cat?.id,
    heroImage: hero.id,
    content: paragraphsToLexical(P),
    location: 'लातेहार (झारखंड)',
    reporterName: 'संजीव प्रसाद साहू, जिला ब्यूरो प्रमुख',
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
    title: "High alert in Latehar over Cyclone 'Arnab': classes up to 12th suspended under disaster law; teachers' attendance in school and digital attendance mandatory",
    subheadline: "Education department issues emergency order with DC's approval after Met department puts district in Orange Zone; students' safety top priority, private schools free to decide on exams",
    excerpt: "On Cyclone 'Arnab' warning, classes from entry level to 12th suspended in all Latehar schools on 29 October; teachers must stay at school and mark attendance on e-Vidyavahini.",
    location: 'Latehar (Jharkhand)',
    reporterName: 'Sanjeev Prasad Sahu, District Bureau Chief',
    content: paragraphsToLexical(EN),
    _status: 'published',
  } as never,
})
log('published — id', a.id, a.newsId)
process.exit(0)
