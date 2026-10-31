/* eslint-disable @next/next/no-img-element */
'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteAdAction, saveAdAction, setAdActiveAction, setAdsEnabledAction } from '@/app/(desk)/desk/ads/actions'
import { PhotoField, type Photo } from './PhotoField'

export type AdRow = { id: number; title: string; imageId: number | null; imageUrl: string | null; link: string; placements: string[]; active: boolean; startsAt: string; endsAt: string }

const PLACES: [string, string][] = [
  ['epaper', 'ई-पेपर (पेज 1, दाईं तरफ)'],
  ['home-top', 'वेबसाइट होम पेज'],
  ['article', 'हर खबर के अंदर'],
  ['video', 'वीडियो के बीच-बीच में'],
]
const input = 'w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base'
const chip = 'rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50'
// ISO (UTC) <-> the browser's local time for <input type="datetime-local">
const toLocal = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : '')

type Form = { id?: number; title: string; photo: Photo; link: string; placements: string[]; active: boolean; startsAt: string; endsAt: string }
const empty = (): Form => ({ title: '', photo: { id: null, url: null }, link: '', placements: ['epaper', 'home-top'], active: true, startsAt: '', endsAt: '' })

/** Desk → विज्ञापन: upload an ad, pick where it shows and for how long; switch it on/off or delete it. */
export function AdsManager({ rows, adsEnabled }: { rows: AdRow[]; adsEnabled: boolean }) {
  const router = useRouter()
  const [f, setF] = useState<Form>(empty())
  const [credit, setCredit] = useState('')
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const done = (r: { ok: boolean; error?: string }, ok: string) => {
    setNote(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error || 'कुछ गड़बड़ हुई' })
    if (r.ok) router.refresh()
  }

  const save = () =>
    start(async () => {
      const r = await saveAdAction({ id: f.id, title: f.title, imageId: f.photo.id, link: f.link, placements: f.placements, active: f.active, startsAt: fromLocal(f.startsAt), endsAt: fromLocal(f.endsAt) })
      done(r, f.id ? 'विज्ञापन बदल गया ✔' : 'विज्ञापन लग गया ✔')
      if (r.ok) setF(empty())
    })
  const edit = (a: AdRow) => {
    setF({ id: a.id, title: a.title, photo: { id: a.imageId, url: a.imageUrl }, link: a.link, placements: a.placements, active: a.active, startsAt: toLocal(a.startsAt), endsAt: toLocal(a.endsAt) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">विज्ञापन</h1>
        <label className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${adsEnabled ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>
          <input type="checkbox" className="h-5 w-5" checked={adsEnabled} disabled={pending} onChange={(e) => start(async () => done(await setAdsEnabledAction(e.target.checked), e.target.checked ? 'वेबसाइट पर विज्ञापन चालू' : 'वेबसाइट पर सभी विज्ञापन बंद'))} />
          {adsEnabled ? 'विज्ञापन चालू हैं' : 'सभी विज्ञापन बंद हैं'}
        </label>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-bg p-4">
        <h2 className="font-display text-lg font-bold">{f.id ? 'विज्ञापन बदलें' : 'नया विज्ञापन'}</h2>
        <label className="block text-sm font-semibold">
          नाम (विज्ञापन देने वाला)
          <input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={120} className={`${input} mt-1`} placeholder="जैसे: सावित्री प्रेस" />
        </label>
        <div>
          <p className="mb-1 text-sm font-semibold">विज्ञापन की फोटो</p>
          <PhotoField photo={f.photo} onChange={(p) => set('photo', p)} alt={f.title || 'विज्ञापन'} credit={credit} onCredit={setCredit} />
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">कहाँ दिखे?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PLACES.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 rounded-lg border border-line p-2.5 text-sm">
                <input type="checkbox" className="h-5 w-5" checked={f.placements.includes(v)} onChange={(e) => set('placements', e.target.checked ? [...f.placements, v] : f.placements.filter((x) => x !== v))} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <label className="block text-sm font-semibold">
          लिंक (वैकल्पिक, क्लिक करने पर खुले)
          <input value={f.link} onChange={(e) => set('link', e.target.value)} className={`${input} mt-1`} placeholder="https://" inputMode="url" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            कब से (खाली = अभी से)
            <input type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt', e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm font-semibold">
            कब तक (खाली = जब तक बंद न करें)
            <input type="datetime-local" value={f.endsAt} onChange={(e) => set('endsAt', e.target.value)} className={`${input} mt-1`} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> चालू रखें
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} disabled={pending || f.photo.busy} className="min-h-12 rounded-lg bg-india-600 px-6 font-extrabold text-white disabled:opacity-60">
            {f.id ? 'बदलाव सेव करें' : 'विज्ञापन लगाएं'}
          </button>
          {f.id && (
            <button type="button" onClick={() => setF(empty())} className="min-h-12 rounded-lg border border-line px-5 font-bold">
              रद्द करें
            </button>
          )}
        </div>
        {note && <p role="status" className={`rounded px-3 py-2 text-sm font-semibold ${note.ok ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}
      </section>

      <section className="rounded-xl border border-line bg-bg p-4">
        <h2 className="mb-2 font-display text-lg font-bold">सभी विज्ञापन ({rows.length})</h2>
        {rows.length === 0 && <p className="py-6 text-center text-muted">अभी कोई विज्ञापन नहीं।</p>}
        <ul className="divide-y divide-line">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
              {a.imageUrl ? <img src={a.imageUrl} alt="" className="h-14 w-24 rounded object-contain ring-1 ring-line" /> : <span className="h-14 w-24 rounded bg-surface" />}
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-muted">
                  {a.placements.map((p) => PLACES.find(([v]) => v === p)?.[1].split(' (')[0] || p).join(' · ')}
                  {a.endsAt && ` · ${new Date(a.endsAt).toLocaleDateString('hi-IN')} तक`}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.active ? 'bg-india-600 text-white' : 'bg-slate-200'}`}>{a.active ? 'चालू' : 'बंद'}</span>
              <button type="button" className={chip} disabled={pending} onClick={() => start(async () => done(await setAdActiveAction(a.id, !a.active), a.active ? 'विज्ञापन बंद किया' : 'विज्ञापन चालू किया'))}>
                {a.active ? 'बंद करें' : 'चालू करें'}
              </button>
              <button type="button" className={chip} onClick={() => edit(a)}>
                ✎ बदलें
              </button>
              <button type="button" className={`${chip} !border-alert-600 text-alert-700`} disabled={pending} onClick={() => window.confirm(`“${a.title}” विज्ञापन हमेशा के लिए हटाएं?`) && start(async () => done(await deleteAdAction(a.id), 'विज्ञापन हटाया गया'))}>
                हटाएं
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
