/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'

const MSG: Record<string, string> = {
  credentials: 'ईमेल या पासवर्ड ग़लत है।',
  locked: 'बहुत बार ग़लत पासवर्ड डाला गया। खाता कुछ मिनट के लिए बंद है, थोड़ी देर बाद कोशिश करें।',
  network: 'सर्वर से जुड़ नहीं पाए। इंटरनेट जाँचें और फिर कोशिश करें।',
}

/**
 * Desk/Admin login. Posts to Payload's login API, then does a full page load to `next`, so the 2-step check
 * (/2fa, a different part of the app) always opens properly instead of hanging mid-navigation.
 */
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 45000) // a cold server may need a while to wake up
      const res = await fetch('/api/users/login', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password }), signal: ctrl.signal })
      clearTimeout(timer)
      if (res.ok) {
        window.location.assign(next) // full load: the server decides between /2fa and the page itself
        return
      }
      const body = (await res.json().catch(() => ({}))) as { errors?: { message?: string }[] }
      const m = body.errors?.[0]?.message || ''
      setErr(/lock/i.test(m) ? MSG.locked : MSG.credentials)
    } catch {
      setErr(MSG.network)
    }
    setBusy(false)
  }

  const field = 'w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:border-[#f4a31c] focus:ring-2 focus:ring-[#f4a31c]/40'
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(1200px_600px_at_50%_-10%,#1f3a6b,transparent),linear-gradient(180deg,#0d1b33,#0a1426)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-160.webp" alt="" width={88} height={88} className="rounded-full shadow-lg ring-2 ring-[#f4a31c]/60" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-white">राष्ट्रीय पारदर्शिता प्रहरी</h1>
          <p className="mt-1 text-sm font-semibold tracking-wide text-[#f4a31c]">संपादकीय डेस्क · एडमिन लॉगिन</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur" noValidate>
          <label className="block text-sm font-semibold text-white/85">
            ईमेल
            <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-1.5`} placeholder="you@rashtriyapardarshitaprahari.org" />
          </label>
          <label className="block text-sm font-semibold text-white/85">
            पासवर्ड
            <span className="relative mt-1.5 block">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} pr-24`} placeholder="••••••••" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute inset-y-0 right-2 my-auto h-9 rounded-md px-3 text-sm font-bold text-[#f4a31c] hover:bg-white/10">
                {show ? 'छिपाएं' : 'दिखाएं'}
              </button>
            </span>
          </label>
          {err && (
            <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200">
              {err}
            </p>
          )}
          <button type="submit" disabled={busy || !email || !password} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f4a31c] text-base font-extrabold text-[#0d1b33] transition hover:bg-[#ffb63b] disabled:cursor-not-allowed disabled:opacity-60">
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b33] border-t-transparent" aria-hidden />}
            {busy ? 'लॉगिन हो रहा है…' : 'लॉगिन करें'}
          </button>
          <div className="flex items-center justify-between text-sm">
            <a href="/admin/forgot" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
              पासवर्ड भूल गए?
            </a>
            <span className="text-white/50">🔒 2-स्टेप सुरक्षा</span>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">केवल अधिकृत संपादकीय टीम के लिए</p>
      </div>
    </main>
  )
}
