/** Staff-account security helpers (pure + node:crypto only, so the proxy and the checks can import them). */
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// ── Strong passwords ────────────────────────────────────────────────────────────────────────
const COMMON = ['password', 'qwerty', '123456', 'admin', 'letmein', 'welcome', 'india', 'prahari', 'pardarshita']
/** null = fine, otherwise what is wrong (shown to the person setting the password). */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return 'Password must be at least 12 characters / पासवर्ड कम से कम 12 अक्षर का हो'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) return 'Use a capital letter, a small letter, a number and a symbol / बड़ा अक्षर, छोटा अक्षर, अंक और चिह्न ज़रूर रखें'
  const low = pw.toLowerCase()
  if (COMMON.some((c) => low.includes(c))) return 'Password is too easy to guess / पासवर्ड बहुत आसान है'
  if (/(.)\1{3,}/.test(pw)) return 'Too many repeated characters / एक ही अक्षर बार-बार न रखें'
  return null
}

// ── Keys derived from the one secret already configured ───────────────────────────────────
const secret = () => process.env.PAYLOAD_SECRET || 'dev-secret'
const key = (purpose: string) => createHash('sha256').update(`${purpose}:${secret()}`).digest()

/** AES-256-GCM: returns base64url(iv | tag | ciphertext). */
export function seal(plain: Buffer | string, k: Buffer = key('seal')): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', k, iv)
  const enc = Buffer.concat([c.update(plain), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url')
}
export function unseal(token: string, k: Buffer = key('seal')): Buffer {
  const b = Buffer.from(token, 'base64url')
  const d = createDecipheriv('aes-256-gcm', k, b.subarray(0, 12))
  d.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([d.update(b.subarray(28)), d.final()])
}
/** Backup key: BACKUP_KEY if set (so backups can be opened even if PAYLOAD_SECRET is rotated), else derived. */
export const backupKey = () => (process.env.BACKUP_KEY ? createHash('sha256').update(process.env.BACKUP_KEY).digest() : key('backup'))

// ── TOTP (RFC 6238: 6 digits, 30 s, SHA-1 — works with Google/Microsoft Authenticator, Authy…) ─────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export const newTotpSecret = () => b32(randomBytes(20))
function b32(buf: Buffer): string {
  let bits = 0, val = 0, out = ''
  for (const byte of buf) {
    val = (val << 8) | byte
    bits += 8
    while (bits >= 5) (out += B32[(val >>> (bits - 5)) & 31]), (bits -= 5)
  }
  return bits ? out + B32[(val << (5 - bits)) & 31] : out
}
function unb32(s: string): Buffer {
  let bits = 0, val = 0
  const out: number[] = []
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const i = B32.indexOf(ch)
    if (i < 0) continue
    val = (val << 5) | i
    bits += 5
    if (bits >= 8) out.push((val >>> (bits - 8)) & 255), (bits -= 8)
  }
  return Buffer.from(out)
}
export function totpAt(secretB32: string, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', unb32(secretB32)).update(msg).digest()
  const o = h[h.length - 1] & 15
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}
/** Counter that matched (±1 step for clock drift) or null. `last` blocks re-using a code already accepted. */
export function totpVerify(secretB32: string, code: string, last = 0, now = Date.now()): number | null {
  const c = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(c)) return null
  const step = Math.floor(now / 30_000)
  for (const n of [step, step - 1, step + 1]) if (n > last && totpAt(secretB32, n) === c) return n
  return null
}
export const otpauthUri = (secretB32: string, account: string, issuer = 'राष्ट्रीय पारदर्शिता प्रहरी') =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`

// ── "2FA done" cookie: signed (userId, expiry) — checked by the proxy and by currentUser() ─────────
export const TWOFA_COOKIE = 'prahari-2fa'
export const TWOFA_TTL_MS = 8 * 60 * 60 * 1000
const sig = (s: string) => createHmac('sha256', key('2fa')).update(s).digest('base64url')
export function twofaIssue(userId: string | number, now = Date.now()): string {
  const body = `${userId}.${now + TWOFA_TTL_MS}`
  return `${body}.${sig(body)}`
}
export function twofaValid(cookie: string | undefined, userId: string | number, now = Date.now()): boolean {
  const parts = (cookie || '').split('.')
  if (parts.length !== 3 || parts[0] !== String(userId) || Number(parts[1]) < now) return false
  const a = Buffer.from(sig(`${parts[0]}.${parts[1]}`)), b = Buffer.from(parts[2])
  return a.length === b.length && timingSafeEqual(a, b)
}
/** The 2-step check is on only when REQUIRE_2FA=1 (set on Vercel) — so local development is never locked out. */
export const twofaRequired = () => process.env.REQUIRE_2FA === '1'
/** User id from a Payload JWT cookie WITHOUT verifying it (Payload verifies it; the 2FA cookie must simply match this id). */
export function jwtUserId(token: string | undefined): string | null {
  try {
    const p = JSON.parse(Buffer.from(token!.split('.')[1], 'base64url').toString())
    return p?.id != null ? String(p.id) : null
  } catch {
    return null
  }
}
