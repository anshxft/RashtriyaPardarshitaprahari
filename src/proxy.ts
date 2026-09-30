import { NextResponse, type NextRequest } from 'next/server'
import { jwtUserId, TWOFA_COOKIE, twofaRequired, twofaValid } from '@/lib/security'

/**
 * 2-step gate (only when REQUIRE_2FA=1). Someone who has typed a correct password but not yet the authenticator code
 * can reach nothing but the /2fa page and logout — not the Desk, not the admin panel, not the REST API.
 */
const OPEN = /^\/(2fa|admin\/logout|api\/users\/(login|logout|me|refresh-token))(\/|$)/

export function proxy(req: NextRequest) {
  if (!twofaRequired()) return NextResponse.next()
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/')
  if (OPEN.test(pathname)) return NextResponse.next()

  const token = req.cookies.get('payload-token')?.value
  const bearer = /^(JWT|Bearer) /i.test(req.headers.get('authorization') || '')
  if (isApi && bearer) return NextResponse.json({ error: '2-step verification needed' }, { status: 401 }) // header tokens can't carry the 2FA cookie
  const uid = jwtUserId(token)
  if (!uid || twofaValid(req.cookies.get(TWOFA_COOKIE)?.value, uid)) return NextResponse.next() // not logged in (Payload handles it) or verified
  if (isApi) return NextResponse.json({ error: '2-step verification needed' }, { status: 401 })
  const to = req.nextUrl.clone()
  to.pathname = '/2fa'
  to.search = `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(to)
}

export const config = { matcher: ['/admin/:path*', '/desk/:path*', '/api/:path*', '/2fa'] }
