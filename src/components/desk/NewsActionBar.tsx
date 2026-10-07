'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { archiveNews, copyNews, purgeNews, republishNews, restoreFromTrash, trashNews, type ActionResult } from '@/app/(desk)/desk/news/actions'
import { DELETE_REASONS, type Btn } from '@/lib/newsStatus'

type Info = { status: string; firstPublishedAt: string; lastEditor: string; lastUpdate: string; newsId: string; live: boolean }

const LABEL: Record<Btn, string> = {
  edit: '✎ संपादित',
  preview: '👁 प्रीव्यू',
  publish: '✅ प्रकाशित करें',
  approve: '✅ स्वीकृत / प्रकाशित',
  download: '⬇ डाउनलोड',
  share: '📣 सोशल शेयर',
  republish: '🔁 पुनः प्रकाशित',
  archive: '🗄 आर्काइव',
  restorePublish: '♻ वापस लाकर प्रकाशित',
  delete: '🗑 हटाएं',
  restoreTrash: '♻ ट्रैश से वापस',
  purge: '⛔ स्थायी रूप से हटाएं',
  history: '🕘 संस्करण इतिहास',
  audit: '📜 ऑडिट लॉग',
  social: '📱 सोशल वर्ज़न बनाएं',
  replaceMedia: '🖼 मीडिया बदलें',
  copy: '📄 इससे नई खबर',
}
const REASON_HI: Record<(typeof DELETE_REASONS)[number], string> = {
  Duplicate: 'डुप्लिकेट',
  'Legal / Editorial issue': 'कानूनी / संपादकीय मुद्दा',
  'Incorrect information': 'गलत जानकारी',
  'Technical error': 'तकनीकी त्रुटि',
  Other: 'अन्य',
}

