/**
 * REGISTERED tagline. Never change, shorten, paraphrase or translate these two strings.
 * They live in code (not in the admin) on purpose, so nobody can edit them by accident.
 */
/** Dateline city of the e-paper (the registered office is in Ranchi). */
export const DATELINE_CITY = { hi: 'रांची, धनबाद, लातेहार एवं बोकारो', en: 'Ranchi, Dhanbad, Latehar & Bokaro' } as const
export const HELPLINE = '+91 94319 24522'

export const TAGLINE_SHORT = 'तथ्य * पारदर्शिता * जवाबदेही * जनहित'
export const TAGLINE_FULL = 'तथ्य हमारा आधार, पारदर्शिता हमारी पहचान, जवाबदेही हमारा संकल्प, जनहित हमारा उद्देश्य'

/** Prefix of the permanent News ID, e.g. NTP-2026-09-30-0001 */
export const NEWS_ID_PREFIX = 'NTP'

/** Special columns the Editor-in-Chief writes daily (footer Quick Links + home page strip). Order matters. */
export const SPECIAL_COLUMNS = ['samaj-ka-aina', 'jan-manch', 'sampadkiya'] as const

/**
 * Video news: the white scrolling ticker's standing text (client's wording, unchanged). Lines from Desk for one video
 * run before it. Shown in this order, separated by ✦.
 */
export const VIDEO_TICKER_DEFAULT = [
  'देशभर से खबरें भेजने हेतु विशेष अपील',
  'देश के हर राज्य, हर जिले और हर गांव की जनहित से जुड़ी प्रमाणिक खबरें, जमीनी समस्याएं एवं महत्वपूर्ण सूचनाएं राष्ट्रीय पारदर्शिता प्रहरी तक पहुंचाएं। आपकी सूचना जनहित में बदलाव की मजबूत आवाज बन सकती है।',
  '📞 24×7 हेल्पलाइन: 9431924522',
  '✉️ official@rashtriyapardarshitaprahari.org',
  'संवाददाता (प्रहरी) के रूप में जुड़ने हेतु विशेष आमंत्रण',
  'देशहित, जनहित और निष्पक्ष पत्रकारिता के प्रति प्रतिबद्ध हैं? राष्ट्रीय पारदर्शिता प्रहरी के साथ संवाददाता (प्रहरी) के रूप में जुड़ें। देश के हर राज्य और जिले से जागरूक, जिम्मेदार एवं सक्रिय साथियों का विशेष आमंत्रण है। आइए, तथ्यों के साथ जनहित की आवाज बनें।',
  '📞 24×7 हेल्पलाइन: 9431924522',
  '✉️ official@rashtriyapardarshitaprahari.org',
  'राष्ट्रीय पारदर्शिता प्रहरी',
  'तथ्य • पारदर्शिता • जवाबदेही • जनहित',
]
