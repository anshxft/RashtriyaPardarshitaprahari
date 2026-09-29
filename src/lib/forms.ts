/** Pure validation helpers for the public forms (no server/client deps, so they can be unit-checked). */
import type { FormField } from '@/content/forms'

export type FormState = { ok?: boolean; ref?: string; errors?: Record<string, string>; message?: 'spam' | 'error' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[+()\-\s\d]{7,20}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/

export function validate(fields: FormField[], fd: FormData, lang: 'hi' | 'en', anonymous = false) {
  const data: Record<string, string> = {}
  const errors: Record<string, string> = {}
  const msg = {
    required: lang === 'hi' ? 'यह आवश्यक है' : 'This is required',
    invalid: lang === 'hi' ? 'मान्य नहीं है' : 'Not valid',
    long: lang === 'hi' ? 'बहुत लंबा है' : 'Too long',
  }
  for (const f of fields) {
    const v = String(fd.get(f.name) ?? '').trim()
    const required = f.required && !(anonymous && f.identity)
    if (!v) {
      if (required) errors[f.name] = msg.required
      continue
    }
    if (f.maxLength && v.length > f.maxLength) errors[f.name] = msg.long
    else if (f.type === 'email' && !EMAIL.test(v)) errors[f.name] = msg.invalid
    else if (f.type === 'tel' && !PHONE.test(v)) errors[f.name] = msg.invalid
    else if (f.type === 'date' && !DATE.test(v)) errors[f.name] = msg.invalid
    else if (f.type === 'time' && !TIME.test(v)) errors[f.name] = msg.invalid
    else if (f.type === 'select' && !f.options?.some((o) => o.value === v)) errors[f.name] = msg.invalid
    data[f.name] = v
  }
  return { data, errors }
}

/** Checks real file content, not the browser-supplied MIME type. */
export function sniffType(buf: Uint8Array): 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp' | null {
  const s = (i: number, str: string) => [...str].every((c, k) => buf[i + k] === c.charCodeAt(0))
  if (s(0, '%PDF-')) return 'application/pdf'
  if (buf[0] === 0x89 && s(1, 'PNG')) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (s(0, 'RIFF') && s(8, 'WEBP')) return 'image/webp'
  return null
}

/** Naive per-instance limiter. ponytail: in-memory, resets on deploy and isn't shared across serverless instances — use Upstash/Redis if abuse appears. */
const hits = new Map<string, number[]>()
export function rateLimited(key: string, max = 5, windowMs = 10 * 60_000) {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > max
}
