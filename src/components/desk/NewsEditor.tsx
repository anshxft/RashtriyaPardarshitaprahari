/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { saveNewsAction } from '@/app/(desk)/desk/actions'
import type { CategoryOption, NewsInput, SaveMode, SaveResult, TeamOption } from '@/lib/deskTypes'
import type { EpStory } from '@/lib/epaper'
import { INK, INK_OPTIONS, resolveLayout, TEMPLATES, type Ink, type Layout, type Size } from '@/lib/layout'
import { parsePastedStory } from '@/lib/paste'
import { EpaperPreview } from './EpaperPreview'
import { PhotoField, type Photo } from './PhotoField'
import { publishChecklist } from '@/lib/newsStatus'

export type NewsForm = {
  id?: number
  title: string
  subheadline: string
  reporterName: string
  reporterId: number | null
  location: string
  categoryId: number | null
  body: string
  photo: Photo
  credit: string
  layout: Layout
  scheduleAt: string
  editNote: string
  format: string
  published: boolean
  status?: string
  newsId?: string | null
  slug?: string | null
  richBody?: boolean
}

type Props = {
  initial: NewsForm
  locale: 'hi' | 'en'
  categories: CategoryOption[]
  team: TeamOption[]
  edition: EpStory[]
  mayPublish: boolean
  reference?: { title: string; body: string } // Hindi original while writing the English version
}

const SIZES: Size[] = ['sm', 'md', 'lg', 'xl']
const input = 'w-full rounded-md border border-line bg-bg px-3 py-3 text-base'
const card = 'rounded-xl border border-line bg-bg p-4 shadow-sm'
const chip = 'min-h-11 rounded-full border border-line bg-bg px-4 py-2 text-sm font-semibold hover:bg-surface'
const on = '!border-navy-900 !bg-navy-900 !text-white'
const h3 = 'mb-3 font-display text-lg font-bold text-navy-900'

/** Blank line = new paragraph. With no blank lines at all, every line is a paragraph (WhatsApp style). */
export function bodyToParagraphs(body: string): string[] {
  const t = body.replace(/\r\n?/g, '\n').trim()
  if (!t) return []
  return (/\n\s*\n/.test(t) ? t.split(/\n\s*\n/).map((p) => p.split('\n').join(' ')) : t.split('\n')).map((p) => p.trim()).filter(Boolean)
}

const STEP = (cur: Size | null | undefined, d: 1 | -1, fallback: Size): Size => SIZES[Math.min(3, Math.max(0, SIZES.indexOf(cur || fallback) + d))]

