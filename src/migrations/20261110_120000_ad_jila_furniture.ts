import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { AD_JILA_FURNITURE_FRAME_JPG, AD_JILA_FURNITURE_JPG } from './assets/ad-jila-furniture'

const ADS = [
  { title: 'जिला फर्नीचर — शिवनगर, गाड़ीगांव, रांची', file: 'ad-jila-furniture.jpg', data: AD_JILA_FURNITURE_JPG, placements: ['home-top', 'article', 'epaper'] },
  { title: 'जिला फर्नीचर — वीडियो फ्रेम', file: 'ad-jila-furniture-video-frame.jpg', data: AD_JILA_FURNITURE_FRAME_JPG, placements: ['video'] },
]

/** Two advertisements for one advertiser: the regular ad and its TV-style L-frame for videos. Idempotent; never blocks start-up. */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const ad of ADS) {
    const found = await payload.find({ collection: 'ads', where: { title: { equals: ad.title } }, limit: 1, depth: 0, req })
    if (found.docs.length) continue
    try {
      const buf = Buffer.from(ad.data, 'base64')
      const img = await payload.create({ collection: 'media', locale: 'hi', data: { alt: ad.title, credit: 'विज्ञापन' } as never, file: { data: buf, mimetype: 'image/jpeg', name: ad.file, size: buf.length }, req })
      await payload.create({ collection: 'ads', data: { title: ad.title, image: img.id, placements: ad.placements, active: true } as never, req })
    } catch (e) {
      payload.logger.error({ err: e }, `ad migration: could not add "${ad.title}" — add it from Desk → Ads instead`)
    }
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  for (const ad of ADS) await payload.delete({ collection: 'ads', where: { title: { equals: ad.title } }, req })
}
