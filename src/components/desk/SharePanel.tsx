/* eslint-disable @next/next/no-img-element */
'use client'

import { useMemo, useState, useTransition } from 'react'
import { retryShareAction, saveSocialAction, shareEpaperAction, shareNowAction } from '@/app/(desk)/desk/news/[id]/share/actions'
import { caption, openLink, type PlatformId, type ShareItem } from '@/lib/shareText'

type Row = { id: PlatformId; label: string; configured: boolean; enabled: boolean }
type Log = { id: number; platform: string; status: string; postUrl?: string | null; response?: string | null; at: string; auto?: boolean | null }

const chip = 'min-h-11 rounded-lg border border-line bg-bg px-3 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50'

/** Share preview + platform choice + manual fallback (Copy caption · Download media · Open platform) + log with retry. */
export function SharePanel({ articleId, epaperDate, item: initial, rows, logs, published, downloadHref }: { articleId?: number; epaperDate?: string; item: ShareItem; rows: Row[]; logs: Log[]; published: boolean; downloadHref: string }) {
  const [s, setS] = useState({ headline: initial.headline, description: initial.description, hashtags: initial.hashtags })
  const [pick, setPick] = useState<PlatformId[]>(rows.filter((r) => r.configured && r.enabled).map((r) => r.id))
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, start] = useTransition()
  const item = useMemo(() => ({ ...initial, ...s }), [initial, s])
  const copy = async (p: PlatformId) => {
    await navigator.clipboard?.writeText(caption(item, p)).catch(() => {})
    setNote({ ok: true, text: 'कैप्शन कॉपी हो गया — प्लेटफ़ॉर्म खोलकर पेस्ट करें।' })
  }
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border border-line bg-bg p-4">
        <h2 className="font-display text-lg font-bold">📱 सोशल मीडिया वर्ज़न (मास्टर खबर से बना — शेयर से पहले बदल सकते हैं)</h2>
        <label className="block text-sm font-semibold">
          छोटी हेडलाइन
          <input value={s.headline} maxLength={150} onChange={(e) => setS({ ...s, headline: e.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2.5" />
        </label>
        <label className="block text-sm font-semibold">
          छोटा विवरण
          <textarea value={s.description} rows={3} maxLength={500} onChange={(e) => setS({ ...s, description: e.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2.5" />
        </label>
        <label className="block text-sm font-semibold">
          हैशटैग
          <input value={s.hashtags} onChange={(e) => setS({ ...s, hashtags: e.target.value })} className="mt-1 w-full rounded-md border border-line px-3 py-2.5" />
        </label>
        <p className="text-xs text-muted">हर पोस्ट में वेबसाइट लिंक और News ID अपने-आप जुड़ते हैं, ताकि मूल खबर ही प्रमाण रहे।</p>
        {articleId && (
          <button type="button" disabled={busy} className={chip} onClick={() => start(async () => setNote((await saveSocialAction(articleId, s)).ok ? { ok: true, text: 'सेव ✔' } : { ok: false, text: 'सेव नहीं हुआ' }))}>
            💾 सोशल वर्ज़न सेव करें
          </button>
        )}
      </section>

      <section className="rounded-xl border border-line bg-bg p-4">
        <h2 className="mb-2 font-display text-lg font-bold">👁 शेयर प्रीव्यू</h2>
        <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-line shadow">
          {item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <img src="/og-default.jpg" alt="" className="aspect-[1.91/1] w-full object-cover" />}
          <div className="space-y-1 p-3 text-sm">
            <p className="font-bold">{item.headline}</p>
            <p className="whitespace-pre-line text-muted">{item.description}</p>
            <p className="text-link">{item.hashtags}</p>
            <p className="font-mono text-xs">News ID: {item.newsId || '—'}</p>
            <p className="truncate text-xs">{item.url}</p>
            {item.videoUrl && <p className="text-xs">🎬 सोशल वीडियो साथ जाएगा</p>}
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-line bg-bg p-4">
        <h2 className="font-display text-lg font-bold">📣 कहां शेयर करें</h2>
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
            {r.configured ? (
              <label className="flex min-h-11 flex-1 items-center gap-3 font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={pick.includes(r.id)} onChange={(e) => setPick((x) => (e.target.checked ? [...x, r.id] : x.filter((y) => y !== r.id)))} />
                {r.label} <span className="text-xs font-normal text-india-700">● जुड़ा हुआ (ऑटो पोस्ट)</span>
              </label>
            ) : (
              <span className="flex-1 font-semibold">
                {r.label} <span className="text-xs font-normal text-muted">{r.id === 'whatsapp' ? '(केवल लिंक से)' : '(खाता जुड़ा नहीं — हाथ से)'}</span>
              </span>
            )}
            {!r.configured && (
              <>
                <button type="button" className={chip} onClick={() => copy(r.id)}>
                  📋 कैप्शन कॉपी
                </button>
                <a className={chip} href={downloadHref}>
                  ⬇ मीडिया
                </a>
                <a className={chip} href={openLink(item, r.id)} target="_blank" rel="noopener noreferrer">
                  ↗ खोलें
                </a>
              </>
            )}
          </div>
        ))}
        <button
          type="button"
          disabled={busy || !published || pick.length === 0}
          onClick={() =>
            start(async () => {
              const r = epaperDate ? await shareEpaperAction(epaperDate, pick, s) : await shareNowAction(articleId!, pick, s)
              if (!r.ok) return setNote({ ok: false, text: r.error })
              const bad = r.results.filter((x) => !x.ok)
              setNote({ ok: bad.length === 0, text: bad.length ? `कुछ प्लेटफ़ॉर्म पर नहीं गया: ${bad.map((b) => `${b.platform} (${b.error})`).join('; ')} — नीचे दोबारा कोशिश करें। प्रकाशन पर असर नहीं।` : 'सभी चुने प्लेटफ़ॉर्म पर पोस्ट हो गया ✔' })
            })
          }
          className="mt-2 min-h-12 w-full rounded-lg bg-india-600 font-extrabold text-white disabled:opacity-50"
        >
          🚀 चुने प्लेटफ़ॉर्म पर अभी पोस्ट करें
        </button>
        {!published && <p className="text-xs text-muted">प्रकाशन (News ID) के बाद ही पोस्ट होगा।</p>}
      </section>
      {note && <p role="status" className={`rounded p-3 text-sm font-semibold ${note.ok ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}

      {logs.length > 0 && (
        <section className="rounded-xl border border-line bg-bg p-4">
          <h2 className="mb-2 font-display text-lg font-bold">🧾 शेयर लॉग</h2>
          <ul className="space-y-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${l.status === 'success' ? 'bg-india-600 text-white' : l.status === 'failed' ? 'bg-alert-600 text-white' : 'bg-slate-200'}`}>{l.status}</span>
                <span className="font-semibold">{l.platform}</span>
                {l.auto && <span className="text-xs text-muted">ऑटो</span>}
                <span className="text-xs text-muted">{l.at}</span>
                {l.postUrl && (
                  <a href={l.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-link underline">
                    पोस्ट देखें
                  </a>
                )}
                {l.status === 'failed' && (
                  <>
                    <span className="w-full text-xs text-alert-700">{l.response}</span>
                    <button type="button" disabled={busy} className={chip} onClick={() => start(async () => { const r = await retryShareAction(l.id); setNote(r.ok ? { ok: true, text: 'दोबारा कोशिश सफल ✔' } : { ok: false, text: r.error || 'फिर विफल' }) })}>
                      🔁 दोबारा कोशिश
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
