/**
 * Safe download names: NTP-2026-09-30-0001_bihar-men-sadak-suraksha_2026-09-30.mp4
 * Hindi headlines are transliterated to plain Latin letters (works on every phone/OS), truncated, never invalid.
 */
const CONS: Record<string, string> = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'n', च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n', ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n', प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm', य: 'y', र: 'r', ल: 'l', ळ: 'l', व: 'v',
  श: 'sh', ष: 'sh', स: 's', ह: 'h', क़: 'q', ख़: 'kh', ग़: 'g', ज़: 'z', ड़: 'r', ढ़: 'rh', फ़: 'f', य़: 'y',
}
const NUKTA: Record<string, string> = { क: 'q', ख: 'kh', ग: 'g', ज: 'z', ड: 'r', ढ: 'rh', फ: 'f' }
const VOWEL: Record<string, string> = { अ: 'a', आ: 'a', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u', ऋ: 'ri', ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au', ऑ: 'o' }
const MATRA: Record<string, string> = { 'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॅ': 'e', 'ॉ': 'o' }
const SIGN: Record<string, string> = { 'ं': 'n', 'ँ': 'n', 'ः': 'h' }

export function transliterate(text: string): string {
  const s = text.normalize('NFC')
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (CONS[c] != null) {
      let v = CONS[c]
      let j = i + 1
      if (s[j] === '़') {
        v = NUKTA[c] ?? v
        j++
      }
      const next = s[j]
      if (next === '्') {
        out += v
        i = j
      } else if (next && MATRA[next] != null) {
        out += v + MATRA[next]
        i = j
      } else {
        // inherent "a", dropped at the end of a word (राम → ram, not rama)
        const endOfWord = !next || !/[ऀ-ॿ]/.test(next) || SIGN[next] != null
        out += v + (endOfWord && !SIGN[next ?? ''] ? '' : 'a')
        i = j - 1
      }
    } else if (VOWEL[c] != null) out += VOWEL[c]
    else if (SIGN[c] != null) out += SIGN[c]
    else if (c >= '०' && c <= '९') out += String(c.charCodeAt(0) - 0x0966)
    else if (c === '।' || c === '॥') out += ' '
    else if (!/[ऀ-ॿ]/.test(c)) out += c
  }
  return out
}

export function slugLatin(text: string, max = 50): string {
  const s = transliterate(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (s.length <= max) return s || 'news'
  const cut = s.slice(0, max)
  return (cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : cut) || 'news'
}

/** NTP-NEWS-ID_HEADLINE_DATE.ext — date as yyyy-mm-dd (India time). */
export function downloadName(newsId: string | null | undefined, title: string, date: string | Date | null | undefined, ext: string): string {
  const day = date ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(date)) : 'undated'
  const id = (newsId || 'NTP-DRAFT').replace(/[^A-Za-z0-9-]/g, '')
  return `${id}_${slugLatin(title)}_${day}.${ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin'}`
}
