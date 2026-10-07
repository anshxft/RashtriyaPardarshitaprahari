/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { generateExportAction, retryVideoAction, saveVideoNewsAction, startVideoAction } from '@/app/(desk)/desk/video/actions'
import type { CategoryOption, TeamOption } from '@/lib/deskTypes'
import { publishChecklist } from '@/lib/newsStatus'
import { uploadVideo, type UploadMode } from '@/lib/resumableUpload'
import { flashTimes } from '@/lib/videoArgs'
import { PhotoField, type Photo } from './PhotoField'

type JobInfo = { status: string; error?: string | null }
export type VideoForm = {
  id?: number
  articleId?: number | null
  newsId?: string | null
  title: string
  flashScript: string
  description: string
  location: string
  reporterName: string
  reporterId: number | null
  categoryId: number | null
  thumb: Photo
  scheduleAt: string
  breaking: boolean
  flash: boolean
  voice: boolean
  repeat: boolean
  intervalSec: number
  voiceRate: number
  voiceVolume: number
  pauseMs: number
  vertical: boolean
  processing: 'queued' | 'processing' | 'ready' | 'failed' | ''
  processError: string
  posterUrl: string
  previewUrl: string
  fileName: string
  published: boolean
  status?: string
  slug?: string | null
  exports: { social?: boolean; vertical?: boolean; flash?: boolean }
  jobs: Record<string, JobInfo>
}

const input = 'w-full rounded-md border border-line bg-bg px-3 py-3 text-base'
const card = 'rounded-xl border border-line bg-bg p-4 shadow-sm'
const chip = 'min-h-11 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50'
const STATUS: Record<string, [string, string]> = {
  queued: ['⏳ कतार में', 'bg-slate-200 text-slate-800'],
  processing: ['⚙ प्रोसेसिंग: लोगो और थंबनेल…', 'bg-saffron-500 text-navy-950 animate-pulse motion-reduce:animate-none'],
  ready: ['✔ तैयार (लोगो के साथ)', 'bg-india-600 text-white'],
  failed: ['⚠ प्रोसेसिंग विफल', 'bg-alert-600 text-white'],
}
const JOB_HI: Record<string, string> = { queued: 'कतार में', running: 'बन रहा है…', done: 'तैयार', failed: 'विफल' }

