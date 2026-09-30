import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '../access'

export const BreakingNews: CollectionConfig = {
  slug: 'breaking-news',
  labels: { singular: 'Breaking news', plural: 'Breaking news' },
  admin: { useAsTitle: 'text', defaultColumns: ['text', 'active', 'expiresAt'], group: 'Content' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  defaultSort: '-createdAt',
  fields: [
    { name: 'text', type: 'text', required: true, localized: true },
    { name: 'link', type: 'text', admin: { description: 'Optional, e.g. /hi/news/some-slug' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'expiresAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'demoContent', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
}
