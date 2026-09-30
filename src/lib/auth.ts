import { headers } from 'next/headers'
import type { User } from '@/payload-types'
import { db } from './data'

/** The logged-in admin/desk user (from the same cookie the admin panel uses), or null. */
export async function currentUser(): Promise<User | null> {
  const { user } = await (await db()).auth({ headers: await headers() })
  return (user as User | null) ?? null
}
