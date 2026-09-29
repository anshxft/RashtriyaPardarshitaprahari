/** Keeps Devanagari (letters + vowel signs) and Latin; everything else becomes "-". */
export const slugify = (s: string) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
