import { cookies, headers } from 'next/headers'
import type { User } from '@/payload-types'
import { db } from './data'
import { loadPermissions } from './permissions'
import { TWOFA_COOKIE, twofaRequired, twofaValid } from './security'

/**
 * The logged-in admin/desk user (from the same cookie the admin panel uses), or null. With REQUIRE_2FA=1 a user who has not
 * passed the 2-step check yet counts as logged out — unless `allowPending` (only the /2fa page itself uses that).
 */
export async function currentUser(allowPending = false): Promise<User | null> {
  const payload = await db()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  await loadPermissions(payload) // so every sync check (canPublish, buttons) after this uses the current role matrix
  if (!allowPending && twofaRequired() && !twofaValid((await cookies()).get(TWOFA_COOKIE)?.value, user.id)) return null
  return user as User
}
