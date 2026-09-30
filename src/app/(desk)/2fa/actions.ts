'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { TWOFA_COOKIE, TWOFA_TTL_MS, twofaIssue, totpVerify, unseal } from '@/lib/security'

const MAX_FAILS = 5
const LOCK_MS = 15 * 60_000

/** Checks the 6-digit code; on success sets the signed "2-step done" cookie. Wrong codes are counted and lock the account for 15 min. */
export async function verifyTwoFactor(formData: FormData) {
  const user = await currentUser(true)
  if (!user) redirect('/admin/login?redirect=/2fa')
  const next = String(formData.get('next') || '/desk')
  const back = (e: string) => redirect(`/2fa?err=${e}&next=${encodeURIComponent(next)}`)
  const payload = await db()
  const u = (await payload.findByID({ collection: 'users', id: user.id, depth: 0 })) as unknown as { totpSecret?: string; totpEnabled?: boolean; totpLast?: number; totpFails?: number; totpLockUntil?: string }
  if (!u.totpSecret) return back('setup')
  if (u.totpLockUntil && new Date(u.totpLockUntil).getTime() > Date.now()) return back('locked')
  const hit = totpVerify(unseal(u.totpSecret).toString(), String(formData.get('code') || ''), u.totpLast || 0)
  if (hit == null) {
    const fails = (u.totpFails || 0) + 1
    await payload.update({ collection: 'users', id: user.id, data: { totpFails: fails >= MAX_FAILS ? 0 : fails, totpLockUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS).toISOString() : null } as never, depth: 0 })
    return back(fails >= MAX_FAILS ? 'locked' : 'wrong')
  }
  await payload.update({ collection: 'users', id: user.id, data: { totpEnabled: true, totpLast: hit, totpFails: 0, totpLockUntil: null } as never, depth: 0 })
  ;(await cookies()).set(TWOFA_COOKIE, twofaIssue(user.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TWOFA_TTL_MS / 1000 })
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/desk')
}
