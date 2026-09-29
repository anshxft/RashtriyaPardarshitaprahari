import type { CollectionConfig } from 'payload'
import { anyone, isEditor, isLoggedIn } from '../access'
import { slugField } from '../fields'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: { useAsTitle: 'title', group: 'Content' },
  access: { read: anyone, create: isLoggedIn, update: isEditor, delete: isEditor },
  fields: [{ name: 'title', type: 'text', required: true, localized: true }, slugField('title')],
}