/** Video news: upload → (logo + thumbnail in the background) → fields + approved Flash script → preview → publish. */
export function VideoEditor({ initial, uploadMode, categories, team, mayPublish, ttsNote }: { initial: VideoForm; uploadMode: UploadMode; categories: CategoryOption[]; team: TeamOption[]; mayPublish: boolean; ttsNote: string }) {
  const [f, setF] = useState(initial)
  const [busy, start] = useTransition()
  const [pct, setPct] = useState<number | null>(null)
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [schedule, setSchedule] = useState(false)
  const [confirm, setConfirm] = useState<null | 'publish' | 'schedule'>(null)
  const pick = useRef<HTMLInputElement>(null)
  const replacing = useRef(false)
  const set = <K extends keyof VideoForm>(k: K, v: VideoForm[K]) => setF((x) => ({ ...x, [k]: v }))
  const pending = ['queued', 'processing'].includes(f.processing) || Object.values(f.jobs).some((j) => j.status === 'queued' || j.status === 'running')

  // Poll while the background jobs run (the editor keeps working meanwhile).
  useEffect(() => {
    if (!f.id || !pending) return
    const t = setInterval(async () => {
      const r = await fetch(`/api/desk/video/status?ids=${f.id}`).then((x) => x.json()).catch(() => null)
      const v = r?.[0]
      if (v) setF((x) => ({ ...x, processing: v.processing, processError: v.processError || '', posterUrl: v.posterUrl || x.posterUrl, previewUrl: v.previewUrl || x.previewUrl, exports: v.exports, jobs: v.jobs }))
    }, 4000)
    return () => clearInterval(t)
  }, [f.id, pending])

  async function onFile(file?: File | null) {
    if (!file) return
    setNote(null)
    setPct(0)
    try {
      const stored = await uploadVideo(file, uploadMode, setPct)
      const s = await startVideoAction({ originalUrl: stored, filename: file.name, size: file.size, replaceId: replacing.current ? f.id : undefined })
      setPct(null)
      if (!s.ok) return setNote({ kind: 'err', text: s.error })
      setF((x) => ({ ...x, id: s.id, processing: 'queued', previewUrl: '', exports: {}, jobs: {}, fileName: file.name, title: x.title || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }))
      if (!replacing.current) window.history.replaceState(null, '', `/desk/video/${s.id}`)
      setNote({ kind: 'ok', text: replacing.current ? 'नया वीडियो लग गया ✔ पुराना संस्करण इतिहास में सुरक्षित है।' : 'अपलोड पूरा ✔ — लोगो और थंबनेल अपने-आप बन रहे हैं। तब तक जानकारी भरें।' })
      replacing.current = false
    } catch (e) {
      setPct(null)
      setNote({ kind: 'err', text: `${(e as Error).message || 'अपलोड नहीं हो पाया'} — वही फ़ाइल दोबारा चुनें, अपलोड वहीं से आगे चलेगा।` })
    }
  }

  function save(mode: 'draft' | 'submit' | 'publish' | 'schedule') {
    if (!f.id) return setNote({ kind: 'err', text: 'पहले वीडियो फ़ाइल चुनें' })
    setNote(null)
    start(async () => {
      const r = await saveVideoNewsAction({
        videoId: f.id!,
        mode,
        title: f.title,
        flashScript: f.flashScript,
        description: f.description,
        reporterName: f.reporterName,
        reporterId: f.reporterId,
        location: f.location,
        categoryId: f.categoryId,
        thumbnailId: f.thumb.id,
        scheduleAt: mode === 'schedule' && f.scheduleAt ? new Date(`${f.scheduleAt}:00+05:30`).toISOString() : undefined,
        breaking: f.breaking,
        flash: f.flash,
        voice: f.voice,
        repeat: f.repeat,
        intervalSec: f.intervalSec,
        voiceRate: f.voiceRate,
        voiceVolume: f.voiceVolume,
        pauseMs: f.pauseMs,
        vertical: f.vertical,
      })
      if (!r.ok) return setNote({ kind: 'err', text: r.error })
      const live = r.status === 'published' || r.status === 'scheduled'
      setF((x) => ({ ...x, articleId: r.articleId, newsId: r.newsId, slug: r.url, published: x.published || live, jobs: live ? { ...x.jobs, social: { status: 'queued' }, ...(x.flash || x.voice ? { flash: { status: 'queued' } } : {}) } : x.jobs }))
      setNote({ kind: 'ok', text: { draft: 'ड्राफ्ट सेव ✔', submitted: 'समीक्षा के लिए भेजी गई ✔', scheduled: 'शेड्यूल हो गई ⏰', published: `प्रकाशित हो गई 🎉 ${r.newsId ? `News ID: ${r.newsId}` : ''} — सोशल वीडियो बन रहा है` }[r.status] || 'सेव ✔' })
    })
  }

  const gen = (kind: 'social' | 'vertical' | 'flash') =>
    start(async () => {
      const r = await generateExportAction(f.id!, kind)
      if (!r.ok) return setNote({ kind: 'err', text: r.error })
      setF((x) => ({ ...x, jobs: { ...x.jobs, [kind]: { status: 'queued' } } }))
    })

  const st = STATUS[f.processing]
  const items = publishChecklist({ title: f.title, reporterName: f.reporterName, location: f.location, categoryId: f.categoryId, hasMedia: true, hasVideo: true, body: f.description, flashScript: f.flashScript })
  const ready = f.processing === 'ready'
  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">🎬 {f.id ? 'वीडियो खबर' : 'नई वीडियो खबर'}</h1>
        <div className="flex gap-2">
          {f.newsId && <span className="rounded-full bg-surface px-3 py-1 font-mono text-sm">{f.newsId}</span>}
          {f.slug && f.published && (
            <Link href={f.slug} target="_blank" className={chip}>
              देखें ↗
            </Link>
          )}
        </div>
      </div>
      {note && <p role="status" className={`rounded-md p-3 text-sm font-semibold ${note.kind === 'ok' ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}

      {/* 1 · file */}
      <section className={card}>
        <input ref={pick} type="file" accept="video/*" className="hidden" onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
        {pct !== null ? (
          <div className="space-y-2 py-4 text-center">
            <p className="text-lg font-bold">अपलोड हो रहा है… {pct}%</p>
            <span className="mx-auto block h-3 w-full overflow-hidden rounded bg-line">
              <span className="block h-full bg-india-600 transition-all" style={{ width: `${pct}%` }} />
            </span>
            <p className="text-xs text-muted">{uploadMode === 's3' ? 'नेटवर्क टूटे तो चिंता नहीं: वही फ़ाइल दोबारा चुनें, अपलोड वहीं से आगे चलेगा।' : 'अपलोड पूरा होने तक यह पेज खुला रखें।'}</p>
          </div>
        ) : f.id ? (
          <div className="space-y-2">
            <p className="font-semibold">📁 {f.fileName || 'अपलोड की गई फ़ाइल'}</p>
            {st && <p className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${st[1]}`}>{st[0]}</p>}
            {f.processing === 'failed' && (
              <div className="rounded-md bg-alert-600/10 p-3 text-sm">
                <p className="font-semibold text-alert-700">{f.processError || 'प्रोसेसिंग विफल'}</p>
                <button type="button" className={`${chip} mt-2`} onClick={async () => (await retryVideoAction(f.id!), set('processing', 'queued'))}>
                  🔁 दोबारा कोशिश
                </button>
              </div>
            )}
            {pending && <p className="text-sm text-muted">यह बैकग्राउंड में चल रहा है; आप जानकारी भरते रहें या दूसरा काम करें।</p>}
            <button type="button" className={chip} onClick={() => ((replacing.current = true), pick.current?.click())}>
              🔄 वीडियो बदलें (पुराना इतिहास में रहेगा)
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => pick.current?.click()} className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-surface text-muted hover:bg-white">
            <span className="text-4xl">🎬</span>
            <span className="text-lg font-bold text-navy-900">वीडियो चुनें / रिकॉर्ड करें</span>
            <span className="text-xs">मोबाइल या लैपटॉप से · लोगो अपने-आप ऊपर दाएं कोने में लगेगा · मूल फ़ाइल अलग सुरक्षित रहेगी</span>
          </button>
        )}
      </section>

      {/* 2 · fields (only the ones the spec asks for) */}
      <section className={`${card} space-y-3`}>
        <label className="block text-sm font-semibold">
          खबर का शीर्षक *<input value={f.title} onChange={(e) => set('title', e.target.value)} className={`${input} mt-1 text-lg font-bold`} />
        </label>
        <label className="block text-sm font-semibold">
          फ्लैश न्यूज़ (स्वीकृत स्क्रिप्ट) — यही पट्टी पर दिखेगी और यही आवाज़ पढ़ेगी
          <textarea value={f.flashScript} onChange={(e) => set('flashScript', e.target.value)} rows={3} maxLength={600} className={`${input} mt-1`} placeholder="छोटा, तथ्यात्मक वाक्य। सिस्टम इसमें कुछ नहीं जोड़ता।" />
          <span className="text-xs text-muted">{f.flashScript.length}/600</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            रिपोर्टर / संवाददाता *
            <input
              list="vteam"
              value={f.reporterName}
              onChange={(e) => {
                const m = team.find((t) => t.name === e.target.value)
                setF((x) => ({ ...x, reporterName: e.target.value, reporterId: m?.id ?? null }))
              }}
              className={`${input} mt-1`}
            />
            <datalist id="vteam">
              {team.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm font-semibold">
            स्थान (जिला / राज्य) *<input value={f.location} onChange={(e) => set('location', e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block text-sm font-semibold">
            श्रेणी *
            <select value={f.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)} className={`${input} mt-1`}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <p className="font-semibold">तारीख और समय</p>
            <p className="mt-2 text-muted">प्रकाशित करते समय अपने-आप (भारतीय समय)। आगे के लिए नीचे “शेड्यूल” चुनें।</p>
          </div>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-semibold">विस्तृत विवरण (वैकल्पिक)</summary>
          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={4} className={`${input} mt-2`} />
        </details>
        <div>
          <p className="mb-1 text-sm font-semibold">थंबनेल (खाली = वीडियो का एक फ्रेम अपने-आप)</p>
          {!f.thumb.id && f.posterUrl && <img src={f.posterUrl} alt="" className="mb-2 aspect-video w-48 rounded object-cover" />}
          <PhotoField photo={f.thumb} onChange={(p) => set('thumb', p)} alt={f.title} credit="" onCredit={() => {}} />
        </div>
      </section>

      {/* 3 · switches */}
      <section className={`${card} space-y-3`}>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['breaking', '🔴 ब्रेकिंग न्यूज़'],
              ['flash', '⚡ फ्लैश पट्टी'],
              ['voice', '🔊 महिला आवाज़'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 ${f[k] ? 'border-alert-600 bg-alert-600/5' : 'border-line'}`}>
              <input type="checkbox" className="h-5 w-5" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />
              <span className="font-semibold">
                {l} {f[k] ? 'ON' : 'OFF'}
              </span>
            </label>
          ))}
        </div>
        {(f.flash || f.voice || f.breaking) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="h-5 w-5" checked={f.repeat} onChange={(e) => set('repeat', e.target.checked)} />
              <span className="text-sm font-semibold">दोहराएं (Repeat)</span>
            </label>
            <label className="text-sm font-semibold">
              हर {f.intervalSec} सेकंड
              <input type="range" min={10} max={120} step={5} value={f.intervalSec} onChange={(e) => set('intervalSec', Number(e.target.value))} className="w-full" disabled={!f.repeat} />
            </label>
          </div>
        )}
        {f.voice && (
          <div className="grid gap-3 rounded-lg bg-surface p-3 sm:grid-cols-3">
            <label className="text-sm font-semibold">
              गति {f.voiceRate.toFixed(2)}×
              <input type="range" min={0.7} max={1.4} step={0.05} value={f.voiceRate} onChange={(e) => set('voiceRate', Number(e.target.value))} className="w-full" />
            </label>
            <label className="text-sm font-semibold">
              आवाज़ {f.voiceVolume}%
              <input type="range" min={10} max={100} step={5} value={f.voiceVolume} onChange={(e) => set('voiceVolume', Number(e.target.value))} className="w-full" />
            </label>
            <label className="text-sm font-semibold">
              वाक्यों के बीच ठहराव {f.pauseMs} ms
              <input type="range" min={0} max={1500} step={100} value={f.pauseMs} onChange={(e) => set('pauseMs', Number(e.target.value))} className="w-full" />
            </label>
            <p className="text-xs text-muted sm:col-span-3">
              {ttsNote} उच्चारण सुधार:{' '}
              <a href="/admin/collections/pronunciations" target="_blank" className="underline">
                उच्चारण शब्दकोश
              </a>{' '}
              (सिर्फ़ आवाज़ के लिए, खबर का पाठ नहीं बदलता)।
            </p>
          </div>
        )}
      </section>

      {/* 4 · one-screen preview: VIDEO → FLASH → VOICE */}
      {f.id && (
        <section className={card}>
          <h2 className="mb-2 font-display text-lg font-bold">👁 प्रीव्यू: वीडियो → फ्लैश → आवाज़</h2>
          {f.previewUrl ? (
            <FlashPreview src={f.previewUrl} poster={f.posterUrl} script={f.flashScript} on={f.flash || f.breaking} breaking={f.breaking} voice={f.voice} repeat={f.repeat} intervalSec={f.intervalSec} rate={f.voiceRate} volume={f.voiceVolume} pauseMs={f.pauseMs} articleId={f.articleId} />
          ) : (
            <p className="py-6 text-center text-sm text-muted">प्रोसेसिंग पूरी होते ही यहां प्रीव्यू दिखेगा।</p>
          )}
          <p className="mt-2 text-xs text-muted">जांचें: वीडियो, फ्लैश पाठ, आवाज़, नाम और स्थान सही हैं और पाठ व आवाज़ एक जैसे हैं। संपादक की स्वीकृति के बाद ही प्रकाशित करें।</p>
        </section>
      )}

      {/* 5 · exports (editor only) */}
      {f.id && f.articleId && (
        <section className={`${card} space-y-2`}>
          <h2 className="font-display text-lg font-bold">📦 सोशल वीडियो और डाउनलोड</h2>
          {(
            [
              ['social', 'सोशल वीडियो 1920×1080', true],
              ['vertical', 'वर्टिकल वीडियो 1080×1920', true],
              ['flash', 'फ्लैश + आवाज़ वाला फाइनल वीडियो', f.flash || f.voice],
            ] as const
          ).map(([k, l, show]) =>
            show ? (
              <div key={k} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
                <span className="min-w-0 flex-1 text-sm font-semibold">{l}</span>
                {f.jobs[k] && <span className={`text-xs text-muted ${f.jobs[k].status === 'running' || f.jobs[k].status === 'queued' ? 'animate-pulse motion-reduce:animate-none' : ''}`}>{JOB_HI[f.jobs[k].status] || f.jobs[k].status}</span>}
                {f.jobs[k]?.status === 'failed' && <span className="w-full text-xs text-alert-700">{f.jobs[k].error}</span>}
                {f.exports[k] && (
                  <a href={`/api/desk/download?video=${f.id}&kind=${k}`} className={chip}>
                    ⬇ डाउनलोड
                  </a>
                )}
                <button type="button" disabled={busy || !ready || !f.published} onClick={() => gen(k)} className={chip}>
                  {f.exports[k] ? '🔁 फिर बनाएं' : '⚙ बनाएं'}
                </button>
              </div>
            ) : null,
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <a href={`/api/desk/download?video=${f.id}&kind=original`} className={chip}>
              ⬇ मूल वीडियो
            </a>
            {ready && (
              <a href={`/api/desk/download?video=${f.id}&kind=published`} className={chip}>
                ⬇ प्रकाशित वीडियो
              </a>
            )}
            {f.posterUrl && (
              <a href={`/api/desk/download?video=${f.id}&kind=thumbnail`} className={chip}>
                ⬇ थंबनेल
              </a>
            )}
          </div>
          {!f.published && <p className="text-xs text-muted">सोशल वीडियो में News ID और प्रकाशन तिथि आती है, इसलिए ये प्रकाशन के बाद बनते हैं (अपने-आप)।</p>}
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={f.vertical} onChange={(e) => set('vertical', e.target.checked)} />
            प्रकाशन पर वर्टिकल (रील/शॉर्ट्स) वीडियो भी अपने-आप बनाएं
          </label>
        </section>
      )}

      {mayPublish && (
        <section className={card}>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-5 w-5" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
            <span className="text-sm font-semibold">⏰ शेड्यूल करें</span>
          </label>
          {schedule && <input type="datetime-local" value={f.scheduleAt} onChange={(e) => set('scheduleAt', e.target.value)} className={`${input} mt-2`} />}
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-line bg-bg/95 p-3 backdrop-blur md:sticky md:bottom-0 md:rounded-xl md:border">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
          <button type="button" disabled={busy || !f.id} onClick={() => save('draft')} className="min-h-12 flex-1 rounded-lg border-2 border-navy-900 px-4 font-bold text-navy-900 disabled:opacity-60 sm:flex-none">
            💾 ड्राफ्ट
          </button>
          {mayPublish ? (
            <button type="button" disabled={busy || !f.id || (schedule && !f.scheduleAt)} onClick={() => setConfirm(schedule ? 'schedule' : 'publish')} className="min-h-12 flex-[2] rounded-lg bg-india-600 px-6 text-lg font-extrabold text-white disabled:opacity-60 sm:flex-none">
              {schedule ? '⏰ शेड्यूल' : f.published ? '✔ अपडेट प्रकाशित करें' : '🚀 प्रकाशित करें'}
            </button>
          ) : (
            <button type="button" disabled={busy || !f.id} onClick={() => save('submit')} className="min-h-12 flex-[2] rounded-lg bg-saffron-500 px-6 font-extrabold text-navy-950 disabled:opacity-60 sm:flex-none">
              📤 समीक्षा के लिए भेजें
            </button>
          )}
        </div>
      </div>

      {confirm && (
        <div role="dialog" aria-modal className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setConfirm(null)}>
          <div className="anim-sheet max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 font-display text-lg font-bold">✅ प्रकाशन से पहले जांच</p>
            <ul className="space-y-1.5 text-sm">
              {[...items, { key: 'ready', label: 'वीडियो प्रोसेसिंग पूरी', ok: ready, required: true, note: undefined }, ...((f.flash || f.voice) ? [{ key: 'script', label: 'फ्लैश स्क्रिप्ट', ok: Boolean(f.flashScript.trim()), required: true, note: undefined }] : [])].map((i) => (
                <li key={i.key} className="flex gap-2">
                  <span className={i.ok ? 'text-india-600' : i.required ? 'text-alert-600' : 'text-saffron-600'}>{i.ok ? '✔' : i.required ? '✘' : '⚠'}</span>
                  <span>{i.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-semibold">क्या आप इस समाचार को आधिकारिक रूप से प्रकाशित करना चाहते हैं?</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirm(null)} className="min-h-12 rounded-lg border border-line font-bold">
                Cancel
              </button>
              <button
                type="button"
                disabled={!ready || items.some((i) => i.required && !i.ok) || ((f.flash || f.voice) && !f.flashScript.trim())}
                onClick={() => {
                  const m = confirm
                  setConfirm(null)
                  save(m)
                }}
                className="min-h-12 rounded-lg bg-india-600 font-extrabold text-white disabled:opacity-50"
              >
                {confirm === 'schedule' ? 'Schedule' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** One screen: the video plays, the red strip appears at the chosen times, and the voice reads the same script. */
function FlashPreview(p: { src: string; poster?: string; script: string; on: boolean; breaking: boolean; voice: boolean; repeat: boolean; intervalSec: number; rate: number; volume: number; pauseMs: number; articleId?: number | null }) {
  const video = useRef<HTMLVideoElement>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const [show, setShow] = useState(false)
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
  const [voiceNote, setVoiceNote] = useState('')
  const shown = useRef(-1)
  const times = useRef<number[]>([])
  const showSec = 7

  async function loadVoice() {
    setVoiceNote('आवाज़ बन रही है…')
    const r = await fetch('/api/desk/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ articleId: p.articleId, script: p.script, rate: p.rate, volume: p.volume, pauseMs: p.pauseMs }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.url) {
      setVoiceUrl(j.url)
      setVoiceNote('')
      return j.url as string
    }
    setVoiceNote(r.status === 501 ? 'आवाज़ सेवा (TTS) अभी जुड़ी नहीं है — प्रीव्यू में फ़ोन/ब्राउज़र की हिंदी आवाज़ है; फाइनल वीडियो के लिए TTS सेटअप ज़रूरी।' : `आवाज़ नहीं बनी: ${j.error || r.status}`)
    return null
  }
  function speak(url: string | null = voiceUrl) {
    if (url && audio.current) {
      if (audio.current.src !== url) audio.current.src = url
      audio.current.volume = p.volume / 100
      audio.current.currentTime = 0
      void audio.current.play()
      return
    }
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(p.script)
      u.lang = 'hi-IN'
      u.rate = p.rate
      u.volume = p.volume / 100
      const v = speechSynthesis.getVoices().find((x) => x.lang === 'hi-IN' && /female|lekha|swara|kalpana/i.test(x.name)) || speechSynthesis.getVoices().find((x) => x.lang === 'hi-IN')
      if (v) u.voice = v
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
    }
  }
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={video}
          src={p.src}
          poster={p.poster}
          controls
          playsInline
          className="aspect-video w-full"
          onLoadedMetadata={(e) => (times.current = flashTimes(e.currentTarget.duration || 0, showSec, p.repeat, p.intervalSec))}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime
            const i = times.current.findIndex((s) => t >= s && t < s + showSec)
            setShow(p.on && i >= 0)
            if (i >= 0 && i !== shown.current) {
              shown.current = i
              if (p.voice && p.script.trim()) speak()
            }
            if (i < 0) shown.current = -1
          }}
          onPause={() => (audio.current?.pause(), 'speechSynthesis' in window && speechSynthesis.cancel())}
        />
        {show && p.script.trim() && (
          <div className="anim-strip pointer-events-none absolute inset-x-0 bottom-10 flex items-center gap-2 bg-[#c8102e]/95 px-3 py-2 text-sm font-bold text-white sm:text-base">
            <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-xs text-[#c8102e]">● {p.breaking ? 'BREAKING NEWS' : 'FLASH NEWS'}</span>
            <span>{p.script}</span>
          </div>
        )}
        <audio ref={audio} src={voiceUrl || undefined} preload="auto" />
      </div>
      {p.voice && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={chip} disabled={!p.script.trim()} onClick={async () => speak(await loadVoice())}>
            🔊 आवाज़ सुनें
          </button>
          {voiceNote && <span className="text-xs text-muted">{voiceNote}</span>}
        </div>
      )}
    </div>
  )
}
