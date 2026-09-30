/**
 * TEMPORARY DEMO NEWS (demoContent = true). Real headlines from 4–28 Sep 2026, summarised in our own words.
 * Only facts checked against the linked source. Remove all with: npm run demo:remove
 */
type Lang = { title: string; excerpt: string; body: string }
export type Demo = {
  slug: string
  category: string
  date: string
  hi: Lang
  en: Lang
  sources: { label: string; url: string }[]
  tags?: string[]
  featured?: boolean
  image?: { url: string; credit: string; creditUrl: string }
}

const commons = (file: string, author: string, license: string, url: string, note = '') => ({
  url,
  credit: `${note}${author} / Wikimedia Commons, ${license}`,
  creditUrl: `https://commons.wikimedia.org/wiki/File:${file}`,
})

export const DEMO: Demo[] = [
  {
    slug: 'fssai-lab-reports-within-14-days',
    category: 'khadya-suraksha',
    date: '2026-09-25T09:00:00+05:30',
    featured: true,
    tags: ['fssai', 'milavat'],
    image: commons(
      'ఎల్.బి._నగర్_కూరగాయల_(6).JPG',
      'Bhaskaranaidu',
      'CC BY-SA 4.0',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/%E0%B0%8E%E0%B0%B2%E0%B1%8D.%E0%B0%AC%E0%B0%BF._%E0%B0%A8%E0%B0%97%E0%B0%B0%E0%B1%8D_%E0%B0%95%E0%B1%82%E0%B0%B0%E0%B0%97%E0%B0%BE%E0%B0%AF%E0%B0%B2_%286%29.JPG/1280px-%E0%B0%8E%E0%B0%B2%E0%B1%8D.%E0%B0%AC%E0%B0%BF._%E0%B0%A8%E0%B0%97%E0%B0%B0%E0%B1%8D_%E0%B0%95%E0%B1%82%E0%B0%B0%E0%B0%97%E0%B0%BE%E0%B0%AF%E0%B0%B2_%286%29.JPG',
      'Representative image: ',
    ),
    hi: {
      title: 'मिलावट पर सख्ती: खाद्य नमूनों की जांच रिपोर्ट अब 14 दिन में देनी होगी',
      excerpt: 'FSSAI के नए संशोधन नियम 15 सितंबर को राजपत्र में प्रकाशित; आयातित खाद्य पदार्थों के लिए समय-सीमा सिर्फ पांच दिन।',
      body: `खाद्य सुरक्षा और मानक (प्रयोगशाला एवं नमूना विश्लेषण) संशोधन विनियम, 2026 को 15 सितंबर को भारत के राजपत्र में प्रकाशित किया गया है। इसके तहत खाद्य प्रयोगशालाओं को नमूना मिलने के 14 दिन के भीतर अंतिम जांच रिपोर्ट देनी होगी, जबकि आयातित खाद्य उत्पादों के लिए यह सीमा पांच दिन रखी गई है।

देरी अपरिहार्य होने पर विश्लेषक को लिखित कारण संबंधित प्राधिकारी और खाद्य सुरक्षा आयुक्त को बताना होगा। नए नियम 1 अप्रैल 2027 से पूरे देश में लागू होंगे। रिपोर्ट जल्दी आने से मिलावट के मामलों में कार्रवाई तेज़ होने की उम्मीद है।`,
    },
    en: {
      title: 'Food adulteration: lab test reports must now come within 14 days',
      excerpt: 'FSSAI amendment regulations published in the Gazette on 15 September; imported food samples get just five days.',
      body: `The Food Safety and Standards (Laboratory and Sample Analysis) Amendment Regulations, 2026 were published in the Gazette of India on 15 September. Food laboratories will have to submit their final test report within 14 days of receiving a sample, and within five days for imported food products.

If a delay cannot be avoided, the analyst must give written reasons to the authorities and the Food Safety Commissioner. The rules take effect nationwide from 1 April 2027. Faster reports are expected to speed up action in adulteration cases.`,
    },
    sources: [{ label: 'Source: AgriMoon', url: 'https://agrimoon.com/fssai-cracks-down-on-food-adulteration-food-sample-testing-reports-must-be-submitted-within-14-days-centre-issues-new-rules/' }],
  },
  {
    slug: 'gujarat-cotton-msp-registration-oct-31',
    category: 'kisan',
    date: '2026-09-28T08:30:00+05:30',
    tags: ['msp', 'kapas'],
    image: commons('Cotton_Plant_in_Bhopal_003.jpg', 'Suyash.dwivedi', 'CC BY-SA 4.0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Cotton_Plant_in_Bhopal_003.jpg/1280px-Cotton_Plant_in_Bhopal_003.jpg', 'Representative image: '),
    hi: {
      title: 'गुजरात: कपास किसान 31 अक्टूबर तक MSP पर बिक्री के लिए पंजीकरण करा सकेंगे',
      excerpt: 'पंजीकरण भारतीय कपास निगम के "कपास किसान" ऐप पर; लंबे रेशे वाली कपास का MSP 8,667 रुपये प्रति क्विंटल।',
      body: `गुजरात में खरीफ 2026-27 सीज़न के लिए कपास उगाने वाले किसान न्यूनतम समर्थन मूल्य (MSP) पर सरकारी खरीद के लिए 31 अक्टूबर 2026 तक पंजीकरण करा सकते हैं। पंजीकरण भारतीय कपास निगम (CCI) के "कपास किसान" मोबाइल ऐप के ज़रिए होगा।

इस सीज़न में लंबे रेशे वाली कपास का MSP 8,667 रुपये और मध्यम रेशे वाली कपास का 8,267 रुपये प्रति क्विंटल तय है। कृषि विभाग ने किसानों से आखिरी तारीख का इंतज़ार न करते हुए जल्द पंजीकरण कराने की अपील की है। खरीद केंद्रों की जानकारी CCI की वेबसाइट पर उपलब्ध है।`,
    },
    en: {
      title: 'Gujarat: cotton farmers can register for MSP sales until 31 October',
      excerpt: 'Registration is on the Cotton Corporation of India’s "Kapas Kisan" app; long-staple cotton MSP is ₹8,667 a quintal.',
      body: `Cotton growers in Gujarat can register until 31 October 2026 to sell their kharif 2026-27 crop to government procurement at the minimum support price (MSP). Registration is through the Cotton Corporation of India’s (CCI) "Kapas Kisan" mobile app.

The MSP this season is ₹8,667 per quintal for long-staple cotton and ₹8,267 for medium-staple. The agriculture department has urged farmers to register early rather than wait for the deadline. Details of procurement centres are on the CCI website.`,
    },
    sources: [{ label: 'Source: Punjab Kesari (IANS)', url: 'https://english.punjabkesari.com/india/gujarat-cotton-farmers-can-register-for-msp-sales-till-oct-31' }],
  },
  {
    slug: 'aarogya-manthan-2026-pmjay-eight-years',
    category: 'swasthya',
    date: '2026-09-25T18:00:00+05:30',
    tags: ['ayushman-bharat'],
    image: commons(
      'A_view_of_the_neonatal_ward_at_the_Rajiv_Gandhi_Women_and_Child_Hospital..jpg',
      'Smartshiva1988',
      'CC BY-SA 4.0',
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/A_view_of_the_neonatal_ward_at_the_Rajiv_Gandhi_Women_and_Child_Hospital..jpg',
      'Representative image: ',
    ),
    hi: {
      title: 'आरोग्य मंथन 2026: आयुष्मान भारत PM-JAY के आठ साल, 60 करोड़ से अधिक लाभार्थी',
      excerpt: 'केंद्रीय स्वास्थ्य मंत्री जे.पी. नड्डा ने विज्ञान भवन में कार्यक्रम का उद्घाटन किया; ABDM के तहत 97 करोड़ से ज़्यादा ABHA बने।',
      body: `केंद्रीय स्वास्थ्य मंत्री जे.पी. नड्डा ने 25 सितंबर को नई दिल्ली के विज्ञान भवन में "आरोग्य मंथन 2026" का उद्घाटन किया। राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA) द्वारा आयोजित यह कार्यक्रम आयुष्मान भारत PM-JAY के आठ वर्ष और आयुष्मान भारत डिजिटल मिशन (ABDM) के पांच वर्ष पूरे होने पर हुआ।

बताया गया कि PM-JAY के दायरे में 60 करोड़ से अधिक लाभार्थी हैं और ABDM के तहत 97 करोड़ से अधिक ABHA (स्वास्थ्य खाते) बनाए गए हैं। मंत्री ने कहा कि कार्यक्रम में शुरू की गई पहलों से डिजिटल स्वास्थ्य सेवाएं और स्वास्थ्य डेटा का सुरक्षित उपयोग मज़बूत होगा।`,
    },
    en: {
      title: 'Aarogya Manthan 2026: eight years of Ayushman Bharat PM-JAY, over 60 crore beneficiaries',
      excerpt: 'Union Health Minister J.P. Nadda opened the event at Vigyan Bhawan; more than 97 crore ABHA IDs created under ABDM.',
      body: `Union Health Minister J.P. Nadda inaugurated "Aarogya Manthan 2026" at Vigyan Bhawan, New Delhi, on 25 September. Organised by the National Health Authority (NHA), the event marked eight years of Ayushman Bharat PM-JAY and five years of the Ayushman Bharat Digital Mission (ABDM).

PM-JAY covers over 60 crore beneficiaries, and more than 97 crore ABHA health accounts have been created under ABDM. The minister said initiatives launched at the event would strengthen digital health services and the secure use of health data.`,
    },
    sources: [{ label: 'Source: LatestLY (ANI)', url: 'https://www.latestly.com/agency-news/india-news-jp-nadda-inaugurates-aarogya-manthan-2026-marking-8-years-of-pm-jay-scheme-7620348.html' }],
  },
  {
    slug: 'lucknow-heavy-rain-schools-closed',
    category: 'rajya',
    date: '2026-09-26T10:00:00+05:30',
    tags: ['uttar-pradesh', 'mausam'],
    image: commons('Bada_Imambara_under_rain.jpg', 'Abhishek Anand19', 'CC BY-SA 4.0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Bada_Imambara_under_rain.jpg/1280px-Bada_Imambara_under_rain.jpg'),
    hi: {
      title: 'लखनऊ में लगातार भारी बारिश, 12 घंटे में 86.6 मिमी; स्कूल-कॉलेज बंद',
      excerpt: 'ज़िलाधिकारी ने 26 सितंबर को प्री-प्राइमरी से कक्षा 12 तक सभी स्कूल-कॉलेज बंद रखने का आदेश दिया; मुख्यमंत्री ने ज़िलों को सतर्क रहने को कहा।',
      body: `उत्तर प्रदेश की राजधानी लखनऊ में 24 घंटे से अधिक समय तक हुई लगातार बारिश के बाद शनिवार, 26 सितंबर को जनजीवन प्रभावित रहा। लखनऊ हवाई अड्डे के मौसम केंद्र पर 12 घंटे में 86.6 मिमी बारिश दर्ज की गई।

ज़िलाधिकारी ने प्री-प्राइमरी से कक्षा 12 तक के सभी स्कूलों और कॉलेजों को उस दिन बंद रखने का आदेश दिया। मुख्यमंत्री योगी आदित्यनाथ ने बारिश से प्रभावित क्षेत्रों के ज़िलाधिकारियों को सतर्क रहने के निर्देश दिए। मौसम विभाग ने उत्तर भारत में बारिश का एक और दौर आने की चेतावनी दी थी।`,
    },
    en: {
      title: 'Incessant rain in Lucknow, 86.6 mm in 12 hours; schools and colleges shut',
      excerpt: 'The district magistrate closed all schools and colleges from pre-primary to Class 12 on 26 September; the CM asked districts to stay alert.',
      body: `Life in Lucknow was disrupted on Saturday, 26 September, after more than 24 hours of continuous rain. The Met station at Lucknow airport recorded 86.6 mm of rain in 12 hours.

The district magistrate ordered all schools and colleges, from pre-primary to Class 12, to remain closed that day. Chief Minister Yogi Adityanath directed district magistrates in rain-hit areas to stay vigilant. The weather office had warned of another spell of rain across north India.`,
    },
    sources: [{ label: 'Source: LatestLY', url: 'https://www.latestly.com/india/news/lucknow-latest-news-today-on-september-26th-2026-heavy-rains-school-closures-new-housing-projects-7621025.html' }],
  },
  {
    slug: 'up-international-trade-show-2026-greater-noida',
    category: 'arthvyavastha',
    date: '2026-09-25T12:00:00+05:30',
    tags: ['uttar-pradesh'],
    hi: {
      title: 'ग्रेटर नोएडा में यूपी इंटरनेशनल ट्रेड शो का चौथा संस्करण शुरू',
      excerpt: 'राज्य सरकार और इंडिया एक्सपोज़िशन मार्ट लिमिटेड का संयुक्त आयोजन; लक्ष्य प्रदेश को वैश्विक सोर्सिंग केंद्र के रूप में पेश करना।',
      body: `उत्तर प्रदेश इंटरनेशनल ट्रेड शो का चौथा संस्करण 25 सितंबर 2026 को ग्रेटर नोएडा के इंडिया एक्सपो सेंटर एंड मार्ट में शुरू हुआ। इसका आयोजन उत्तर प्रदेश सरकार और इंडिया एक्सपोज़िशन मार्ट लिमिटेड मिलकर कर रहे हैं।

आयोजकों के अनुसार इस मेले का उद्देश्य राज्य के उत्पादों और उद्योगों को देश-विदेश के खरीदारों के सामने रखना और प्रदेश को एक वैश्विक सोर्सिंग केंद्र के रूप में स्थापित करना है। आयोजन के दौरान नोएडा में भारी वाहनों के लिए मार्ग परिवर्तन लागू किया गया।`,
    },
    en: {
      title: 'Fourth UP International Trade Show opens in Greater Noida',
      excerpt: 'Jointly organised by the state government and India Exposition Mart Ltd to pitch Uttar Pradesh as a global sourcing hub.',
      body: `The fourth edition of the Uttar Pradesh International Trade Show opened on 25 September 2026 at the India Expo Centre & Mart in Greater Noida. It is jointly organised by the Government of Uttar Pradesh and India Exposition Mart Ltd.

Organisers say the fair aims to showcase the state's products and industries to domestic and international buyers and position Uttar Pradesh as a global sourcing hub. Traffic diversions for heavy vehicles were put in place in Noida during the event.`,
    },
    sources: [{ label: 'Source: Ground News (aggregated reports)', url: 'https://ground.news/article/up-international-trade-show-in-noida-route-diversions-implemented-no-entry-for-heavy-vehicles-from-september-24-to-29-noida-gautambudh-nag' }],
  },
  {
    slug: 'august-retail-inflation-4-82-percent',
    category: 'arthvyavastha',
    date: '2026-09-14T19:00:00+05:30',
    tags: ['mehngai', 'rbi'],
    hi: {
      title: 'अगस्त में खुदरा महंगाई बढ़कर 4.82%, RBI की नीति बैठक 29 सितंबर से',
      excerpt: 'जुलाई में उपभोक्ता मूल्य सूचकांक आधारित महंगाई 4.45% थी; मौद्रिक नीति समिति की अगली बैठक 29 सितंबर–1 अक्टूबर को।',
      body: `उपभोक्ता मूल्य सूचकांक (CPI) पर आधारित खुदरा महंगाई अगस्त 2026 में सालाना आधार पर 4.82% रही, जो जुलाई के 4.45% से अधिक है। यह रिज़र्व बैंक के 2 से 6 प्रतिशत के लक्ष्य दायरे के भीतर है, लेकिन ऊपरी सीमा की ओर बढ़ रही है।

विश्लेषकों के मुताबिक इससे ब्याज दरों को लंबे समय तक स्थिर रखने की गुंजाइश कम हो सकती है। रिज़र्व बैंक की मौद्रिक नीति समिति की बैठक 29 सितंबर से 1 अक्टूबर तक होनी है। आम परिवारों के लिए महंगाई का सीधा असर रसोई और रोज़मर्रा के खर्च पर पड़ता है।`,
    },
    en: {
      title: 'Retail inflation rises to 4.82% in August; RBI policy meet from 29 September',
      excerpt: 'CPI inflation was 4.45% in July; the Monetary Policy Committee meets 29 September–1 October.',
      body: `Retail inflation based on the Consumer Price Index (CPI) rose to 4.82% year-on-year in August 2026, up from 4.45% in July. It remains within the Reserve Bank's 2–6% target band but is moving towards the upper end.

Analysts say this may narrow the room to keep interest rates on hold for long. The RBI's Monetary Policy Committee is scheduled to meet from 29 September to 1 October. For households, inflation shows up most directly in kitchen and everyday expenses.`,
    },
    sources: [{ label: 'Source: Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-09-14/india-august-inflation-accelerates-narrowing-rbi-pause-room' }],
  },
  {
    slug: 'supreme-court-split-verdict-cec-act-2023',
    category: 'kanoon-nyay',
    date: '2026-09-23T17:00:00+05:30',
    tags: ['supreme-court', 'chunav-ayog'],
    image: commons('Supreme_Court_of_India,_inside_buildings_01.jpg', 'Pinakpani', 'CC BY-SA 4.0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Supreme_Court_of_India%2C_inside_buildings_01.jpg/1280px-Supreme_Court_of_India%2C_inside_buildings_01.jpg'),
    hi: {
      title: 'मुख्य चुनाव आयुक्त कानून, 2023 की चुनौती पर सुप्रीम कोर्ट का खंडित फैसला',
      excerpt: 'दो जजों की पीठ में मत भिन्न; मामला स्थायी संविधान पीठ के गठन पर विचार के लिए मुख्य न्यायाधीश के पास भेजा गया।',
      body: `सुप्रीम कोर्ट ने 23 सितंबर को मुख्य चुनाव आयुक्त और अन्य चुनाव आयुक्तों की नियुक्ति से जुड़े 2023 के कानून को दी गई चुनौती (डॉ. जया ठाकुर बनाम भारत संघ) पर खंडित फैसला सुनाया। न्यायमूर्ति दीपांकर दत्ता और न्यायमूर्ति सतीश चंद्र शर्मा की पीठ गुण-दोष पर एकमत नहीं हो सकी।

दोनों न्यायाधीशों ने एक साझा प्रक्रियात्मक आदेश में मामले को मुख्य न्यायाधीश के पास भेजा और शुद्ध संवैधानिक प्रश्नों के लिए स्थायी संविधान पीठ के गठन पर विचार का अनुरोध किया, ताकि लंबित संदर्भों में देरी न हो। अब इस पर बड़ी पीठ में सुनवाई होगी।`,
    },
    en: {
      title: 'Supreme Court delivers split verdict on challenge to Chief Election Commissioner Act, 2023',
      excerpt: 'The two-judge bench differed on merits; the matter goes to the Chief Justice to consider a permanent Constitution Bench.',
      body: `On 23 September the Supreme Court delivered a split verdict on the challenge to the 2023 law on appointing the Chief Election Commissioner and Election Commissioners (Dr Jaya Thakur v. Union of India). Justices Dipankar Datta and Satish Chandra Sharma did not agree on the merits.

In a common procedural order, both judges referred the matter to the Chief Justice of India and asked him to consider setting up a permanent Constitution Bench for pure constitutional questions, to avoid delays in pending references. A larger bench will now hear the case.`,
    },
    sources: [{ label: 'Source: Verdictum', url: 'https://www.verdictum.in/weekly-summary/weekly-overview-supreme-court-judgments-september-21-september-25-2026-1622906' }],
  },
  {
    slug: 'isro-gisat-1a-eos-05-launch',
    category: 'vigyan-takneek',
    date: '2026-09-04T09:00:00+05:30',
    tags: ['isro'],
    image: commons(
      '01_Launch_of_GSLV_Mk_III_D2_with_GSAT-29_from_Second_Launch_Pad_of_Satish_Dhawan_Space_Centre,_Sriharikota_(SDSC_SHAR).jpg',
      'Indian Space Research Organisation',
      'GODL-India',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/01_Launch_of_GSLV_Mk_III_D2_with_GSAT-29_from_Second_Launch_Pad_of_Satish_Dhawan_Space_Centre%2C_Sriharikota_%28SDSC_SHAR%29.jpg/1280px-01_Launch_of_GSLV_Mk_III_D2_with_GSAT-29_from_Second_Launch_Pad_of_Satish_Dhawan_Space_Centre%2C_Sriharikota_%28SDSC_SHAR%29.jpg',
      'Representative image (earlier GSLV launch): ',
    ),
    hi: {
      title: 'इसरो ने GSLV-F17 से पृथ्वी अवलोकन उपग्रह EOS-05 (GISAT-1A) लॉन्च किया',
      excerpt: 'सात महीने के अंतराल के बाद प्रक्षेपण; उपग्रह हर 30 मिनट में पूरे भारतीय भूभाग की तस्वीर लेने में सक्षम।',
      body: `भारतीय अंतरिक्ष अनुसंधान संगठन (इसरो) ने 4 सितंबर 2026 को श्रीहरिकोटा के सतीश धवन अंतरिक्ष केंद्र से GSLV-F17 रॉकेट के ज़रिए पृथ्वी अवलोकन उपग्रह EOS-05, जिसे GISAT-1A भी कहा जाता है, लॉन्च किया। लगभग 2,637 किलो का यह उपग्रह GSLV से भेजा गया अब तक का सबसे भारी उपग्रह है।

भू-समकालिक कक्षा से यह उपग्रह आपदाओं, कृषि और वन क्षेत्र की लगभग वास्तविक समय में निगरानी में मदद करेगा। यह प्रक्षेपण इस साल के पहले असफल मिशन के बाद करीब सात महीने के अंतराल पर हुआ।`,
    },
    en: {
      title: 'ISRO launches earth-observation satellite EOS-05 (GISAT-1A) on GSLV-F17',
      excerpt: 'The launch ends a seven-month gap; the satellite can image the whole Indian landmass every 30 minutes.',
      body: `The Indian Space Research Organisation (ISRO) launched the earth-observation satellite EOS-05, also called GISAT-1A, on a GSLV-F17 rocket from Satish Dhawan Space Centre, Sriharikota, on 4 September 2026. At about 2,637 kg, it is the heaviest satellite GSLV has carried.

From geosynchronous orbit it will support near-real-time monitoring of disasters, agriculture and forests. The launch came after a gap of about seven months following the failure of ISRO's first mission of the year.`,
    },
    sources: [
      { label: 'Source: Wikipedia — EOS-05', url: 'https://en.wikipedia.org/wiki/EOS-05' },
      { label: 'Source: Business Standard', url: 'https://www.business-standard.com/technology/tech-news/isro-gisat-1a-launch-september-seven-month-launch-gap-126081800329_1.html' },
    ],
  },
  {
    slug: 'ssc-cgl-2026-tier-1-from-september-30',
    category: 'yuva-rozgar',
    date: '2026-09-27T11:00:00+05:30',
    tags: ['ssc', 'bharti'],
    hi: {
      title: 'SSC CGL 2026 टियर-1 परीक्षा 30 सितंबर से, पहले दिनों के एडमिट कार्ड जारी',
      excerpt: 'परीक्षा 30 सितंबर से 30 अक्टूबर तक; उम्मीदवार अपनी परीक्षा तारीख से 2–3 दिन पहले ssc.gov.in से एडमिट कार्ड डाउनलोड कर सकेंगे।',
      body: `कर्मचारी चयन आयोग (SSC) की संयुक्त स्नातक स्तरीय (CGL) 2026 टियर-1 परीक्षा 30 सितंबर से 30 अक्टूबर 2026 तक होगी। 30 सितंबर और 1 अक्टूबर को परीक्षा देने वाले उम्मीदवारों के एडमिट कार्ड जारी कर दिए गए हैं।

बाकी उम्मीदवारों के एडमिट कार्ड उनकी अपनी परीक्षा तारीख से लगभग 2–3 दिन पहले उपलब्ध होंगे। उम्मीदवार पंजीकरण संख्या और पासवर्ड से ssc.gov.in पर लॉगिन कर हॉल टिकट डाउनलोड कर सकते हैं। परीक्षा शहर की जानकारी पहले ही जारी की जा चुकी है।`,
    },
    en: {
      title: 'SSC CGL 2026 Tier-1 from 30 September; admit cards out for first days',
      excerpt: 'The exam runs 30 September–30 October; candidates can download admit cards from ssc.gov.in 2–3 days before their date.',
      body: `The Staff Selection Commission's Combined Graduate Level (CGL) 2026 Tier-1 exam will be held from 30 September to 30 October 2026. Admit cards for candidates appearing on 30 September and 1 October have been released.

Other candidates will get admit cards roughly 2–3 days before their own exam date. Candidates can log in at ssc.gov.in with their registration number and password to download the hall ticket. Exam-city details were released earlier.`,
    },
    sources: [
      { label: 'Source: Shiksha', url: 'https://www.shiksha.com/news/sarkari-exams-ssc-cgl-tier-1-admit-card-2026-out-for-september-30-oct-1-exam-download-hall-ticket-ssc-gov-in-blogId-243049' },
      { label: 'Source: Organiser', url: 'https://organiser.org/2026/09/14/380396/employment/ssc-cgl-tier-1-exams-from-september-30-to-october-30-check-schedule-and-admit-card-details-vacancies/' },
    ],
  },
  {
    slug: 'perambalur-highway-car-bus-collision',
    category: 'sadak-suraksha',
    date: '2026-09-24T09:00:00+05:30',
    tags: ['sadak-haadsa'],
    image: commons('National_Highway_5_at_Payakaraopeta.jpg', 'Adityamadhav83', 'CC BY-SA 4.0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/National_Highway_5_at_Payakaraopeta.jpg/1280px-National_Highway_5_at_Payakaraopeta.jpg', 'Representative image: '),
    hi: {
      title: 'तमिलनाडु: पेरम्बलूर के पास हाईवे पर कार-बस टक्कर, तीन की मौत',
      excerpt: 'त्रिची–चेन्नई राजमार्ग पर हुए हादसे में चार लोग घायल; तेज़ रफ्तार और हाईवे सुरक्षा पर फिर सवाल।',
      body: `तमिलनाडु में त्रिची–चेन्नई राजमार्ग पर पेरम्बलूर के पास 24 सितंबर को एक कार और बस की टक्कर में तीन लोगों की मौत हो गई और चार लोग घायल हो गए।

ऐसे हादसे बताते हैं कि राजमार्गों पर गति सीमा, सुरक्षित ओवरटेकिंग और सीट बेल्ट जैसे बुनियादी नियमों का पालन कितना ज़रूरी है। राष्ट्रीय राजमार्गों पर दुर्घटना संभावित स्थानों (ब्लैक स्पॉट) की पहचान और सुधार की प्रगति पर हम आगे रिपोर्ट करेंगे।`,
    },
    en: {
      title: 'Tamil Nadu: car-bus collision near Perambalur on highway kills three',
      excerpt: 'Four injured in the crash on the Trichy–Chennai highway; questions again on speed and highway safety.',
      body: `Three people were killed and four injured when a car and a bus collided near Perambalur on the Trichy–Chennai highway in Tamil Nadu on 24 September.

Crashes like this underline how vital basic rules are on highways — speed limits, safe overtaking and seat belts. We will follow up on progress in identifying and fixing accident-prone "black spots" on national highways.`,
    },
    sources: [{ label: 'Source: ANI', url: 'https://www.aninews.in/news/national/general-news/three-killed-four-injured-in-car-bus-collision-on-trichy-chennai-highway-near-perambalur20260924085313/' }],
  },
  {
    slug: 'asian-games-2026-squash-silvers-day-8',
    category: 'rashtriya',
    date: '2026-09-27T20:00:00+05:30',
    tags: ['asian-games'],
    hi: {
      title: 'एशियाई खेल 2026: स्क्वॉश में अभय सिंह और अनाहत सिंह को रजत, एंसी सोजन ने भी जीता रजत',
      excerpt: 'जापान के आइची-नागोया में चल रहे खेलों के आठवें दिन भारत ने कई पदक जीते।',
      body: `जापान के आइची-नागोया में 19 सितंबर से 4 अक्टूबर तक चल रहे एशियाई खेल 2026 के आठवें दिन, 27 सितंबर को, भारत ने कई पदक जीते। स्क्वॉश के पुरुष एकल फाइनल में अभय सिंह और महिला एकल फाइनल में अनाहत सिंह को मलेशियाई खिलाड़ियों से हारकर रजत पदक मिला।

एथलेटिक्स में एंसी सोजन ने महिलाओं की लंबी कूद में रजत पदक जीता। खेलों में भारत का बड़ा दल हिस्सा ले रहा है और अगले दिनों में और पदकों की उम्मीद है।`,
    },
    en: {
      title: 'Asian Games 2026: squash silvers for Abhay Singh and Anahat Singh; Ancy Sojan wins silver',
      excerpt: 'India added several medals on day eight of the Games in Aichi-Nagoya, Japan.',
      body: `On day eight of the 2026 Asian Games in Aichi-Nagoya, Japan (19 September–4 October), India added several medals on 27 September. In squash, Abhay Singh in the men's singles final and Anahat Singh in the women's singles final took silver after losing to Malaysian opponents.

In athletics, Ancy Sojan won silver in the women's long jump. India has a large contingent at the Games, with more medal chances in the coming days.`,
    },
    sources: [
      { label: 'Source: Olympics.com', url: 'https://www.olympics.com/en/news/asian-games-2026-live-scores-updates-results-india-september-27' },
      { label: 'Source: Wikipedia — India at the 2026 Asian Games', url: 'https://en.wikipedia.org/wiki/India_at_the_2026_Asian_Games' },
    ],
  },
  {
    slug: 'athur-village-women-shg-outreach',
    category: 'achha-kaam',
    date: '2026-09-25T15:00:00+05:30',
    tags: ['mahila-sashaktikaran'],
    image: commons('Women_self_help_group_foundation.jpg', 'Pondicherry17', 'CC BY-SA 4.0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Women_self_help_group_foundation.jpg/1280px-Women_self_help_group_foundation.jpg', 'Representative image: '),
    hi: {
      title: 'अथूर गांव में महिला स्वयं सहायता समूहों के लिए बचत, जल संरक्षण और स्वरोज़गार पर कार्यशाला',
      excerpt: 'SRM संस्थान के केमिकल इंजीनियरिंग विभाग ने उन्नत भारत अभियान 2.0 के तहत चेंगलपट्टू ज़िले में कार्यक्रम किया।',
      body: `तमिलनाडु के चेंगलपट्टू ज़िले के अथूर गांव में 25 सितंबर को महिला स्वयं सहायता समूहों (SHG) के लिए एक आउटरीच कार्यक्रम हुआ। इसे SRM इंस्टीट्यूट ऑफ साइंस एंड टेक्नोलॉजी के केमिकल इंजीनियरिंग विभाग ने उन्नत भारत अभियान 2.0 के साथ मिलकर आयोजित किया।

सत्रों में वित्तीय योजना और छोटी बचत योजनाओं, वर्षा जल संचयन व जल संरक्षण, और हर्बल सैनिटरी नैपकिन बनाने का व्यावहारिक प्रशिक्षण दिया गया। उद्देश्य है महिलाओं में वित्तीय जागरूकता बढ़ाना और स्वरोज़गार के अवसर खोलना।`,
    },
    en: {
      title: 'Athur village: workshop for women’s self-help groups on savings, water and self-employment',
      excerpt: 'SRM institute’s chemical engineering department held the programme under Unnat Bharat Abhiyan 2.0 in Chengalpattu district.',
      body: `An outreach programme for women's self-help groups (SHGs) was held on 25 September at Athur village in Chengalpattu district, Tamil Nadu. It was organised by the Department of Chemical Engineering at SRM Institute of Science and Technology with Unnat Bharat Abhiyan 2.0.

Sessions covered financial planning and small-savings schemes, rainwater harvesting and water conservation, and hands-on training in making herbal sanitary napkins. The aim is to build financial awareness and open up self-employment opportunities for women.`,
    },
    sources: [{ label: 'Source: SRMIST', url: 'https://www.srmist.edu.in/events/women-shg-empowerment-and-livelihood-development-initiatives/' }],
  },
]

export const DEMO_BREAKING = [
  { hi: 'FSSAI: खाद्य नमूनों की जांच रिपोर्ट अब 14 दिन में अनिवार्य (1 अप्रैल 2027 से)', en: 'FSSAI: food sample reports mandatory within 14 days (from 1 April 2027)', slug: 'fssai-lab-reports-within-14-days' },
  { hi: 'SSC CGL टियर-1 परीक्षा 30 सितंबर से शुरू', en: 'SSC CGL Tier-1 exam begins 30 September', slug: 'ssc-cgl-2026-tier-1-from-september-30' },
  { hi: 'RBI मौद्रिक नीति समिति की बैठक 29 सितंबर से', en: 'RBI Monetary Policy Committee meets from 29 September', slug: 'august-retail-inflation-4-82-percent' },
  { hi: 'गुजरात: कपास MSP पंजीकरण 31 अक्टूबर तक', en: 'Gujarat: cotton MSP registration till 31 October', slug: 'gujarat-cotton-msp-registration-oct-31' },
]
