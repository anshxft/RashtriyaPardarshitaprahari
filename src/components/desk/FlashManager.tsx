/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { moveFlashAction, saveFlashAction, setFlashStatusAction, type FlashInput } from '@/app/(desk)/desk/breaking/actions'
import { startVideoAction } from '@/app/(desk)/desk/video/actions'
import { FLASH_DURATIONS, type FlashStatus } from '@/collections/BreakingNews'
import { FlashCard } from '@/components/FlashBox'
import type { FlashItem } from '@/lib/flash'
import { uploadVideo, type UploadMode } from '@/lib/resumableUpload'
import { PhotoField, type Photo } from './PhotoField'

export type FlashRow = {
  id: number
  text: string
  status: FlashStatus
  priority: number
  caption: string
  photo: Photo
  videoId: number | null
  videoTitle: string
  showMedia: FlashInput['showMedia']
  articleId: number | null
  reporterName: string
  showReporter: boolean
  duration: string
  publishedAt: string | null
  updatedAt: string
  expiresAt: string | null
  mine: boolean
  byName: string
}
type Form = Omit<FlashRow, 'priority' | 'updatedAt' | 'expiresAt' | 'mine' | 'byName' | 'videoTitle' | 'publishedAt' | 'status' | 'id'> & { id?: number; status?: FlashStatus }

const input = 'w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base'
const chip = 'rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50'
const empty = (): Form => ({ text: '', caption: '', photo: { id: null, url: null }, videoId: null, showMedia: 'auto', articleId: null, reporterName: '', showReporter: false, duration: '6h' })

const STATUS_CHIP: Record<string, string> = {
  draft: 'bg-surface text-muted',
  active: 'bg-alert-600 text-white',
  paused: 'bg-gold-300 text-navy-950',
  removed: 'bg-navy-100 text-navy-800',
  expired: 'bg-navy-100 text-navy-800',
}
const STATUS_LABEL: Record<string, string> = { draft: 'ड्राफ्ट', active: 'फ्लैश चालू', paused: 'फ्लैश रुका', removed: 'फ्लैश से हटाया', expired: 'समय पूरा' }

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) : '—'
const expired = (r: FlashRow) => r.status === 'active' && Boolean(r.expiresAt) && new Date(r.expiresAt!) <= new Date()
const shownStatus = (r: FlashRow) => (expired(r) ? 'expired' : r.status)

/**
 * Breaking Flash desk. Write (photo / video + 1–3 short lines) → live preview (exactly as readers will see it) → publish.
 * Running flashes can be edited in place (no duplicate), paused, resumed, re-ordered or removed from the flash.
 */