/** Per-story buttons (status × role, decided on the server) with the confirmations the spec asks for. Big touch targets. */
export function NewsActionBar({ id, slug, title, buttons, info }: { id: number; slug?: string | null; title: string; buttons: { main: Btn[]; more: Btn[] }; info: Info }) {
  const router = useRouter()
  const [dialog, setDialog] = useState<null | 'archive' | 'delete' | 'delete2' | 'republish' | 'purge' | 'restoreTrash'>(null)
  const [reason, setReason] = useState('')
  const [other, setOther] = useState('')
  const [mode, setMode] = useState<'original' | 'updated'>('updated')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const href: Partial<Record<Btn, string>> = {
    edit: `/desk/news/${id}`,
    preview: `/desk/news/${id}/preview`,
    publish: `/desk/news/${id}?publish=1`,
    approve: `/desk/news/${id}?publish=1`,
    download: `/desk/news/${id}/download`,
    share: `/desk/news/${id}/share`,
    social: `/desk/news/${id}/share`,
    history: `/desk/news/${id}/history`,
    audit: `/desk/audit?q=${encodeURIComponent(info.newsId || String(id))}`,
    replaceMedia: `/desk/news/${id}#photo`,
  }
  const done = (r: ActionResult) => {
    setNote(r.ok ? { ok: true, text: r.message || 'हो गया' } : { ok: false, text: r.error })
    if (r.ok) {
      setDialog(null)
      if (r.id) router.push(`/desk/news/${r.id}`)
      else router.refresh()
    }
  }
  const act = (fn: () => Promise<ActionResult>) => start(async () => done(await fn()))
  const click = (b: Btn) => {
    setNote(null)
    if (b === 'archive') setDialog('archive')
    else if (b === 'delete') setDialog(info.live ? 'delete' : 'delete2')
    else if (b === 'republish' || b === 'restorePublish') setDialog('republish')
    else if (b === 'purge') setDialog('purge')
    else if (b === 'restoreTrash') setDialog('restoreTrash')
    else if (b === 'copy') act(() => copyNews(id))
  }
  const big = 'min-h-11 rounded-lg px-3.5 py-2 text-sm font-bold'
  const one = (b: Btn, inMenu = false) =>
    href[b] ? (
      <Link key={b} href={href[b]!} className={inMenu ? 'block px-4 py-3 hover:bg-surface' : `${big} inline-flex items-center border border-line bg-bg hover:bg-surface`}>
        {LABEL[b]}
      </Link>
    ) : (
      <button key={b} type="button" disabled={pending} onClick={() => click(b)} className={inMenu ? 'block w-full px-4 py-3 text-left hover:bg-surface' : `${big} ${b === 'delete' || b === 'purge' ? 'bg-alert-600 text-white' : 'border border-line bg-bg hover:bg-surface'}`}>
        {LABEL[b]}
      </button>
    )

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {buttons.main.map((b) => one(b))}
        {buttons.more.length > 0 && (
          <details className="relative">
            <summary className={`${big} cursor-pointer list-none border border-line bg-bg select-none hover:bg-surface`}>More ▼</summary>
            <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border border-line bg-bg text-sm shadow-xl">{buttons.more.map((b) => one(b, true))}</div>
          </details>
        )}
        {slug && (info.status === 'प्रकाशित' || info.status === 'अपडेटेड') && (
          <Link href={`/hi/news/${slug}`} target="_blank" className={`${big} inline-flex items-center text-link`}>
            वेबसाइट पर ↗
          </Link>
        )}
      </div>
      {note && (
        <p role="status" className={`mt-2 rounded px-3 py-2 text-sm font-semibold ${note.ok ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>
          {note.text}
        </p>
      )}

      {dialog && (
        <div role="dialog" aria-modal aria-label={title} className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => !pending && setDialog(null)}>
          <div className="anim-sheet w-full max-w-md rounded-2xl bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-xs text-muted">{info.newsId || `#${id}`}</p>
            <p className="mb-4 font-semibold leading-snug">{title}</p>

            {dialog === 'archive' && (
              <>
                <p>आर्काइव करने पर खबर वेबसाइट की सूचियों और खोज से हट जाएगी। URL, News ID, सामग्री और इतिहास सुरक्षित रहेंगे।</p>
                <Buttons pending={pending} onCancel={() => setDialog(null)} onOk={() => act(() => archiveNews(id))} ok="आर्काइव करें" />
              </>
            )}

            {dialog === 'delete' && (
              <>
                <p className="font-bold text-alert-700">यह समाचार Delete किया जाएगा। क्या आप निश्चित हैं?</p>
                <Buttons pending={pending} onCancel={() => setDialog(null)} onOk={() => setDialog('delete2')} ok="हां, आगे बढ़ें" danger />
              </>
            )}
            {dialog === 'delete2' && (
              <>
                {info.live ? (
                  <fieldset>
                    <legend className="mb-2 font-bold">हटाने का कारण (ज़रूरी)</legend>
                    {DELETE_REASONS.map((r) => (
                      <label key={r} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-surface">
                        <input type="radio" name={`reason-${id}`} value={r} checked={reason === r} onChange={() => setReason(r)} className="h-5 w-5" />
                        {REASON_HI[r]} <span className="text-xs text-muted">({r})</span>
                      </label>
                    ))}
                    {reason === 'Other' && <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="कारण लिखें" className="mt-2 w-full rounded-lg border border-line px-3 py-2" />}
                  </fieldset>
                ) : (
                  <p>यह ड्राफ्ट ट्रैश में चला जाएगा (एडमिन वापस ला सकते हैं)।</p>
                )}
                <Buttons
                  pending={pending}
                  onCancel={() => setDialog(null)}
                  onOk={() => act(() => trashNews(id, info.live ? reason : 'Draft removed', other))}
                  ok="ट्रैश में डालें"
                  danger
                  disabled={info.live && (!reason || (reason === 'Other' && !other.trim()))}
                />
              </>
            )}

            {dialog === 'republish' && (
              <>
                <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-surface p-3 text-sm">
                  <dt className="text-muted">मूल प्रकाशन तिथि</dt>
                  <dd>{info.firstPublishedAt}</dd>
                  <dt className="text-muted">वर्तमान स्थिति</dt>
                  <dd>{info.status}</dd>
                  <dt className="text-muted">अंतिम संपादक</dt>
                  <dd>{info.lastEditor}</dd>
                  <dt className="text-muted">अंतिम अपडेट</dt>
                  <dd>{info.lastUpdate}</dd>
                </dl>
                <p className="mb-2 font-semibold">क्या आप इसे मूल Publication Date के साथ प्रकाशित करना चाहते हैं या Updated News के रूप में?</p>
                {(
                  [
                    ['original', '(A) मूल प्रकाशन तिथि के साथ', 'पेज पर पहली प्रकाशन तिथि ही दिखेगी'],
                    ['updated', '(B) Updated / Re-published', 'पेज पर “Updated on: तारीख और समय” दिखेगा'],
                  ] as const
                ).map(([v, l, h]) => (
                  <label key={v} className="flex min-h-11 items-start gap-3 rounded-lg p-2 hover:bg-surface">
                    <input type="radio" name={`mode-${id}`} checked={mode === v} onChange={() => setMode(v)} className="mt-1 h-5 w-5" />
                    <span>
                      <span className="block font-semibold">{l}</span>
                      <span className="text-xs text-muted">{h}</span>
                    </span>
                  </label>
                ))}
                <p className="mt-2 text-xs text-muted">दोनों में News ID और स्थायी URL वही रहेंगे।</p>
                <Buttons pending={pending} onCancel={() => setDialog(null)} onOk={() => act(() => republishNews(id, mode))} ok="प्रकाशित करें" />
              </>
            )}

            {dialog === 'restoreTrash' && (
              <>
                <p>ट्रैश से वापस लाएं? पहले प्रकाशित रह चुकी खबर “आर्काइव” में लौटेगी।</p>
                <Buttons pending={pending} onCancel={() => setDialog(null)} onOk={() => act(() => restoreFromTrash(id))} ok="वापस लाएं" />
              </>
            )}

            {dialog === 'purge' && (
              <>
                <p className="font-bold text-alert-700">स्थायी रूप से हटाने के बाद यह खबर वापस नहीं आएगी (ऑडिट लॉग में रिकॉर्ड रहेगा)।</p>
                <label className="mt-3 block text-sm font-semibold" htmlFor={`pw-${id}`}>
                  पुष्टि के लिए अपना पासवर्ड डालें
                </label>
                <input id={`pw-${id}`} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5" />
                <Buttons pending={pending} onCancel={() => setDialog(null)} onOk={() => act(() => purgeNews(id, password))} ok="स्थायी रूप से हटाएं" danger disabled={!password} />
              </>
            )}
            {note && !note.ok && <p className="mt-3 rounded bg-alert-600/10 px-3 py-2 text-sm font-semibold text-alert-700">{note.text}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function Buttons({ pending, onCancel, onOk, ok, danger, disabled }: { pending: boolean; onCancel: () => void; onOk: () => void; ok: string; danger?: boolean; disabled?: boolean }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button type="button" onClick={onCancel} disabled={pending} className="min-h-12 rounded-lg border border-line font-bold">
        रद्द करें
      </button>
      <button type="button" onClick={onOk} disabled={pending || disabled} className={`min-h-12 rounded-lg font-bold text-white disabled:opacity-50 ${danger ? 'bg-alert-600' : 'bg-navy-900'}`}>
        {pending ? '…' : ok}
      </button>
    </div>
  )
}
