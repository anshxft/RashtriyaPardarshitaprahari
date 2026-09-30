'use client'

import Script from 'next/script'
import { startTransition, useActionState, useState } from 'react'
import { submitForm, type FormKind } from '@/app/(frontend)/[lang]/actions'
import { CONSENT, UPLOAD, type FormField } from '@/content/forms'
import type { FormState } from '@/lib/forms'
import type { Dict, Lang } from '@/lib/i18n'

const input = 'w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base focus:border-navy-700 aria-[invalid=true]:border-alert-600'

export function PublicForm({
  kind,
  fields,
  lang,
  d,
  renderedAt,
  defaults = {},
  privacyHref,
}: {
  kind: FormKind
  fields: FormField[]
  lang: Lang
  d: Dict
  renderedAt: number
  defaults?: Record<string, string>
  privacyHref: string
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitForm.bind(null, kind), {})
  const [anonymous, setAnonymous] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const err = state.errors || {}
  const f = d.form

  if (state.ok)
    return (
      <div role="status" className="rounded-xl border-2 border-india-600 bg-india-600/10 p-6 text-lg">
        <p className="font-bold">✓ {f.success}</p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wider">{state.ref}</p>
        <p className="mt-2 text-sm">{f.successNote}</p>
      </div>
    )

  return (
    // onSubmit (not the form `action` prop) so React doesn't auto-reset the form when validation fails.
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(() => action(fd))
      }}
    >
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="_t" value={renderedAt} />
      {/* Honeypot: hidden from people, bots fill it */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.message && (
        <p role="alert" className="rounded-md bg-alert-600/10 p-3 font-semibold text-alert-700 dark:text-red-300">
          {state.message === 'spam' ? f.spam : f.error}
        </p>
      )}

      {kind === 'submission' && (
        <label className="flex items-start gap-3 rounded-md bg-surface p-3">
          <input type="checkbox" name="anonymous" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-1.5 h-4 w-4" />
          <span>{f.anonymous}</span>
        </label>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((fd) => {
          const required = fd.required && !(anonymous && fd.identity)
          const id = `f-${fd.name}`
          const common = {
            id,
            name: fd.name,
            required,
            maxLength: fd.maxLength,
            defaultValue: defaults[fd.name],
            'aria-invalid': Boolean(err[fd.name]),
            'aria-describedby': err[fd.name] ? `${id}-err` : undefined,
            className: input,
          }
          return (
            <div key={fd.name} className={fd.type === 'textarea' || fd.name === 'subject' ? 'sm:col-span-2' : ''}>
              <label htmlFor={id} className="mb-1 block font-semibold">
                {fd.label[lang]} {required && <span className="text-alert-600" aria-label={f.required}>*</span>}
              </label>
              {fd.type === 'textarea' ? (
                <textarea {...common} rows={6} />
              ) : fd.type === 'select' ? (
                <select {...common}>
                  <option value="">—</option>
                  {fd.options!.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o[lang]}
                    </option>
                  ))}
                </select>
              ) : (
                <input {...common} type={fd.type} autoComplete={fd.type === 'email' ? 'email' : fd.type === 'tel' ? 'tel' : fd.name === 'name' ? 'name' : undefined} />
              )}
              {err[fd.name] && (
                <p id={`${id}-err`} className="mt-1 text-sm text-alert-600">
                  {err[fd.name]}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {kind === 'submission' && (
        <div>
          <label htmlFor="f-files" className="mb-1 block font-semibold">
            {f.files}
          </label>
          <input id="f-files" name="files" type="file" multiple accept={UPLOAD.accept} className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:font-semibold file:text-white" />
          <p className="mt-1 text-sm text-muted">{f.filesHelp.replace('{n}', String(UPLOAD.maxFiles)).replace('{mb}', String(UPLOAD.maxTotalMB))}</p>
          {err.files && <p className="mt-1 text-sm text-alert-600">{err.files}</p>}
        </div>
      )}

      <label className="flex items-start gap-3 rounded-md border border-line p-3">
        <input type="checkbox" name="consent" required className="mt-1.5 h-4 w-4 shrink-0" aria-invalid={Boolean(err.consent)} />
        <span className="text-sm">
          {CONSENT[lang]}{' '}
          <a href={privacyHref} target="_blank" className="text-link underline">
            ↗
          </a>
          {err.consent && <span className="block text-alert-600">{err.consent}</span>}
        </span>
      </label>

      {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} data-language={lang} />}

      <p className="text-sm text-muted">🔒 {f.privacyNote}</p>
      <button type="submit" disabled={pending} className="rounded-md bg-saffron-500 px-8 py-3 text-lg font-bold text-navy-950 shadow hover:bg-saffron-600 hover:text-white disabled:opacity-60">
        {pending ? f.sending : f.submit}
      </button>
    </form>
  )
}
