import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '../access'
import { slugField } from '../fields'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: { useAsTitle: 'name', group: 'Content' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    { name: 'designation', type: 'text', localized: true },
    { name: 'bio', type: 'textarea', localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'user', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', description: 'Linked login (optional)' } },
  ],
}
