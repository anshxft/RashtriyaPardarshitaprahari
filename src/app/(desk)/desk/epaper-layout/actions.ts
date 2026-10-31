'use server'

import { revalidatePath } from 'next/cache'
import { canPublish } from '@/access'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import { clampItem, isManualLayout, MAX_PAGES, type ManualLayout } from '@/lib/epaper'

type Res = { ok: true } | { ok: false; error: string }
const DATE = /^\d{4}-\d{2}-\d{2}$/

async function editor() {
  const user = await currentUser()
  return user && canPublish({ user } as never) ? user : null
}

/** Save the hand-made layout for one edition (replaces the automatic one for that date). */
export async function saveEpaperLayoutAction(date: string, layout: ManualLayout): Promise<Res> {
  const user = await editor()
  if (!user) return { ok: false, error: 'ई-पेपर डिज़ाइन बदलने का अधिकार केवल संपादक / एडमिन को है' }
  if (!DATE.test(date) || !isManualLayout(layout)) return { ok: false, error: 'गलत डेटा' }
  const data: ManualLayout = { pages: layout.pages.slice(0, MAX_PAGES).map((p) => p.slice(0, 80).map((it) => clampItem({ ...it, ref: String(it.ref).slice(0, 60) }))) }
  const payload = await db()
  const cur = await payload.find({ collection: 'epaper-layouts', where: { date: { equals: date } }, limit: 1, depth: 0 })
  if (cur.docs[0]) await payload.update({ collection: 'epaper-layouts', id: cur.docs[0].id, data: { data, editedBy: user.name || user.email }, overrideAccess: true })
  else await payload.create({ collection: 'epaper-layouts', data: { date, data, editedBy: user.name || user.email }, overrideAccess: true })
  revalidatePath('/[lang]/epaper', 'layout')
  return { ok: true }
}

/** Go back to the automatic layout for this date. */
export async function resetEpaperLayoutAction(date: string): Promise<Res> {
  const user = await editor()
  if (!user) return { ok: false, error: 'अधिकार नहीं' }
  if (!DATE.test(date)) return { ok: false, error: 'गलत तारीख' }
  await (await db()).delete({ collection: 'epaper-layouts', where: { date: { equals: date } }, overrideAccess: true })
  revalidatePath('/[lang]/epaper', 'layout')
  return { ok: true }
}
