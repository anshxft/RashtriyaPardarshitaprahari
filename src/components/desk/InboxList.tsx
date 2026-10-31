'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { setInboxAction, type InboxKind } from '@/app/(desk)/desk/inbox/actions'

export type InboxRow = { id: number; ref: string; createdAt: string; status: string; note: string; anonymous: boolean; files: number; fields: { label: string; value: string; long: boolean }[] }

export function InboxList({ kind, rows, statuses }: { kind: InboxKind; rows: InboxRow[]; statuses: [string, string][] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [notes, setNotes] = useState<Record<number, string>>({})
  const run = (id: number, data: { status?: string; internalNotes?: string }, ok: string) =>
    start(async () => {
      const r = await setInboxAction(kind, id, data)
      setNote(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error })
      if (r.ok) router.refresh()
    })

  if (!rows.length) return <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted">अभी कोई संदेश नहीं।</p>
  return (
    <div className="space-y-3">
      {note && <p role="status" className={`rounded px-3 py-2 text-sm font-semibold ${note.ok ? 'bg-india-600/10 text-india-700' : 'bg-alert-600/10 text-alert-700'}`}>{note.text}</p>}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`rounded-xl border bg-bg p-4 ${r.status === 'new' ? 'border-saffron-500 border-2' : 'border-line'}`}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              {r.ref && <span className="font-mono font-bold text-navy-900">{r.ref}</span>}
              <span>{new Date(r.createdAt).toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' })}</span>
              {r.anonymous && <span className="rounded bg-alert-600/10 px-1.5 py-0.5 font-bold text-alert-700">पहचान गुप्त रखें — नाम कभी न छापें</span>}
              {r.files > 0 && <span className="rounded bg-surface px-1.5 py-0.5">{r.files} फाइल (एडमिन में देखें)</span>}
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {r.fields.map((f) => (
                <div key={f.label} className={f.long ? 'sm:col-span-2' : ''}>
                  <dt className="inline font-semibold">{f.label}: </dt>
                  <dd className={`inline ${f.long ? 'whitespace-pre-wrap' : ''}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
              <label className="text-sm font-semibold">
                स्थिति{' '}
                <select value={r.status} disabled={pending} onChange={(e) => run(r.id, { status: e.target.value }, 'स्थिति बदल गई ✔')} className="rounded-md border border-line bg-bg px-2 py-1.5">
                  {statuses.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <input value={notes[r.id] ?? r.note} onChange={(e) => setNotes((x) => ({ ...x, [r.id]: e.target.value }))} placeholder="अंदरूनी नोट (सिर्फ टीम को दिखेगा)" className="min-w-48 flex-1 rounded-md border border-line bg-bg px-2 py-1.5 text-sm" />
              <button type="button" disabled={pending || notes[r.id] === undefined || notes[r.id] === r.note} onClick={() => run(r.id, { internalNotes: notes[r.id] }, 'नोट सेव ✔')} className="rounded-md bg-navy-900 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-40">
                नोट सेव
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
