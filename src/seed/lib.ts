/** Shared helpers for the seed scripts (run with `payload run`). */
import config from '@payload-config'
import { getPayload, type CollectionSlug } from 'payload'

export const payload = await getPayload({ config })
export const log = (...a: unknown[]) => console.log('•', ...a)
export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

export async function findSlug(collection: CollectionSlug, slug: string) {
  const r = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
  return r.docs[0] as { id: number } | undefined
}

/** Create in Hindi, then add the English locale. Returns id (existing or new); an existing doc is left untouched. */
export async function bilingual(collection: CollectionSlug, slug: string, hi: Record<string, unknown>, en: (doc: any) => Record<string, unknown>) {
  const existing = await findSlug(collection, slug)
  if (existing) return existing.id
  const doc = await payload.create({ collection, locale: 'hi', data: { ...hi, slug } as never, draft: false })
  await payload.update({ collection, id: doc.id, locale: 'en', data: en(doc) as never, draft: false })
  return doc.id as number
}

/** Create if missing, otherwise overwrite the given fields in both languages. Use only for deliberate content migrations. */
export async function upsertBilingual(collection: CollectionSlug, slug: string, hi: Record<string, unknown>, en: Record<string, unknown>) {
  const existing = await findSlug(collection, slug)
  if (!existing) return bilingual(collection, slug, hi, () => en)
  await payload.update({ collection, id: existing.id, locale: 'hi', data: hi as never, draft: false })
  await payload.update({ collection, id: existing.id, locale: 'en', data: en as never, draft: false })
  return existing.id as number
}
