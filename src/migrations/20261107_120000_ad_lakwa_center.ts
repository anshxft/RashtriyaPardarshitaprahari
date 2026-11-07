import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { AD_LAKWA_CENTER_JPG } from './assets/ad-lakwa-center'

const TITLE = 'लकवा सेंटर — प्रभात मेडिकल, कपूरिया, धनबाद'

/**
 * New advertisement (same placements as the existing press ad: home page, inside stories, e-paper). Uploads the
 * artwork to media storage once. Idempotent; an upload failure is logged and never blocks the site from starting.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const found = await payload.find({ collection: 'ads', where: { title: { equals: TITLE } }, limit: 1, depth: 0, req })
  if (found.docs.length) return
  try {
    const buf = Buffer.from(AD_LAKWA_CENTER_JPG, 'base64')
    const img = await payload.create({
      collection: 'media',
      locale: 'hi',
      data: { alt: TITLE, credit: 'विज्ञापन' } as never,
      file: { data: buf, mimetype: 'image/jpeg', name: 'ad-lakwa-center-prabhat-medical.jpg', size: buf.length },
      req,
    })
    await payload.create({ collection: 'ads', data: { title: TITLE, image: img.id, placements: ['home-top', 'article', 'epaper'], active: true } as never, req })
  } catch (e) {
    payload.logger.error({ err: e }, 'ad migration: could not add the Lakwa Center ad — add it from Desk → Ads instead')
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'ads', where: { title: { equals: TITLE } }, req })
}
