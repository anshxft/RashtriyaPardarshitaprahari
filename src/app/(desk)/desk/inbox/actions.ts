'use server'

import { revalidatePath } from 'next/cache'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/data'

export type InboxKind = 'submissions' | 'contact-messages' | 'appointments'
const KINDS: InboxKind[] = ['submissions', 'contact-messages', 'appointments']

/** Change a reader message's status / internal note. Inbox access rules apply (editors and admins). */
export async function setInboxAction(kind: InboxKind, id: number, data: { status?: string; internalNotes?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await currentUser()
    if (!user) return { ok: false, error: 'लॉगिन ज़रूरी है' }
    if (!KINDS.includes(kind)) return { ok: false, error: 'गलत सेक्शन' }
    const payload = await db()
    await payload.update({ collection: kind, id, data: { ...(data.status ? { status: data.status } : {}), ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes.slice(0, 2000) } : {}) } as never, user, overrideAccess: false })
    revalidatePath('/desk/inbox')
    return { ok: true }
  } catch (e) {
    const m = (e as Error).message || ''
    return { ok: false, error: m.includes('not allowed') || (e as Error).name === 'Forbidden' ? 'यह बदलाव करने का अधिकार आपके पास नहीं है (एडिटर/एडमिन)' : m || 'कुछ गड़बड़ हुई' }
  }
}
