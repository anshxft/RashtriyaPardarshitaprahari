import type { CollectionAfterChangeHook } from 'payload'

/** Emails a short notice (no attachments / no personal files) to the configured inbox. Never blocks saving. */
export const notifyOnCreate =
  (label: string): CollectionAfterChangeHook =>
  async ({ doc, operation, req, collection }) => {
    if (operation !== 'create') return doc
    try {
      const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0 })
      const to = (settings as { notifyEmail?: string }).notifyEmail || process.env.NOTIFY_EMAIL
      if (!to) return doc
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      await req.payload.sendEmail({
        to,
        subject: `[Prahari] New ${label}: ${doc.subject || doc.purpose || doc.name || doc.referenceId}`,
        text: `A new ${label} was received (ref ${doc.referenceId}).\n\nOpen in admin: ${base}/admin/collections/${collection.slug}/${doc.id}\n\nPersonal data is only visible in the admin panel.`,
      })
    } catch (e) {
      req.payload.logger.error({ err: e, msg: `notify email failed for ${label}` })
    }
    return doc
  }

export const referenceId = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
