'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { saveTeamAction } from '@/app/(desk)/desk/actions'
import { TIERS } from '@/collections/TeamMembers'
import { STATE_LIST } from '@/content/states'
import { PhotoField, type Photo } from './PhotoField'

export type TeamForm = {
  id?: number
  name: string
  designation: string
  tier: string
  workArea: string
  state: string
  district: string
  bureau: string
  idNumber: string
  bio: string
  experience: string
  email: string
  phone: string
  publishContact: boolean
  order: number
  photo: Photo
  published: boolean
}


const input = 'w-full rounded-md border border-line bg-bg px-3 py-3 text-base'
const card = 'rounded-xl border border-line bg-bg p-4 shadow-sm'
const chip = 'min-h-11 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold hover:bg-surface'

/** Add New Member → Photo → Name → Designation → Work area → ID → Save/Publish. Edit a profile → change photo → Save. */
export function TeamEditor({ initial, locale, mayPublish }: { initial: TeamForm; locale: 'hi' | 'en'; mayPublish: boolean }) {
  const [f, setF] = useState(initial)
  const [busy, start] = useTransition()
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [preview, setPreview] = useState(0)
  const set = <K extends keyof TeamForm>(k: K, v: TeamForm[K]) => setF((x) => ({ ...x, [k]: v }))

  function save(mode: 'draft' | 'publish', thenPreview = false) {
    setNote(null)
    start(async () => {
      const r = await saveTeamAction({ ...f, locale, mode, photoId: f.photo.id })
      if (!r.ok) return setNote({ kind: 'err', text: r.error })
      setF((x) => ({ ...x, id: r.id, published: x.published || r.status === 'published' }))
      window.history.replaceState(null, '', `/desk/team/${r.id}${locale === 'en' ? '?lang=en' : ''}`)
      if (thenPreview) setPreview((p) => p + 1)
      setNote({ kind: 'ok', text: r.status === 'published' ? 'प्रकाशित हो गया ✔ (हमारी टीम पेज पर दिखेगा)' : 'ड्राफ्ट सेव हो गया ✔' })
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">{f.id ? '👤 प्रोफ़ाइल बदलें' : '➕ नया सदस्य'}</h1>
        <div className="flex gap-2 text-sm">
          <span className="rounded bg-white px-2 py-1 font-semibold ring-1 ring-line">{f.published ? '● प्रकाशित' : '○ ड्राफ्ट'}</span>
          {f.id && <Link className={chip} href={locale === 'hi' ? `/desk/team/${f.id}?lang=en` : `/desk/team/${f.id}`}>{locale === 'hi' ? 'English →' : '← हिंदी'}</Link>}
        </div>
      </div>
      {note && <p role="status" className={`rounded-md p-3 text-sm font-semibold ${note.kind === 'ok' ? 'bg-india-600/10 text-india-600' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className={card}>
            <h2 className="mb-3 font-display text-lg font-bold">फोटो</h2>
            <PhotoField photo={f.photo} onChange={(p) => set('photo', p)} alt={f.name} credit="" onCredit={() => {}} />
          </section>
          <section className={`${card} space-y-3`}>
            <label className="block text-sm font-semibold">नाम *<input value={f.name} onChange={(e) => set('name', e.target.value)} className={`${input} mt-1 text-lg font-bold`} /></label>
            <label className="block text-sm font-semibold">पद (जैसा दिखाना है) *<input value={f.designation} onChange={(e) => set('designation', e.target.value)} placeholder="राज्य ब्यूरो प्रमुख, बिहार" className={`${input} mt-1`} /></label>
            <label className="block text-sm font-semibold">
              श्रेणी (समूह)
              <select value={f.tier} onChange={(e) => set('tier', e.target.value)} className={`${input} mt-1`}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.hi} / {t.en}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">कार्यक्षेत्र<input value={f.workArea} onChange={(e) => set('workArea', e.target.value)} className={`${input} mt-1`} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                राज्य
                <select value={f.state} onChange={(e) => set('state', e.target.value)} className={`${input} mt-1`}>
                  <option value="">—</option>
                  {STATE_LIST.map((s) => <option key={s.value} value={s.value}>{s.hi}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">ज़िला<input value={f.district} onChange={(e) => set('district', e.target.value)} className={`${input} mt-1`} /></label>
              <label className="block text-sm font-semibold">ब्यूरो / कार्यालय<input value={f.bureau} onChange={(e) => set('bureau', e.target.value)} className={`${input} mt-1`} /></label>
              <label className="block text-sm font-semibold">आईडी संख्या<input value={f.idNumber} onChange={(e) => set('idNumber', e.target.value)} className={`${input} mt-1`} /></label>
            </div>
            <label className="block text-sm font-semibold">संक्षिप्त परिचय<textarea value={f.bio} onChange={(e) => set('bio', e.target.value)} rows={3} className={`${input} mt-1`} /></label>
            <label className="block text-sm font-semibold">अनुभव / विशेषज्ञता (वैकल्पिक)<input value={f.experience} onChange={(e) => set('experience', e.target.value)} className={`${input} mt-1`} /></label>
            <details className="rounded-md bg-surface p-3">
              <summary className="cursor-pointer text-sm font-semibold">📞 संपर्क (डिफ़ॉल्ट रूप से सार्वजनिक नहीं)</summary>
              <div className="mt-3 space-y-3">
                <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="ईमेल" className={input} />
                <input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="फोन" className={input} />
                <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5" checked={f.publishContact} onChange={(e) => set('publishContact', e.target.checked)} />संपर्क वेबसाइट पर दिखाएं</label>
              </div>
            </details>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-16 lg:self-start">
          <section className={card}>
            <h2 className="mb-2 font-display text-lg font-bold">प्रीव्यू</h2>
            {f.id ? (
              <iframe key={preview} title="प्रोफ़ाइल प्रीव्यू" src={`/${locale}/team/preview/${f.id}?t=${preview}`} className="h-64 w-full rounded-lg border border-line bg-white" />
            ) : (
              <p className="py-8 text-center text-sm text-muted">“प्रीव्यू देखें” दबाएं: ड्राफ्ट सेव होकर यहां दिखेगा।</p>
            )}
            <button type="button" disabled={busy} onClick={() => save('draft', true)} className={`${chip} mt-3 w-full`}>👁 सेव करके प्रीव्यू देखें</button>
          </section>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => save('draft')} className="min-h-12 flex-1 rounded-lg border-2 border-navy-900 px-4 font-bold text-navy-900 disabled:opacity-60 sm:flex-none">💾 ड्राफ्ट सेव</button>
        {mayPublish && (
          <button type="button" disabled={busy} onClick={() => save('publish')} className="min-h-12 flex-[2] rounded-lg bg-india-600 px-6 text-lg font-extrabold text-white disabled:opacity-60 sm:flex-none">
            {f.published ? '✔ अपडेट प्रकाशित करें' : '🚀 प्रकाशित करें'}
          </button>
        )}
        {busy && <span className="self-center text-sm text-muted">सेव हो रहा है…</span>}
      </div>
    </div>
  )
}
