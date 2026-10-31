import { NextResponse, type NextRequest } from 'next/server'
import { jwtUserId, TWOFA_COOKIE, twofaRequired, twofaValid } from '@/lib/security'

/**
 * 2-step gate (only when REQUIRE_2FA=1). Someone who has typed a correct password but not yet the authenticator code
 * can reach nothing but the /2fa page and logout — not the Desk, not the admin panel, not the REST API.
 */
const OPEN = /^\/(2fa|admin\/logout|api\/users\/(login|logout|me|refresh-token))(\/|$)/

/** An in-app (client-side) navigation request. Sending these across to another part of the app hangs the browser. */
const isRsc = (req: NextRequest) => req.headers.get('rsc') === '1' || req.headers.has('next-router-state-tree') || req.nextUrl.searchParams.has('_rsc')
/** A non-RSC answer to an RSC request makes Next.js reload the page normally, so the redirect below then works. */
const hardReload = () => new NextResponse('', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Our own login page (/login) replaces Payload's: it has the show-password button and never hangs on the 2-step check.
  if (pathname === '/admin/login' && req.method === 'GET') {
    if (isRsc(req)) return hardReload()
    const to = req.nextUrl.clone()
    to.pathname = '/login'
    to.search = `?next=${encodeURIComponent(req.nextUrl.searchParams.get('redirect') || '/admin')}`
    return NextResponse.redirect(to)
  }
  if (!twofaRequired()) return NextResponse.next()
  const isApi = pathname.startsWith('/api/')
  if (OPEN.test(pathname)) return NextResponse.next()

  const token = req.cookies.get('payload-token')?.value
  const bearer = /^(JWT|Bearer) /i.test(req.headers.get('authorization') || '')
  if (isApi && bearer) return NextResponse.json({ error: '2-step verification needed' }, { status: 401 }) // header tokens can't carry the 2FA cookie
  const uid = jwtUserId(token)
  if (!uid || twofaValid(req.cookies.get(TWOFA_COOKIE)?.value, uid)) return NextResponse.next() // not logged in (Payload handles it) or verified
  if (isApi) return NextResponse.json({ error: '2-step verification needed' }, { status: 401 })
  if (isRsc(req)) return hardReload()
  const to = req.nextUrl.clone()
  to.pathname = '/2fa'
  to.search = `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(to)
}

export const config = { matcher: ['/admin/:path*', '/desk/:path*', '/api/:path*', '/2fa'] }
