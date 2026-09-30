import type { Field } from 'payload'
import { slugify } from './lib/slugify'

/**
 * Unique slug, auto-filled from `from` (English value preferred, else Hindi) when left blank.
 * If the slug is already taken by another document, "-2", "-3"… is appended, so two stories with the same
 * headline never collide.
 */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'URL. Blank = auto from title. Roman letters recommended (e.g. kisan-mandi-bhav).' },
  hooks: {
    beforeValidate: [
      async ({ value, data, req, originalDoc, collection }) => {
        let base = value ? slugify(value) : ''
        if (!base) {
          const src = data?.[from]
          const text = typeof src === 'string' ? src : src?.en || src?.hi
          base = text ? slugify(text) : ''
        }
        if (!base) return value
        if (originalDoc?.slug === base) return base
        let slug = base
        for (let n = 2; n < 200 && collection; n++) {
          const taken = await req.payload.count({
            collection: collection.slug,
            where: { slug: { equals: slug }, ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}) },
            req,
          })
          if (!taken.totalDocs) break
          slug = `${base}-${n}`
        }
        return slug
      },
    ],
  },
})
