import { cookies, headers } from 'next/headers'
import type { User } from '@/payload-types'
import { db } from './data'
import { TWOFA_COOKIE, twofaRequired, twofaValid } from './security'

/**
 * The logged-in admin/desk user (from the same cookie the admin panel uses), or null. With REQUIRE_2FA=1 a user who has not
 * passed the 2-step check yet counts as logged out — unless `allowPending` (only the /2fa page itself uses that).
 */
export async function currentUser(allowPending = false): Promise<User | null> {
  const { user } = await (await db()).auth({ headers: await headers() })
  if (!user) return null
  if (!allowPending && twofaRequired() && !twofaValid((await cookies()).get(TWOFA_COOKIE)?.value, user.id)) return null
  return user as User
}
