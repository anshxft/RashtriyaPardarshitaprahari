import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '../access'
import { slugField } from '../fields'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'parent', 'menuOrder'], group: 'Content' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  defaultSort: 'menuOrder',
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'description', type: 'textarea', localized: true },
    { name: 'parent', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar', description: 'Set for sub-categories' } },
    { name: 'menuOrder', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Main menu position (lower = first). Sub-categories are ordered the same way.' } },
    { name: 'showInMenu', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'menuGroup',
      type: 'select',
      admin: { position: 'sidebar', description: 'Column in the desktop mega-menu' },
      options: [
        { label: 'News / खबरें', value: 'news' },
        { label: 'Accountability / जवाबदेही', value: 'accountability' },
        { label: 'Public interest / जनहित', value: 'public' },
        { label: 'People & Ideas / जन और विचार', value: 'people' },
      ],
    },
  ],
}
