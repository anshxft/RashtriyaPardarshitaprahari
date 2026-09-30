'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addBreakingAction, deleteBreakingAction, toggleBreakingAction } from '@/app/(desk)/desk/actions'

type Item = { id: number; text: string; link?: string | null; active: boolean; expiresAt?: string | null }
const input = 'w-full rounded-md border border-line bg-bg px-3 py-3 text-base'

/** Add / switch off / delete the red top-of-site ticker lines. */
export function BreakingManager({ items, stories }: { items: Item[]; stories: { title: string; href: string }[] }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [hours, setHours] = useState(6)
  const [note, setNote] = useState('')
  const [busy, start] = useTransition()
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn()
      setNote(r.ok ? '' : r.error || 'त्रुटि')
      if (r.ok) router.refresh()
    })

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold text-navy-900">🔴 ब्रेकिंग न्यूज़ पट्टी</h1>
      <section className="space-y-3 rounded-xl border border-line bg-bg p-4">
        <label className="block text-sm font-semibold">
          नई पट्टी (छोटी, एक पंक्ति)
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={140} className={`${input} mt-1 text-lg`} />
        </label>
        <label className="block text-sm font-semibold">
          किस खबर से जोड़ें (वैकल्पिक)
          <select value={link} onChange={(e) => setLink(e.target.value)} className={`${input} mt-1`}>
            <option value="">— कोई लिंक नहीं —</option>
            {stories.map((s) => (
              <option key={s.href} value={s.href}>
                {s.title.slice(0, 70)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          कब तक दिखे
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className={`${input} mt-1`}>
            <option value={2}>2 घंटे</option>
            <option value={6}>6 घंटे</option>
            <option value={12}>12 घंटे</option>
            <option value={24}>24 घंटे</option>
            <option value={0}>जब तक हटाऊं नहीं</option>
          </select>
        </label>
        {note && <p className="text-sm font-semibold text-alert-600">{note}</p>}
        <button type="button" disabled={busy || !text.trim()} onClick={() => run(async () => { const r = await addBreakingAction(text, link, hours || undefined); if (r.ok) setText(''); return r })} className="min-h-12 w-full rounded-lg bg-alert-600 px-6 text-lg font-extrabold text-white disabled:opacity-60">
          🔴 पट्टी में डालें
        </button>
      </section>

      <section className="rounded-xl border border-line bg-bg p-4">
        <h2 className="mb-2 font-display text-lg font-bold">चल रही / हाल की पट्टियां</h2>
        {items.length === 0 ? (
          <p className="py-4 text-center text-muted">कोई पट्टी नहीं।</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((b) => {
              const expired = b.expiresAt ? new Date(b.expiresAt).getTime() < Date.now() : false
              const live = b.active && !expired
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-2 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${live ? 'bg-alert-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{live ? 'लाइव' : expired ? 'समाप्त' : 'बंद'}</span>
                  <span className="min-w-0 flex-1 basis-48 font-semibold">{b.text}</span>
                  <button type="button" disabled={busy} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold" onClick={() => run(() => toggleBreakingAction(b.id, !b.active))}>
                    {b.active ? 'बंद करें' : 'चालू करें'}
                  </button>
                  <button type="button" disabled={busy} className="rounded-full border border-line px-3 py-1.5 text-sm text-alert-700" onClick={() => confirm('यह पट्टी हटाएं?') && run(() => deleteBreakingAction(b.id))}>
                    🗑
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