export function FlashManager({ rows, stories, videos, mayFlash, uploadMode }: { rows: FlashRow[]; stories: { id: number; title: string }[]; videos: { id: number; title: string }[]; mayFlash: boolean; uploadMode: UploadMode }) {
  const router = useRouter()
  const [form, setForm] = useState<Form | null>(null)
  const [tab, setTab] = useState<'active' | 'paused' | 'draft' | 'archive'>('active')
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, start] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const r = await fn()
      setNote(r.ok ? (ok ? { ok: true, text: ok } : null) : { ok: false, text: r.error || 'त्रुटि' })
      if (r.ok) router.refresh()
    })

  const groups = {
    active: rows.filter((r) => r.status === 'active' && !expired(r)),
    paused: rows.filter((r) => r.status === 'paused'),
    draft: rows.filter((r) => r.status === 'draft'),
    archive: rows.filter((r) => r.status === 'removed' || expired(r)).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
  }
  const TABS = [
    ['active', 'चालू'],
    ['paused', 'रुके हुए'],
    ['draft', 'ड्राफ्ट'],
    ['archive', 'आर्काइव'],
  ] as const

  const edit = (r: FlashRow) => (setNote(null), setForm({ ...r }), window.scrollTo({ top: 0, behavior: 'smooth' }))

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">ब्रेकिंग फ्लैश</h1>
        {!form && (
          <button type="button" onClick={() => (setNote(null), setForm(empty()))} className="min-h-11 rounded-lg bg-alert-600 px-5 font-bold text-white hover:bg-alert-700">
            + नया ब्रेकिंग फ्लैश
          </button>
        )}
      </div>
      {note && <p className={`rounded-md p-3 text-sm font-semibold ${note.ok ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}

      {form && (
        <FlashForm
          key={form.id ?? 'new'}
          initial={form}
          stories={stories}
          videos={videos}
          mayFlash={mayFlash}
          uploadMode={uploadMode}
          busy={busy}
          onCancel={() => setForm(null)}
          onSave={(f, status) =>
            run(async () => {
              const r = await saveFlashAction({ ...f, photoId: f.photo.id, status })
              if (r.ok) setForm(null)
              return r
            }, status === 'active' ? 'फ्लैश वेबसाइट पर चल गया ✔' : f.id ? 'बदलाव सेव ✔ वेबसाइट पर अपने-आप दिखेगा' : 'ड्राफ्ट सेव ✔')
          }
        />
      )}

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`${chip} ${tab === k ? 'border-navy-900 bg-navy-900 text-white hover:bg-navy-900' : ''}`}>
            {label} ({groups[k].length})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {groups[tab].length === 0 && <li className="rounded-xl border border-dashed border-line p-6 text-center text-muted">यहाँ कुछ नहीं है।</li>}
        {groups[tab].map((r, n) => (
          <li key={r.id} className="rounded-xl border border-line bg-bg p-4">
            <div className="flex gap-3">
              {r.photo.url && <img src={r.photo.url} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded px-2 py-0.5 font-bold ${STATUS_CHIP[shownStatus(r)]}`}>{STATUS_LABEL[shownStatus(r)]}</span>
                  {r.videoId && <span className="rounded bg-surface px-2 py-0.5 font-semibold">वीडियो</span>}
                  {r.byName && <span className="text-muted">भेजा: {r.byName}</span>}
                </p>
                <p className="mt-1 font-semibold whitespace-pre-line">{r.text}</p>
                <p className="mt-1 text-xs text-muted">
                  Published: {when(r.publishedAt)} · Last Updated: {when(r.updatedAt)}
                  {r.status === 'active' && ` · बंद होगा: ${r.expiresAt ? when(r.expiresAt) : 'हटाने पर'}`}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(mayFlash || (r.mine && r.status === 'draft')) && (
                <button type="button" className={chip} disabled={busy} onClick={() => edit(r)}>
                  {mayFlash && r.status === 'draft' ? 'Preview → प्रकाशित करें' : 'बदलें / Edit'}
                </button>
              )}
              {mayFlash && tab === 'active' && (
                <>
                  <button type="button" className={chip} disabled={busy || n === 0} onClick={() => run(() => moveFlashAction(r.id, 'top'))}>
                    सबसे ऊपर
                  </button>
                  <button type="button" className={chip} disabled={busy || n === 0} onClick={() => run(() => moveFlashAction(r.id, 'up'))} aria-label="ऊपर">
                    ↑
                  </button>
                  <button type="button" className={chip} disabled={busy || n === groups.active.length - 1} onClick={() => run(() => moveFlashAction(r.id, 'down'))} aria-label="नीचे">
                    ↓
                  </button>
                  <button type="button" className={chip} disabled={busy} onClick={() => run(() => setFlashStatusAction(r.id, 'paused'), 'फ्लैश रोका गया')}>
                    रोकें / Pause
                  </button>
                </>
              )}
              {mayFlash && (tab === 'paused' || tab === 'archive') && (
                <button type="button" className={chip} disabled={busy} onClick={() => run(() => setFlashStatusAction(r.id, 'active'), 'फ्लैश फिर से चालू ✔')}>
                  फिर चलाएँ / Resume
                </button>
              )}
              {mayFlash && r.status !== 'removed' && r.status !== 'draft' && (
                <button
                  type="button"
                  className={`${chip} text-alert-700`}
                  disabled={busy}
                  onClick={() => confirm('यह खबर केवल फ्लैश से हटेगी — पूरी खबर वेबसाइट पर बनी रहेगी। हटाएँ?') && run(() => setFlashStatusAction(r.id, 'removed'), 'फ्लैश से हटाया गया')}
                >
                  फ्लैश से हटाएँ
                </button>
              )}
              {mayFlash && (
                <a href={`/admin/collections/breaking-news/${r.id}/versions`} target="_blank" rel="noreferrer" className={chip}>
                  बदलाव इतिहास
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        फ्लैश वेबसाइट के होम पेज पर सबसे ऊपर और हर पेज की लाल पट्टी में दिखता है। पाठकों का पेज हर मिनट अपने-आप नई सूची ले लेता है।{' '}
        <Link href="/hi" target="_blank" className="text-link underline">
          वेबसाइट देखें ↗
        </Link>
      </p>
    </div>
  )
}

