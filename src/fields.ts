import type { Field } from 'payload'
import { slugify } from './lib/slugify'

/** Unique slug, auto-filled from `from` (English value preferred, else Hindi) when left blank. */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'URL. Blank = auto from title. Roman letters recommended (e.g. kisan-mandi-bhav).' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (value) return slugify(value)
        const src = data?.[from]
        const text = typeof src === 'string' ? src : src?.en || src?.hi
        return text ? slugify(text) : value
      },
    ],
  },
})
