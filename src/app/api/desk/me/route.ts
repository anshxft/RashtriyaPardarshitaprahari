import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { allowed, loadPermissions } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/** Tiny "may I show staff tools?" check for public pages (they are cached, so they ask the browser-side). */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ download: false }, { headers: { 'cache-control': 'private, no-store' } })
  await loadPermissions(await db())
  return NextResponse.json({ download: allowed(user, 'download') }, { headers: { 'cache-control': 'private, no-store' } })
}