export function NewsEditor({ initial, locale, categories, team, edition, mayPublish, reference }: Props) {
  const [f, setF] = useState<NewsForm>(initial)
  const [busy, start] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [result, setResult] = useState<Extract<SaveResult, { ok: true }> | null>(null)
  const [tab, setTab] = useState<'epaper' | 'web'>('epaper')
  const [webKey, setWebKey] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [more, setMore] = useState(false)
  const [schedule, setSchedule] = useState(Boolean(initial.scheduleAt))
  const [confirm, setConfirm] = useState<null | 'publish' | 'schedule'>(null)
  // Opened from the news list with “Publish / Approve”: go straight to the checklist.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('publish') === '1') setConfirm('publish')
  }, [])

  const set = <K extends keyof NewsForm>(k: K, v: NewsForm[K]) => (setF((x) => ({ ...x, [k]: v })), setDirty(true))
  const setLayout = (p: Layout) => (setF((x) => ({ ...x, layout: { ...x.layout, ...p } })), setDirty(true))

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const paragraphs = useMemo(() => bodyToParagraphs(f.body), [f.body])
  const words = useMemo(() => f.body.split(/\s+/).filter(Boolean).length, [f.body])
  const L = resolveLayout(f.layout, { hasPhoto: Boolean(f.photo.url), format: f.format })
  const catLabel = categories.find((c) => c.id === f.categoryId)?.label

  // ── Paste → Auto Format
  function autoFormat(text: string, replace: boolean) {
    const p = parsePastedStory(text, { title: f.title, subheadline: f.subheadline, reporter: f.reporterName, location: f.location })
    const filled = [p.title && 'हेडलाइन', p.subheadline && 'उपशीर्षक', p.reporter && 'संवाददाता', p.location && 'स्थान'].filter(Boolean)
    setF((x) => ({
      ...x,
      title: x.title || p.title || '',
      subheadline: x.subheadline || p.subheadline || '',
      reporterName: x.reporterName || p.reporter || '',
      location: x.location || p.location || '',
      body: replace || !x.body.trim() ? p.paragraphs.join('\n\n') : `${x.body.trim()}\n\n${p.paragraphs.join('\n\n')}`,
    }))
    setDirty(true)
    setMsg({ kind: 'ok', text: `ऑटो फॉर्मेट हो गया · ${p.paragraphs.length} पैराग्राफ${filled.length ? ` · भरे गए: ${filled.join(', ')}` : ''}` })
  }

  // ── Save
  function toInput(mode: SaveMode): NewsInput {
    return {
      id: f.id,
      locale,
      mode,
      format: f.format,
      title: f.title,
      subheadline: f.subheadline,
      reporterName: f.reporterName,
      reporterId: f.reporterId,
      location: f.location,
      categoryId: f.categoryId,
      paragraphs,
      heroImageId: f.photo.id,
      layout: f.layout,
      scheduleAt: mode === 'schedule' && f.scheduleAt ? new Date(`${f.scheduleAt}:00+05:30`).toISOString() : undefined,
      editNote: f.editNote,
    }
  }
  function save(mode: SaveMode) {
    setMsg(null)
    start(async () => {
      const r = await saveNewsAction(toInput(mode))
      if (!r.ok) return setMsg({ kind: 'err', text: r.error })
      setF((x) => ({ ...x, id: r.id, newsId: r.newsId, slug: r.slug, published: x.published || r.status === 'published' || r.status === 'scheduled', editNote: '' }))
      setDirty(false)
      setWebKey((k) => k + 1)
      window.history.replaceState(null, '', `/desk/news/${r.id}${locale === 'en' ? '?lang=en' : ''}`)
      if (r.status === 'draft' || r.status === 'submitted') {
        setResult(null)
        setMsg({ kind: 'ok', text: r.status === 'submitted' ? 'समीक्षा के लिए भेज दी गई ✔' : 'ड्राफ्ट सेव हो गया ✔' })
      } else {
        setMsg(null)
        setResult(r)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  // ── Preview story (same shape the e-paper uses)
  const draft: EpStory = useMemo(
    () => ({
      id: String(f.id ?? 'draft'),
      title: f.title || 'हेडलाइन यहाँ दिखेगी',
      subheadline: f.subheadline || null,
      reporter: f.reporterName || null,
      location: f.location || null,
      category: catLabel,
      newsId: f.newsId,
      url: f.slug ? `/${locale}/news/${f.slug}` : '',
      paragraphs: paragraphs.length ? paragraphs : ['यहाँ खबर का पाठ दिखेगा।'],
      photo: f.photo.url ? { src: f.photo.url, alt: f.title, credit: f.credit } : undefined,
      layout: L,
      format: f.format,
      qrSvg: null,
      publishedAt: new Date().toISOString(),
    }),
    [f, paragraphs, L, catLabel, locale],
  )

  const tpl = TEMPLATES[L.template]
  const inkSwatch = (val: Ink | null | undefined, pick: (i: Ink) => void) => (
    <span className="flex flex-wrap gap-1.5">
      {INK_OPTIONS.map((i) => (
        <button key={i} type="button" aria-label={i} title={i} onClick={() => pick(i)} className={`h-9 w-9 rounded-full border-2 ${(val || 'default') === i ? 'border-navy-900 ring-2 ring-gold-400' : 'border-line'}`} style={{ background: i === 'default' ? 'linear-gradient(135deg,#fff 50%,#ccc 50%)' : INK[i] }} />
      ))}
    </span>
  )
  const sizer = (label: string, cur: Size | null | undefined, fallback: Size, pick: (s: Size) => void) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <span className="flex items-center gap-1">
        <button type="button" className={chip} onClick={() => pick(STEP(cur, -1, fallback))}>A−</button>
        <span className="w-8 text-center text-sm font-bold">{(cur || fallback).toUpperCase()}</span>
        <button type="button" className={chip} onClick={() => pick(STEP(cur, 1, fallback))}>A+</button>
      </span>
    </div>
  )

  return (
    <div className="space-y-4">
      {result && <PublishedCard r={result} locale={locale} onClose={() => setResult(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">{f.id ? 'खबर संपादित करें' : '➕ नई खबर'}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {f.newsId && <span className="rounded bg-navy-100 px-2 py-1 font-mono text-navy-900">{f.newsId}</span>}
          <span className="rounded bg-white px-2 py-1 font-semibold ring-1 ring-line">{f.published ? '● प्रकाशित' : f.status === 'submitted' ? '◐ समीक्षा में' : '○ ड्राफ्ट'}</span>
          {f.id && (
            <Link href={locale === 'hi' ? `/desk/news/${f.id}?lang=en` : `/desk/news/${f.id}`} className={chip}>
              {locale === 'hi' ? 'English version →' : '← हिंदी'}
            </Link>
          )}
        </div>
      </div>

      {f.richBody && (
        <p className="rounded-md border border-saffron-600 bg-saffron-500/10 p-3 text-sm">
          इस खबर में लिंक/बोल्ड जैसी रिच फॉर्मेटिंग है। यहां सेव करने पर वह सादा पाठ बन जाएगी। पूरी फॉर्मेटिंग के लिए <Link className="font-bold underline" href={`/admin/collections/articles/${f.id}`}>एडमिन पैनल</Link> में खोलें।
        </p>
      )}
      {msg && (
        <p role="status" className={`rounded-md p-3 text-sm font-semibold ${msg.kind === 'ok' ? 'bg-india-600/10 text-india-600' : 'bg-alert-600/10 text-alert-700'}`}>
          {msg.text}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ───────────── FORM ───────────── */}
        <div className="space-y-4">
          <section className={card}>
            <h3 className={h3}>1 · टेम्पलेट चुनें</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(TEMPLATES).map(([key, t]) =>
                key === '6' ? (
                  <Link key={key} href="/desk/link" className={`${chip} flex flex-col items-start !rounded-xl`}>
                    <b>{key} · {t.hi}</b>
                    <span className="text-xs font-normal text-muted">{t.blurb}</span>
                  </Link>
                ) : (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLayout({ template: key, columns: null, headlineSize: null, photoSize: null, photoPos: null })}
                    className={`${chip} flex flex-col items-start !rounded-xl ${L.template === key ? on : ''}`}
                  >
                    <b>{key} · {t.hi}</b>
                    <span className={`text-xs font-normal ${L.template === key ? 'text-white/80' : 'text-muted'}`}>{t.blurb}</span>
                  </button>
                ),
              )}
            </div>
          </section>

          <section className={card}>
            <h3 className={h3}>2 · पूरी खबर पेस्ट करें</h3>
            {reference && (
              <details className="mb-3 rounded-md bg-surface p-3 text-sm">
                <summary className="cursor-pointer font-semibold">हिंदी मूल देखें</summary>
                <p className="mt-2 font-bold">{reference.title}</p>
                <p className="mt-1 whitespace-pre-line">{reference.body}</p>
              </details>
            )}
            <textarea
              value={f.body}
              onChange={(e) => set('body', e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text')
                if (text.length < 60) return
                e.preventDefault()
                autoFormat(text, false)
              }}
              rows={12}
              placeholder="फैक्ट-चेक और प्रूफ-रीडिंग के बाद पूरी खबर यहां एक साथ पेस्ट करें। हेडलाइन, उपशीर्षक, संवाददाता, स्थान और पैराग्राफ अपने-आप अलग हो जाएंगे।"
              className={`${input} leading-relaxed`}
              aria-label="खबर का मुख्य पाठ"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <span>
                {paragraphs.length} पैराग्राफ · {words} शब्द
              </span>
              <button type="button" className={chip} onClick={() => autoFormat(f.body, true)}>
                ✨ ऑटो फॉर्मेट
              </button>
            </div>
          </section>

          <section className={`${card} space-y-3`}>
            <h3 className={h3}>3 · हेडलाइन और विवरण</h3>
            <label className="block text-sm font-semibold">
              मुख्य हेडलाइन *
              <input value={f.title} onChange={(e) => set('title', e.target.value)} className={`${input} mt-1 text-lg font-bold`} />
            </label>
            <label className="block text-sm font-semibold">
              उपशीर्षक
              <input value={f.subheadline} onChange={(e) => set('subheadline', e.target.value)} className={`${input} mt-1`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                संवाददाता / रिपोर्टर
                <input
                  list="team-list"
                  value={f.reporterName}
                  onChange={(e) => {
                    const m = team.find((t) => t.name === e.target.value)
                    setF((x) => ({ ...x, reporterName: e.target.value, reporterId: m?.id ?? null }))
                    setDirty(true)
                  }}
                  className={`${input} mt-1`}
                />
                <datalist id="team-list">
                  {team.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.designation}
                    </option>
                  ))}
                </datalist>
              </label>
              <label className="block text-sm font-semibold">
                स्थान (डेटलाइन)
                <input value={f.location} onChange={(e) => set('location', e.target.value)} className={`${input} mt-1`} />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              श्रेणी *
              <select value={f.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)} className={`${input} mt-1`}>
                <option value="">— चुनें —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-muted">तारीख अपने-आप लगती है (भारतीय समय) और पहली बार प्रकाशित होने के बाद कभी नहीं बदलती।</p>
          </section>

          <section id="photo" className={`${card} scroll-mt-20`}>
            <h3 className={h3}>4 · फोटो</h3>
            <PhotoField photo={f.photo} onChange={(p) => set('photo', p)} alt={f.title} credit={f.credit} onCredit={(v) => set('credit', v)} />
          </section>

          <section className={`${card} space-y-4`}>
            <h3 className={h3}>5 · लेआउट</h3>
            <div>
              <p className="mb-1 text-sm font-semibold">कॉलम (ई-पेपर)</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => setLayout({ columns: n })} className={`${chip} flex-1 ${L.columns === n ? on : ''}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">{tpl.hi} टेम्पलेट का सुझाव: {tpl.columns} कॉलम</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">अलाइनमेंट</p>
              <div className="flex gap-2">
                {(['left', 'center', 'justify'] as const).map((a) => (
                  <button key={a} type="button" onClick={() => setLayout({ align: a })} className={`${chip} flex-1 ${L.align === a ? on : ''}`}>
                    {{ left: '⯇ बाएं', center: '☰ बीच', justify: '☷ दोनों' }[a]}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-md bg-surface px-3">
              <input type="checkbox" checked={L.autoFit} onChange={(e) => setLayout({ autoFit: e.target.checked })} className="h-5 w-5" />
              <span className="text-sm font-semibold">⚡ ऑटो फिट (जगह के हिसाब से फॉन्ट/कॉलम अपने-आप)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                ई-पेपर पृष्ठ
                <input type="number" min={1} placeholder="ऑटो" value={f.layout.epaperPage ?? ''} onChange={(e) => setLayout({ epaperPage: e.target.value ? Number(e.target.value) : null })} className={`${input} mt-1`} />
              </label>
              <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={L.inEpaper} onChange={(e) => setLayout({ inEpaper: e.target.checked })} />
                ई-पेपर में डालें
              </label>
            </div>

            <button type="button" className={chip} onClick={() => setMore((m) => !m)} aria-expanded={more}>
              🎨 {more ? 'सजावट छिपाएं' : 'सजावट (साइज़ / रंग / फोटो)'}
            </button>
            {more && (
              <div className="space-y-4 rounded-lg bg-surface p-3">
                <div className="space-y-2">
                  {sizer('हेडलाइन साइज़', f.layout.headlineSize, L.headlineSize, (s) => setLayout({ headlineSize: s }))}
                  {inkSwatch(f.layout.headlineInk, (i) => setLayout({ headlineInk: i }))}
                </div>
                <div className="space-y-2">
                  {sizer('उपशीर्षक साइज़', f.layout.subheadlineSize, L.subheadlineSize, (s) => setLayout({ subheadlineSize: s }))}
                  {inkSwatch(f.layout.subheadlineInk, (i) => setLayout({ subheadlineInk: i }))}
                </div>
                <div className="space-y-2">
                  {sizer('संवाददाता नाम साइज़', f.layout.reporterSize, L.reporterSize, (s) => setLayout({ reporterSize: s }))}
                  {inkSwatch(f.layout.reporterInk, (i) => setLayout({ reporterInk: i }))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">मुख्य पाठ साइज़ ({L.bodyScale}%)</span>
                  <span className="flex gap-1">
                    <button type="button" className={chip} onClick={() => setLayout({ bodyScale: Math.max(75, L.bodyScale - 5) })}>A−</button>
                    <button type="button" className={chip} onClick={() => setLayout({ bodyScale: Math.min(130, L.bodyScale + 5) })}>A+</button>
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">फोटो का आकार</p>
                  <div className="flex gap-2">
                    {(['s', 'm', 'l', 'full'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setLayout({ photoSize: s })} className={`${chip} flex-1 ${L.photoSize === s ? on : ''}`}>
                        {{ s: 'छोटी', m: 'मध्यम', l: 'बड़ी', full: 'पूरी' }[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">फोटो की स्थिति</p>
                  <div className="flex gap-2">
                    {(['top', 'left', 'right'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setLayout({ photoPos: s })} className={`${chip} flex-1 ${L.photoPos === s ? on : ''}`}>
                        {{ top: 'ऊपर', left: 'बाएं', right: 'दाएं' }[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className={`${card} space-y-3`}>
            <h3 className={h3}>6 · प्रकाशन</h3>
            {f.published && (
              <label className="block text-sm font-semibold">
                संशोधन का नोट (पाठकों को “संशोधित” में दिखेगा)
                <input value={f.editNote} onChange={(e) => set('editNote', e.target.value)} placeholder="जैसे: आंकड़ा सही किया गया" className={`${input} mt-1`} />
              </label>
            )}
            {mayPublish && !f.published && (
              <div>
                <label className="flex min-h-11 items-center gap-3">
                  <input type="checkbox" className="h-5 w-5" checked={schedule} onChange={(e) => (setSchedule(e.target.checked), !e.target.checked && set('scheduleAt', ''))} />
                  <span className="text-sm font-semibold">⏰ बाद के लिए शेड्यूल करें</span>
                </label>
                {schedule && <input type="datetime-local" value={f.scheduleAt} onChange={(e) => set('scheduleAt', e.target.value)} className={`${input} mt-2`} />}
              </div>
            )}
            {f.published && <p className="text-xs text-muted">मूल प्रकाशन तारीख, News ID और URL नहीं बदलेंगे। बदलाव पाठकों को “संशोधित” के रूप में दिखेगा।</p>}
          </section>
        </div>

        {/* ───────────── PREVIEW ───────────── */}
        <aside className="space-y-3 lg:sticky lg:top-16 lg:self-start">
          <div className={card}>
            <div className="mb-3 flex gap-2">
              <button type="button" className={`${chip} flex-1 ${tab === 'epaper' ? on : ''}`} onClick={() => setTab('epaper')}>📰 ई-पेपर प्रीव्यू</button>
              <button type="button" className={`${chip} flex-1 ${tab === 'web' ? on : ''}`} onClick={() => setTab('web')}>🌐 वेब पेज</button>
            </div>
            {tab === 'epaper' ? (
              <EpaperPreview draft={draft} edition={edition} lang={locale} />
            ) : f.id ? (
              <div className="space-y-2">
                <iframe key={webKey} title="वेब प्रीव्यू" src={`/${locale}/preview/${f.id}?t=${webKey}`} className="h-[640px] w-full rounded-lg border border-line bg-white" />
                {dirty && <p className="text-xs text-saffron-600">बदलाव दिखाने के लिए ड्राफ्ट सेव करें।</p>}
              </div>
            ) : (
              <p className="py-8 text-center text-muted">वेब प्रीव्यू देखने के लिए पहले “ड्राफ्ट सेव” दबाएं।</p>
            )}
          </div>
        </aside>
      </div>

      {/* ───────────── ACTION BAR ───────────── */}
      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-line bg-bg/95 p-3 shadow-[0_-4px_12px_rgba(0,0,0,.08)] backdrop-blur md:sticky md:bottom-0 md:rounded-xl md:border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={() => save('draft')} className="min-h-12 flex-1 rounded-lg border-2 border-navy-900 px-4 font-bold text-navy-900 disabled:opacity-60 sm:flex-none">
            💾 ड्राफ्ट सेव
          </button>
          {mayPublish ? (
            <>
              {schedule && !f.published && (
                <button type="button" disabled={busy || !f.scheduleAt} onClick={() => setConfirm('schedule')} className="min-h-12 flex-1 rounded-lg bg-gold-400 px-5 font-bold text-navy-950 disabled:opacity-60 sm:flex-none">
                  ⏰ शेड्यूल करें
                </button>
              )}
              {!(schedule && !f.published) && (
                <button type="button" disabled={busy} onClick={() => setConfirm('publish')} className="min-h-12 flex-[2] rounded-lg bg-india-600 px-6 text-lg font-extrabold text-white hover:bg-india-600/90 disabled:opacity-60 sm:flex-none">
                  {f.published ? '✔ अपडेट प्रकाशित करें' : '🚀 प्रकाशित करें'}
                </button>
              )}
            </>
          ) : (
            <button type="button" disabled={busy} onClick={() => save('submit')} className="min-h-12 flex-[2] rounded-lg bg-saffron-500 px-6 text-lg font-extrabold text-navy-950 disabled:opacity-60 sm:flex-none">
              📤 समीक्षा के लिए भेजें
            </button>
          )}
          {busy && <span className="text-sm text-muted">सेव हो रहा है…</span>}
        </div>
      </div>

      {confirm && (
        <PublishConfirm
          republish={f.published}
          schedule={confirm === 'schedule'}
          items={publishChecklist({ title: f.title, subheadline: f.subheadline, reporterName: f.reporterName, location: f.location, categoryId: f.categoryId, hasMedia: Boolean(f.photo.id || f.photo.url), body: f.body, isLink: f.format === 'link' })}
          onCancel={() => setConfirm(null)}
          onOk={() => {
            const m = confirm
            setConfirm(null)
            save(m)
          }}
        />
      )}
    </div>
  )
}

function PublishedCard({ r, locale, onClose }: { r: Extract<SaveResult, { ok: true }>; locale: string; onClose: () => void }) {
  const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => {})
  return (
    <section role="status" className="rounded-xl border-2 border-india-600 bg-india-600/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold text-india-600">{r.status === 'scheduled' ? '⏰ शेड्यूल हो गई' : '🎉 प्रकाशित हो गई'}</p>
          {r.newsId && (
            <p className="mt-1">
              News ID: <b className="font-mono text-lg">{r.newsId}</b>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href={r.urls.web} target="_blank" className="rounded-full bg-navy-900 px-4 py-2 font-bold text-white">वेब पेज खोलें ↗</Link>
            <Link href={r.urls.print} target="_blank" className="rounded-full border border-line bg-bg px-4 py-2 font-semibold">🖨 प्रिंट / PDF</Link>
            <Link href={`/${locale}/epaper`} target="_blank" className="rounded-full border border-line bg-bg px-4 py-2 font-semibold">📰 ई-पेपर में देखें</Link>
            {r.urls.short && (
              <button type="button" onClick={() => copy(r.urls.short!)} className="rounded-full border border-line bg-bg px-4 py-2 font-semibold">
                🔗 शेयर लिंक कॉपी
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            QR वाला न्यूज़ कार्ड, टेक्स्ट कॉपी और फोटो:{' '}
            <Link href={`/desk/news/${r.id}/download`} className="font-semibold underline">
              डाउनलोड पेज
            </Link>
          </p>
        </div>
        {r.qrSvg && <div className="rounded bg-white p-1" dangerouslySetInnerHTML={{ __html: r.qrSvg }} />}
      </div>
      <button type="button" onClick={onClose} className="mt-2 text-sm underline">
        बंद करें
      </button>
    </section>
  )
}

/** Part 1.3: checklist first, then the official confirmation. Required items missing = Publish stays disabled. */
function PublishConfirm({ items, republish, schedule, onCancel, onOk }: { items: ReturnType<typeof publishChecklist>; republish: boolean; schedule: boolean; onCancel: () => void; onOk: () => void }) {
  const blocked = items.some((i) => i.required && !i.ok)
  return (
    <div role="dialog" aria-modal aria-label="प्रकाशन की पुष्टि" className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onCancel}>
      <div className="anim-sheet max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 font-display text-lg font-bold">✅ प्रकाशन से पहले जांच</p>
        <ul className="space-y-1.5 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex items-start gap-2">
              <span aria-hidden className={i.ok ? 'text-india-600' : i.required ? 'text-alert-600' : 'text-saffron-600'}>
                {i.ok ? '✔' : i.required ? '✘' : '⚠'}
              </span>
              <span>
                {i.label}
                {i.note && <span className="block text-xs text-muted">{i.note}</span>}
              </span>
            </li>
          ))}
        </ul>
        {blocked ? (
          <p className="mt-4 rounded bg-alert-600/10 px-3 py-2 text-sm font-semibold text-alert-700">✘ वाले ज़रूरी हिस्से भरें, फिर प्रकाशित करें।</p>
        ) : (
          <p className="mt-4 font-semibold">
            {republish ? 'क्या आप ये बदलाव आधिकारिक रूप से प्रकाशित करना चाहते हैं? नया संस्करण बनेगा; News ID और URL वही रहेंगे।' : schedule ? 'क्या आप इस समाचार को तय समय पर आधिकारिक रूप से प्रकाशित करना चाहते हैं?' : 'क्या आप इस समाचार को आधिकारिक रूप से प्रकाशित करना चाहते हैं?'}
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="min-h-12 rounded-lg border border-line font-bold">
            Cancel
          </button>
          <button type="button" onClick={onOk} disabled={blocked} className="min-h-12 rounded-lg bg-india-600 font-extrabold text-white disabled:opacity-50">
            {schedule ? 'Schedule' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