function FlashForm({
  initial,
  stories,
  videos,
  mayFlash,
  uploadMode,
  busy,
  onCancel,
  onSave,
}: {
  initial: Form
  stories: { id: number; title: string }[]
  videos: { id: number; title: string }[]
  mayFlash: boolean
  uploadMode: UploadMode
  busy: boolean
  onCancel: () => void
  onSave: (f: Form, status?: 'active' | 'draft') => void
}) {
  const [f, setF] = useState<Form>(initial)
  const [credit, setCredit] = useState('')
  const [pct, setPct] = useState<number | null>(null)
  const [videoNote, setVideoNote] = useState('')
  const [ready, setReady] = useState(true)
  const pick = useRef<HTMLInputElement>(null)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const lines = f.text.split('\n').filter((l) => l.trim())
  const live = initial.status === 'active'
  const kept = initial.status === 'paused' || initial.status === 'removed'

  // While a just-uploaded video is being compressed (logo + thumbnail), check every few seconds.
  useEffect(() => {
    if (!f.videoId) return
    let stop = false
    const check = async () => {
      const r = (await fetch(`/api/desk/video/status?ids=${f.videoId}`).then((x) => x.json()).catch(() => null)) as { processing: string; processError: string }[] | null
      const s = r?.[0]
      if (stop || !s) return
      setReady(s.processing === 'done')
      setVideoNote(s.processing === 'done' ? '' : s.processing === 'error' ? `वीडियो प्रोसेस नहीं हुआ: ${s.processError}` : 'वीडियो छोटा (compress) किया जा रहा है, थंबनेल बन रहा है…')
      if (s.processing !== 'done' && s.processing !== 'error') setTimeout(check, 5000)
    }
    check()
    return () => {
      stop = true
    }
  }, [f.videoId])

  async function onVideo(file?: File) {
    if (!file) return
    if (!file.type.startsWith('video/')) return setVideoNote('केवल वीडियो फ़ाइल चुनें (MP4 / MOV)')
    setVideoNote('')
    setPct(0)
    try {
      const stored = await uploadVideo(file, uploadMode, setPct)
      const s = await startVideoAction({ originalUrl: stored, filename: file.name, size: file.size })
      setPct(null)
      if (!s.ok) return setVideoNote(s.error)
      set('videoId', s.id)
    } catch (e) {
      setPct(null)
      setVideoNote(`${(e as Error).message || 'अपलोड नहीं हो पाया'} — वही फ़ाइल दोबारा चुनें`)
    }
  }

  // Same media rules as the website (lib/flash.ts → toFlashItem), with desk-only video links.
  const hasVideo = Boolean(f.videoId) && f.showMedia !== 'photo'
  const hasPhoto = Boolean(f.photo.url) && (f.showMedia === 'photo' || f.showMedia === 'both' || (f.showMedia === 'auto' && !f.videoId))
  const preview: FlashItem = {
    id: f.id ?? 0,
    lines: lines.length ? lines.slice(0, 3) : ['यहाँ आपकी पहली पंक्ति दिखेगी'],
    caption: f.caption || undefined,
    photo: hasPhoto ? { src: f.photo.url!, alt: '' } : undefined,
    video: hasVideo ? { poster: !hasPhoto && f.photo.url ? f.photo.url : `/api/v/${f.videoId}/poster`, play: `/api/v/${f.videoId}/play` } : undefined,
    href: f.articleId ? '#' : undefined,
    reporter: f.showReporter && f.reporterName ? f.reporterName : undefined,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return (
    <section className="space-y-4 rounded-xl border-2 border-alert-600/40 bg-bg p-4">
      <p className="font-display text-lg font-bold">
        {f.id ? 'फ्लैश बदलें' : 'नया ब्रेकिंग फ्लैश'}
        {live && <span className="ml-2 text-sm text-alert-700">(वेबसाइट पर चल रहा है — सेव होते ही बदल जाएगा)</span>}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold">फोटो (वैकल्पिक)</p>
          <PhotoField photo={f.photo} onChange={(p) => set('photo', p)} alt={lines[0] || 'ब्रेकिंग फोटो'} credit={credit} onCredit={setCredit} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">वीडियो (वैकल्पिक)</p>
          {f.videoId ? (
            <div className="space-y-2 rounded-lg border border-line p-3 text-sm">
              <p className="font-semibold">वीडियो जुड़ा है ✓ {videos.find((v) => v.id === f.videoId)?.title || ''}</p>
              {videoNote && <p className="text-muted">{videoNote}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={chip} onClick={() => pick.current?.click()}>
                  दूसरा वीडियो
                </button>
                <button type="button" className={`${chip} text-alert-700`} onClick={() => (set('videoId', null), setVideoNote(''))}>
                  वीडियो हटाएँ
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button type="button" onClick={() => pick.current?.click()} disabled={pct !== null} className="flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line bg-bg text-muted hover:bg-surface">
                <span className="font-semibold">{pct !== null ? `अपलोड हो रहा है… ${pct}%` : 'वीडियो अपलोड करें'}</span>
                <span className="text-xs">बड़ी फ़ाइल अपने-आप छोटी (compress) होगी, थंबनेल अपने-आप बनेगा</span>
              </button>
              {videos.length > 0 && (
                <select value="" onChange={(e) => e.target.value && set('videoId', Number(e.target.value))} className={input}>
                  <option value="">या पहले से अपलोड वीडियो चुनें…</option>
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title.slice(0, 70)}
                    </option>
                  ))}
                </select>
              )}
              {videoNote && <p className="text-sm font-semibold text-alert-700">{videoNote}</p>}
            </div>
          )}
          <input ref={pick} type="file" accept="video/*" className="hidden" onChange={(e) => (onVideo(e.target.files?.[0]), (e.target.value = ''))} />
          {f.videoId && f.photo.url && (
            <label className="block text-sm font-semibold">
              क्या दिखाएँ
              <select value={f.showMedia} onChange={(e) => set('showMedia', e.target.value as Form['showMedia'])} className={`${input} mt-1`}>
                <option value="auto">वीडियो (फोटो उसका थंबनेल बनेगी)</option>
                <option value="both">फोटो और वीडियो दोनों</option>
                <option value="photo">केवल फोटो</option>
                <option value="video">केवल वीडियो (फोटो थंबनेल बनेगी)</option>
              </select>
            </label>
          )}
        </div>
      </div>

      <label className="block text-sm font-semibold">
        संक्षिप्त विवरण — 1 से 3 छोटी पंक्तियाँ (हर पंक्ति Enter दबाकर नई लाइन में)
        <textarea value={f.text} onChange={(e) => set('text', e.target.value)} rows={3} maxLength={300} className={`${input} mt-1 text-lg leading-snug`} placeholder={'रांची के रातू थाना क्षेत्र का मामला\nपहली मुख्य बात…\nस्थानीय थाना में दर्ज हुआ मामला'} />
        <span className={`text-xs ${lines.length > 3 ? 'text-alert-700' : 'text-muted'}`}>
          {lines.length}/3 पंक्तियाँ · {f.text.length}/300 अक्षर{lines.length > 3 ? ' — केवल पहली 3 पंक्तियाँ दिखेंगी' : ''}
        </span>
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          कैप्शन (वैकल्पिक)
          <input value={f.caption} onChange={(e) => set('caption', e.target.value)} maxLength={160} className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-semibold">
          पूरी खबर से जोड़ें (वैकल्पिक)
          <select value={f.articleId ?? ''} onChange={(e) => set('articleId', e.target.value ? Number(e.target.value) : null)} className={`${input} mt-1`}>
            <option value="">— अभी कोई पूरी खबर नहीं —</option>
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title.slice(0, 70)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          संवाददाता / स्रोत
          <input value={f.reporterName} onChange={(e) => set('reporterName', e.target.value)} maxLength={120} className={`${input} mt-1`} />
          <span className="mt-1 flex items-center gap-2 font-normal">
            <input type="checkbox" checked={f.showReporter} onChange={(e) => set('showReporter', e.target.checked)} className="h-5 w-5" /> पाठकों को नाम दिखाएँ
          </span>
        </label>
        <label className="block text-sm font-semibold">
          फ्लैश कब तक चले
          <select value={f.duration} onChange={(e) => set('duration', e.target.value)} className={`${input} mt-1`}>
            {FLASH_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-muted">समय पूरा होने पर फ्लैश अपने-आप बंद; पूरी खबर वेबसाइट पर रहेगी</span>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Preview — वेबसाइट पर ऐसा दिखेगा</p>
        <div className="rounded-lg border border-line border-l-4 border-l-alert-600 bg-bg p-3 md:p-4">
          <FlashCard item={preview} lang="hi" onPlay={(src) => window.open(src, '_blank')} />
        </div>
        {f.videoId && !ready && <p className="mt-1 text-xs text-muted">वीडियो तैयार होते ही थंबनेल दिखेगा। अभी प्रकाशित कर सकते हैं — पाठकों को वीडियो तैयार होते ही दिखने लगेगा।</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCancel} disabled={busy} className="min-h-12 rounded-lg border border-line px-5 font-semibold">
          रद्द करें
        </button>
        {live ? (
          <button type="button" disabled={busy || !lines.length} onClick={() => onSave(f)} className="min-h-12 flex-1 rounded-lg bg-alert-600 px-6 text-lg font-extrabold text-white disabled:opacity-60">
            अपडेट करें (तुरंत वेबसाइट पर)
          </button>
        ) : (
          <>
            {/* A paused / removed flash keeps its status on save; only new flashes and drafts are saved as drafts. */}
            <button type="button" disabled={busy || !lines.length} onClick={() => onSave(f, kept ? undefined : 'draft')} className="min-h-12 flex-1 rounded-lg border-2 border-navy-900 px-5 font-bold disabled:opacity-60">
              {kept ? 'सेव करें' : mayFlash ? 'ड्राफ्ट सेव' : 'संपादक को भेजें (ड्राफ्ट)'}
            </button>
            {mayFlash && (
              <button
                type="button"
                disabled={busy || !lines.length || pct !== null}
                onClick={() => confirm('ऊपर Preview देख लिया? यह फ्लैश अभी वेबसाइट पर चल जाएगा।') && onSave(f, 'active')}
                className="min-h-12 flex-[2] rounded-lg bg-alert-600 px-6 text-lg font-extrabold text-white disabled:opacity-60"
              >
                ब्रेकिंग फ्लैश में प्रकाशित करें
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
