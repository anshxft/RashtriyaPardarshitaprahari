'use server'

import { headers } from 'next/headers'
import { appointmentFields, contactFields, submissionFields, UPLOAD } from '@/content/forms'
import { db } from '@/lib/data'
import { rateLimited, sniffType, validate, type FormState } from '@/lib/forms'
import { referenceId } from '@/lib/notify'

const KINDS = {
  submission: { fields: submissionFields, collection: 'submissions', prefix: 'PP', files: true },
  appointment: { fields: appointmentFields, collection: 'appointments', prefix: 'AP', files: false },
  contact: { fields: contactFields, collection: 'contact-messages', prefix: 'CM', files: false },
} as const
export type FormKind = keyof typeof KINDS

async function turnstileOk(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured → rely on honeypot + time-trap + rate limit
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  }).catch(() => null)
  return Boolean(res && ((await res.json()) as { success?: boolean }).success)
}

export async function submitForm(kind: FormKind, _prev: FormState, fd: FormData): Promise<FormState> {
  const cfg = KINDS[kind]
  if (!cfg) return { message: 'error' }
  const lang = fd.get('lang') === 'en' ? 'en' : 'hi'
  const h = await headers()
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'local'

  // Spam checks: honeypot, filled faster than a human could, per-IP rate limit, Turnstile.
  const renderedAt = Number(fd.get('_t'))
  if (fd.get('website') || !renderedAt || Date.now() - renderedAt < 3000) return { message: 'spam' }
  if (rateLimited(`${kind}:${ip}`)) return { message: 'spam' }
  if (!(await turnstileOk(String(fd.get('cf-turnstile-response') || ''), ip))) return { message: 'spam' }

  const anonymous = kind === 'submission' && fd.get('anonymous') === 'on'
  const { data, errors } = validate(cfg.fields, fd, lang, anonymous)
  if (fd.get('consent') !== 'on') errors.consent = lang === 'hi' ? 'सहमति आवश्यक है' : 'Consent is required'

  const files = cfg.files ? (fd.getAll('files') as File[]).filter((f) => f && f.size > 0) : []
  const total = files.reduce((n, f) => n + f.size, 0)
  if (files.length > UPLOAD.maxFiles || total > UPLOAD.maxTotalMB * 1024 * 1024)
    errors.files = lang === 'hi' ? `अधिकतम ${UPLOAD.maxFiles} फाइलें, कुल ${UPLOAD.maxTotalMB} MB` : `Max ${UPLOAD.maxFiles} files, ${UPLOAD.maxTotalMB} MB total`
  const buffers = await Promise.all(files.map(async (f) => Buffer.from(await f.arrayBuffer())))
  const types = buffers.map((b) => sniffType(b))
  if (types.some((t) => !t)) errors.files = lang === 'hi' ? 'केवल PDF, JPG, PNG, WEBP फाइलें' : 'Only PDF, JPG, PNG, WEBP files'

  if (Object.keys(errors).length) return { errors, message: 'error' }

  try {
    const payload = await db()
    const ref = referenceId(cfg.prefix)
    const fileIds: number[] = []
    for (let i = 0; i < buffers.length; i++) {
      const ext = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[types[i]!]
      const doc = await payload.create({
        collection: 'private-files',
        data: { note: ref },
        file: { data: buffers[i], mimetype: types[i]!, name: `${ref}-${i + 1}.${ext}`, size: buffers[i].length },
      })
      fileIds.push(doc.id)
    }
    await payload.create({
      collection: cfg.collection,
      data: {
        ...data,
        ...(cfg.files ? { files: fileIds, anonymous } : {}),
        referenceId: ref,
        consentAt: new Date().toISOString(),
        lang,
      } as never,
    })
    return { ok: true, ref }
  } catch (e) {
    // Payload's deeper upload validation (e.g. corrupted PDF) → show it on the files field.
    if ((e as { data?: { errors?: { path?: string }[] } }).data?.errors?.some((x) => x.path === 'file'))
      return { errors: { files: lang === 'hi' ? 'फाइल खराब या अमान्य है' : 'The file is corrupted or invalid' }, message: 'error' }
    console.error('form submit failed', e)
    return { message: 'error' }
  }
}
