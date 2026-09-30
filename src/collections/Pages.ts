import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '../access'
import { slugField } from '../fields'

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: { maxPerDoc: 20 },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'legalReviewPending'], group: 'Content' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional photo (e.g. the Editor-in-Chief for the message page)' } },
    { name: 'content', type: 'richText', localized: true },
    {
      name: 'legalReviewPending',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show "Draft – to be reviewed by a lawyer" notice',
      admin: { position: 'sidebar' },
    },
    { name: 'showInFooter', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'showOnHome', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Feature this page as a block on the home page (used for the Editor-in-Chief’s message).' } },
  ],
}
