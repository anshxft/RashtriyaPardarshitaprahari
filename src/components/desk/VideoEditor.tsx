/* eslint-disable @next/next/no-img-element */
'use client'

import { upload } from '@vercel/blob/client'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { retryVideoAction, saveVideoAction, startVideoAction } from '@/app/(desk)/desk/actions'
import type { CategoryOption, TeamOption } from '@/lib/deskTypes'
import { PhotoField, type Photo } from './PhotoField'

export type VideoForm = {
  id?: number
  title: string
  description: string
  location: string
  eventDate: string
  reporterName: string
  reporterId: number | null
  categoryId: number | null
  thumb: Photo
  scheduleAt: string
  processing: 'queued' | 'processing' | 'ready' | 'failed' | ''
  processError: string
  posterUrl: string
  fileName: string
  published: boolean
  slug?: string | null
}


const input = 'w-full rounded-md border border-line bg-bg px-3 py-3 text-base'
const card = 'rounded-xl border border-line bg-bg p-4 shadow-sm'
const chip = 'min-h-11 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold hover:bg-surface'

const STATUS: Record<string, [string, string]> = {
  queued: ['⏳ कतार में', 'bg-slate-200 text-slate-800'],
  processing: ['⚙ लोगो लग रहा है…', 'bg-saffron-500 text-navy-950'],
  ready: ['✔ वीडियो तैयार (लोगो के साथ)', 'bg-india-600 text-white'],
  failed: ['⚠ प्रोसेसिंग नहीं हो पाई', 'bg-alert-600 text-white'],
}

