import { redirect } from 'next/navigation'
import { Qr } from '@/components/Qr'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { newTotpSecret, otpauthUri, seal, unseal } from '@/lib/security'
import { verifyTwoFactor } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: '2-स्टेप सत्यापन' }

const ERR: Record<string, string> = {
  wrong: 'कोड ग़लत है — ऐप में दिख रहा नया 6 अंकों का कोड डालें।',
  locked: 'बहुत ग़लत कोड। 15 मिनट बाद फिर कोशिश करें।',
  setup: 'पहले नीचे QR स्कैन करके ऐप जोड़ें।',
}

export default async function TwoFactorPage({ searchParams }: { searchParams: Promise<{ next?: string; err?: string }> }) {
  const sp = await searchParams
  const user = await currentUser(true)
  if (!user) redirect('/admin/login?redirect=/2fa')
  const payload = await db()
  const u = (await payload.findByID({ collection: 'users', id: user.id, depth: 0 })) as unknown as { totpSecret?: string; totpEnabled?: boolean }
  let secret = u.totpSecret ? unseal(u.totpSecret).toString() : ''
  if (!secret) {
    // First login: make the secret now (kept until the first correct code confirms it).
    secret = newTotpSecret()
    await payload.update({ collection: 'users', id: user.id, data: { totpSecret: seal(secret), totpEnabled: false } as never, depth: 0 })
  }
  const enrolling = !u.totpEnabled
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-extrabold text-navy-900">🔐 2-स्टेप सत्यापन</h1>
      <p className="mt-2 text-muted">{user.name}, सुरक्षा के लिए पासवर्ड के बाद फ़ोन के ऑथेंटिकेटर ऐप का 6 अंकों का कोड भी चाहिए।</p>
      {enrolling && (
        <div className="mt-5 rounded-lg border border-line bg-bg p-4">
          <p className="font-semibold">पहली बार — ऐप जोड़ें</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            <li>फ़ोन में Google Authenticator / Microsoft Authenticator / Authy खोलें।</li>
            <li>“+” दबाकर यह QR स्कैन करें।</li>
            <li>ऐप में दिख रहा 6 अंकों का कोड नीचे डालें।</li>
          </ol>
          <div className="mt-3 flex justify-center">
            <Qr value={otpauthUri(secret, user.email)} size={180} />
          </div>
          <p className="mt-2 text-center text-xs break-all text-muted">
            QR न चले तो यह कोड ऐप में हाथ से डालें: <code>{secret}</code>
          </p>
        </div>
      )}
      {sp.err && ERR[sp.err] && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {ERR[sp.err]}
        </p>
      )}
      <form action={verifyTwoFactor} className="mt-5 space-y-3">
        <input type="hidden" name="next" value={sp.next || '/desk'} />
        <label className="block text-sm font-semibold" htmlFor="code">
          6 अंकों का कोड
        </label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus className="w-full rounded-lg border border-line bg-bg px-3 py-3 text-center text-2xl tracking-[0.4em]" />
        <button className="w-full rounded-lg bg-navy-900 px-4 py-3 font-bold text-white">{enrolling ? 'चालू करें और आगे बढ़ें' : 'आगे बढ़ें'}</button>
      </form>
      <p className="mt-6 text-center text-sm">
        <a href="/admin/logout" className="text-link underline">
          दूसरे खाते से लॉगिन करें
        </a>{' '}
        · फ़ोन खो गया? एडमिन से “2-step reset” करवाएं।
      </p>
    </main>
  )
}
