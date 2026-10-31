import { NextResponse } from 'next/server'
import { getFlash } from '@/lib/flash'
import { isLang } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * Live Breaking Flash list as JSON: GET /api/flash?lang=hi (or en). Used by the website card (it re-reads this every
 * minute, so edits / pauses / removals reach readers without a reload) and ready for the future mobile app.
 */
export async function GET(req: Request) {
  const l = new URL(req.url).searchParams.get('lang') || 'hi'
  const lang = isLang(l) ? l : 'hi'
  const items = await getFlash(lang, 10, new URL(req.url).searchParams.get('kind') === 'popup' ? 'popup' : 'ticker')
  return NextResponse.json({ items, at: new Date().toISOString() }, { headers: { 'cache-control': 'public, s-maxage=20, stale-while-revalidate=40' } })
}