/** Upload → (logo is added automatically in the background) → fill 6 fields → Publish/Schedule. */
export function VideoEditor({ initial, blob, categories, team, mayPublish }: { initial: VideoForm; blob: boolean; categories: CategoryOption[]; team: TeamOption[]; mayPublish: boolean }) {
  const [f, setF] = useState(initial)
  const [busy, start] = useTransition()
  const [pct, setPct] = useState<number | null>(null)
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [schedule, setSchedule] = useState(false)
  const pick = useRef<HTMLInputElement>(null)
  const set = <K extends keyof VideoForm>(k: K, v: VideoForm[K]) => setF((x) => ({ ...x, [k]: v }))

  // Poll while the server is still adding the logo (the editor can keep working meanwhile).
  useEffect(() => {
    if (!f.id || (f.processing !== 'queued' && f.processing !== 'processing')) return
    const t = setInterval(async () => {
      const r = await fetch(`/api/desk/video/status?ids=${f.id}`).then((x) => x.json()).catch(() => null)
      const v = r?.[0]
      if (v) setF((x) => ({ ...x, processing: v.processing, processError: v.processError || '', posterUrl: v.posterUrl || x.posterUrl }))
    }, 3000)
    return () => clearInterval(t)
  }, [f.id, f.processing])

  async function onFile(file?: File | null) {
    if (!file) return
    setNote(null)
    setPct(0)
    try {
      let url: string
      const pathname = `videos/original/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`
      if (blob) {
        const r = await upload(pathname, file, { access: 'public', handleUploadUrl: '/api/desk/video/upload', multipart: true, contentType: file.type || 'video/mp4', onUploadProgress: (p) => setPct(Math.round(p.percentage)) })
        url = r.url
      } else {
        // local development: stream to the dev server
        url = await new Promise<string>((res, rej) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', `/api/desk/video/local?name=${encodeURIComponent(file.name)}`)
          xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100))
          xhr.onload = () => (xhr.status === 200 ? res(JSON.parse(xhr.responseText).url) : rej(new Error(xhr.responseText || 'upload failed')))
          xhr.onerror = () => rej(new Error('नेटवर्क त्रुटि'))
          xhr.send(file)
        })
      }
      const s = await startVideoAction({ originalUrl: url, filename: file.name, size: file.size })
      setPct(null)
      if (!s.ok) return setNote({ kind: 'err', text: s.error })
      setF((x) => ({ ...x, id: s.id, processing: 'queued', fileName: file.name, title: x.title || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }))
      window.history.replaceState(null, '', `/desk/video/${s.id}`)
      setNote({ kind: 'ok', text: 'अपलोड पूरा ✔ — लोगो अपने-आप लग रहा है। तब तक नीचे जानकारी भरें।' })
    } catch (e) {
      setPct(null)
      setNote({ kind: 'err', text: (e as Error).message || 'अपलोड नहीं हो पाया' })
    }
  }

  function save(mode: 'draft' | 'publish' | 'schedule') {
    if (!f.id) return setNote({ kind: 'err', text: 'पहले वीडियो फ़ाइल चुनें' })
    setNote(null)
    start(async () => {
      const r = await saveVideoAction({
        id: f.id!,
        locale: 'hi',
        mode,
        title: f.title,
        description: f.description,
        location: f.location,
        eventDate: f.eventDate,
        reporterName: f.reporterName,
        reporterId: f.reporterId,
        categoryId: f.categoryId,
        thumbnailId: f.thumb.id,
        scheduleAt: mode === 'schedule' && f.scheduleAt ? new Date(`${f.scheduleAt}:00+05:30`).toISOString() : undefined,
      })
      if (!r.ok) return setNote({ kind: 'err', text: r.error })
      setF((x) => ({ ...x, published: x.published || r.status !== 'draft', slug: r.url }))
      setNote({ kind: 'ok', text: r.status === 'draft' ? 'ड्राफ्ट सेव ✔' : r.status === 'scheduled' ? 'शेड्यूल हो गया ⏰' : 'प्रकाशित हो गया 🎉' })
    })
  }

  const st = STATUS[f.processing]
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">🎬 {f.id ? 'वीडियो' : 'नया वीडियो'}</h1>
        {f.slug && f.published && <Link href={f.slug} target="_blank" className={chip}>देखें ↗</Link>}
      </div>
      {note && <p role="status" className={`rounded-md p-3 text-sm font-semibold ${note.kind === 'ok' ? 'bg-india-600/10 text-india-600' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}

      <section className={card}>
        <input ref={pick} type="file" accept="video/*" className="hidden" onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
        {f.id ? (
          <div className="space-y-2">
            <p className="font-semibold">📁 {f.fileName || 'अपलोड की गई फ़ाइल'}</p>
            {st && <p className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${st[1]}`}>{st[0]}</p>}
            {f.processing === 'failed' && (
              <div className="rounded-md bg-alert-600/10 p-3 text-sm">
                <p className="font-semibold text-alert-700">{f.processError || 'प्रोसेसिंग विफल'}</p>
                <p className="mt-1">वीडियो फिर भी प्रकाशित हो सकता है: साइट पर मूल वीडियो चलेगा और लोगो ऊपर से दिखेगा।</p>
                <button type="button" className={`${chip} mt-2`} onClick={async () => { await retryVideoAction(f.id!); set('processing', 'queued') }}>🔁 दोबारा कोशिश</button>
              </div>
            )}
            {(f.processing === 'queued' || f.processing === 'processing') && <p className="text-sm text-muted">आप इस बीच जानकारी भर सकते हैं या दूसरा काम कर सकते हैं; प्रोसेसिंग बैकग्राउंड में चलती है।</p>}
            <button type="button" className={chip} onClick={() => pick.current?.click()}>🔄 दूसरा वीडियो चुनें</button>
          </div>
        ) : (
          <button type="button" onClick={() => pick.current?.click()} disabled={pct !== null} className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-surface text-muted hover:bg-white">
            <span className="text-4xl">🎬</span>
            <span className="text-lg font-bold text-navy-900">{pct === null ? 'वीडियो चुनें / रिकॉर्ड करें' : `अपलोड हो रहा है… ${pct}%`}</span>
            {pct !== null && <span className="h-2 w-2/3 overflow-hidden rounded bg-line"><span className="block h-full bg-india-600 transition-all" style={{ width: `${pct}%` }} /></span>}
            <span className="text-xs">MP4 / MOV / WEBM · लोगो अपने-आप ऊपर दाएं कोने में लगेगा</span>
          </button>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        <label className="block text-sm font-semibold">शीर्षक *<input value={f.title} onChange={(e) => set('title', e.target.value)} className={`${input} mt-1 text-lg font-bold`} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">स्थान<input value={f.location} onChange={(e) => set('location', e.target.value)} className={`${input} mt-1`} /></label>
          <label className="block text-sm font-semibold">तारीख<input type="date" value={f.eventDate} onChange={(e) => set('eventDate', e.target.value)} className={`${input} mt-1`} /></label>
        </div>
        <label className="block text-sm font-semibold">संक्षिप्त विवरण<textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${input} mt-1`} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            संबंधित रिपोर्टर
            <input list="vteam" value={f.reporterName} onChange={(e) => { const m = team.find((t) => t.name === e.target.value); setF((x) => ({ ...x, reporterName: e.target.value, reporterId: m?.id ?? null })) }} className={`${input} mt-1`} />
            <datalist id="vteam">{team.map((t) => <option key={t.id} value={t.name} />)}</datalist>
          </label>
          <label className="block text-sm font-semibold">
            श्रेणी
            <select value={f.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)} className={`${input} mt-1`}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">थंबनेल (वैकल्पिक: खाली = वीडियो का एक फ्रेम)</p>
          <PhotoField photo={f.thumb} onChange={(p) => set('thumb', p)} alt={f.title} credit="" onCredit={() => {}} />
        </div>
        {mayPublish && (
          <div>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} /><span className="text-sm font-semibold">⏰ शेड्यूल करें</span></label>
            {schedule && <input type="datetime-local" value={f.scheduleAt} onChange={(e) => set('scheduleAt', e.target.value)} className={`${input} mt-2`} />}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !f.id} onClick={() => save('draft')} className="min-h-12 flex-1 rounded-lg border-2 border-navy-900 px-4 font-bold text-navy-900 disabled:opacity-60 sm:flex-none">💾 ड्राफ्ट</button>
        {mayPublish ? (
          schedule ? (
            <button type="button" disabled={busy || !f.id || !f.scheduleAt} onClick={() => save('schedule')} className="min-h-12 flex-[2] rounded-lg bg-gold-400 px-6 font-extrabold text-navy-950 disabled:opacity-60 sm:flex-none">⏰ शेड्यूल करें</button>
          ) : (
            <button type="button" disabled={busy || !f.id} onClick={() => save('publish')} className="min-h-12 flex-[2] rounded-lg bg-india-600 px-6 text-lg font-extrabold text-white disabled:opacity-60 sm:flex-none">{f.published ? '✔ अपडेट प्रकाशित करें' : '🚀 प्रकाशित करें'}</button>
          )
        ) : (
          <p className="self-center text-sm text-muted">प्रकाशन संपादक करेंगे: ड्राफ्ट सेव करें।</p>
        )}
      </div>
    </div>
  )
}
