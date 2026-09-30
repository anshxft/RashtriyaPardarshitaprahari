'use server'

import { revalidatePath } from 'next/cache'
import { canPublish } from '@/access'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'
import type { Layout } from '@/lib/layout'

/** Editors only. Returns an error string instead of throwing so the board can show it. */
async function editor() {
  const user = await currentUser()
  if (!user || !canPublish({ user } as never)) return null
  return user
}

const ALLOWED: (keyof Layout)[] = ['columns', 'bodyScale', 'epaperPage', 'epaperOrder', 'autoFit', 'inEpaper', 'template', 'headlineSize', 'headlineInk', 'subheadlineSize', 'subheadlineInk', 'reporterSize', 'reporterInk', 'align', 'photoSize', 'photoPos']

/** "Fix layout": merge a small layout patch into one story. Never touches the story's text, date or URL. */
export async function saveLayoutAction(id: number, patch: Layout): Promise<{ ok: boolean; error?: string }> {
  const user = await editor()
  if (!user) return { ok: false, error: 'Not allowed' }
  const clean: Record<string, unknown> = {}
  for (const k of ALLOWED) if (k in patch) clean[k] = patch[k] === undefined ? null : patch[k]
  const payload = await db()
  const cur = await payload.findByID({ collection: 'articles', id, depth: 0, overrideAccess: false, user })
  await payload.update({ collection: 'articles', id, data: { layout: { ...(cur.layout || {}), ...clean } } as never, overrideAccess: false, user })
  revalidatePath('/[lang]/epaper/[date]', 'page')
  return { ok: true }
}

/** Save a new reading order for a whole edition (ids in the order the editor wants). */
export async function reorderAction(ids: number[]): Promise<{ ok: boolean; error?: string }> {
  const user = await editor()
  if (!user) return { ok: false, error: 'Not allowed' }
  const payload = await db()
  for (const [i, id] of ids.entries()) {
    const cur = await payload.findByID({ collection: 'articles', id, depth: 0, overrideAccess: false, user })
    if (cur.layout?.epaperOrder === (i + 1) * 10) continue
    await payload.update({ collection: 'articles', id, data: { layout: { ...(cur.layout || {}), epaperOrder: (i + 1) * 10 } } as never, overrideAccess: false, user })
  }
  revalidatePath('/[lang]/epaper/[date]', 'page')
  return { ok: true }
}
