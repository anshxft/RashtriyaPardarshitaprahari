/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { fetchLinkMetaAction, saveNewsAction } from '@/app/(desk)/desk/actions'
import type { CategoryOption, SaveResult } from '@/lib/deskTypes'

const input = 'w-full rounded-md border border-line bg-bg px-3 py-3 text-base'
const card = 'rounded-xl border border-line bg-bg p-4 shadow-sm'
const chip = 'min-h-11 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold hover:bg-surface'

/** Paste Link → Auto Fetch → Quick Edit → Preview → Publish. */
export function LinkEditor({ categories, defaultCategory, mayPublish }: { categories: CategoryOption[]; defaultCategory: number | null; mayPublish: boolean }) {
  const [url, setUrl] = useState('')
  const [siteName, setSiteName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(defaultCategory)
  const [columns, setColumns] = useState(1)
  const [busy, start] = useTransition()
  const [fetching, setFetching] = useState(false)
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [done, setDone] = useState<Extract<SaveResult, { ok: true }> | null>(null)

  async function getMeta() {
    setFetching(true)
    setNote(null)
    const r = await fetchLinkMetaAction(url)
    setFetching(false)
    if (!r.ok) return setNote({ kind: 'err', text: r.error })
    setUrl(r.meta.url)
    setTitle(r.meta.title || '')
    setSiteName(r.meta.siteName || '')
    setDescription(r.meta.description || '')
    setImageUrl(r.meta.imageUrl || '')
    setNote({ kind: 'ok', text: r.meta.title ? 'जानकारी मिल गई — ज़रूरत हो तो बदलें' : 'पेज मिला पर शीर्षक नहीं — हाथ से भरें' })
  }

  function save(mode: 'draft' | 'submit' | 'publish') {
    start(async () => {
      const r = await saveNewsAction({
        locale: 'hi',
        mode,
        format: 'link',
        title,
        categoryId,
        paragraphs: [],
        excerpt: description,
        layout: { template: '6', columns, autoFit: true, inEpaper: true },
        linkCard: { url, siteName, description, imageUrl },
      })
      if (!r.ok) return setNote({ kind: 'err', text: r.error })
      if (r.status === 'published') setDone(r)
      else setNote({ kind: 'ok', text: mode === 'submit' ? 'समीक्षा के लिए भेज दिया ✔' : 'ड्राफ्ट सेव ✔' })
    })
  }

  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold text-navy-900">🔗 लिंक आधारित न्यूज़ (संबंधित न्यूज़ पोर्टल)</h1>
      {done && (
        <section role="status" className="rounded-xl border-2 border-india-600 bg-india-600/10 p-4">
          <p className="text-lg font-extrabold text-india-600">🎉 प्रकाशित हो गया</p>
          <p className="mt-1">News ID: <b className="font-mono">{done.newsId}</b></p>
          <div className="mt-2 flex gap-2 text-sm">
            <Link href="/hi/section/sambandhit-portal" target="_blank" className="rounded-full bg-navy-900 px-4 py-2 font-bold text-white">सेक्शन में देखें ↗</Link>
            <button type="button" className={chip} onClick={() => (setDone(null), setUrl(''), setTitle(''), setSiteName(''), setDescription(''), setImageUrl(''))}>+ एक और</button>
          </div>
        </section>
      )}
      {note && <p role="status" className={`rounded-md p-3 text-sm font-semibold ${note.kind === 'ok' ? 'bg-india-600/10 text-india-600' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}

      <section className={`${card} space-y-3`}>
        <label className="block text-sm font-semibold">
          1 · दूसरे पोर्टल की खबर का लिंक पेस्ट करें
          <div className="mt-1 flex gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} onPaste={(e) => { const t = e.clipboardData.getData('text').trim(); if (/^https?:\/\//.test(t)) setTimeout(getMeta, 50) }} inputMode="url" placeholder="https://…" className={input} />
            <button type="button" onClick={getMeta} disabled={!url || fetching} className="min-h-12 shrink-0 rounded-lg bg-navy-900 px-5 font-bold text-white disabled:opacity-60">
              {fetching ? '…' : '⬇ लाएं'}
            </button>
          </div>
        </label>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className="font-display text-lg font-bold text-navy-900">2 · जल्दी से बदलें</h2>
        <label className="block text-sm font-semibold">
          पोर्टल का नाम
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-semibold">
          हेडलाइन *
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${input} mt-1 text-lg font-bold`} />
        </label>
        <label className="block text-sm font-semibold">
          छोटा विवरण
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-semibold">
          फोटो का लिंक (खाली = केवल टेक्स्ट कार्ड)
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={`${input} mt-1`} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            श्रेणी *
            <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)} className={`${input} mt-1`}>
              <option value="">— चुनें —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <div>
            <p className="text-sm font-semibold">ई-पेपर में कॉलम</p>
            <div className="mt-1 flex gap-2">
              {[1, 2].map((n) => <button key={n} type="button" onClick={() => setColumns(n)} className={`${chip} flex-1 ${columns === n ? '!bg-navy-900 !text-white' : ''}`}>{n}</button>)}
            </div>
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-display text-lg font-bold text-navy-900">3 · प्रीव्यू</h2>
        <article className="rounded-lg border border-dashed border-navy-700/50 bg-surface p-3">
          <p className="mb-2 inline-block rounded bg-navy-100 px-2 py-0.5 text-xs font-bold text-navy-900">बाहरी लिंक{siteName ? ` · ${siteName}` : ''}</p>
          <div className="flex gap-3">
            {imageUrl && <img src={imageUrl} alt="" className="h-24 w-32 shrink-0 rounded object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            <div className="min-w-0">
              <h3 className="font-display text-lg leading-snug font-bold">{title || 'हेडलाइन यहाँ दिखेगी'} ↗</h3>
              {description && <p className="mt-1 line-clamp-3 text-sm text-muted">{description}</p>}
              <p className="mt-1 text-xs font-semibold text-link">{host || 'लिंक'} · संबंधित न्यूज़ पोर्टल देखें →</p>
            </div>
          </div>
        </article>
        <p className="mt-2 text-xs text-muted">यह साफ़ तौर पर “बाहरी लिंक” चिह्नित रहता है, ताकि पाठक इसे हमारी मौलिक रिपोर्टिंग न समझें। क्लिक करने पर दूसरी साइट नए टैब में खुलती है।</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !title || !url} onClick={() => save('draft')} className="min-h-12 flex-1 rounded-lg border-2 border-navy-900 px-4 font-bold text-navy-900 disabled:opacity-60 sm:flex-none">💾 ड्राफ्ट</button>
        {mayPublish ? (
          <button type="button" disabled={busy || !title || !url || !categoryId} onClick={() => save('publish')} className="min-h-12 flex-[2] rounded-lg bg-india-600 px-6 text-lg font-extrabold text-white disabled:opacity-60 sm:flex-none">🚀 प्रकाशित करें</button>
        ) : (
          <button type="button" disabled={busy || !title || !url || !categoryId} onClick={() => save('submit')} className="min-h-12 flex-[2] rounded-lg bg-saffron-500 px-6 text-lg font-extrabold text-navy-950 disabled:opacity-60 sm:flex-none">📤 समीक्षा के लिए भेजें</button>
        )}
      </div>
    </div>
  )
}
