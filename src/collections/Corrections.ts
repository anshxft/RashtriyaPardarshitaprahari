import type { CollectionConfig } from 'payload'
import { anyone, isEditor } from '../access'

export const Corrections: CollectionConfig = {
  slug: 'corrections',
  admin: { useAsTitle: 'summary', defaultColumns: ['summary', 'article', 'type', 'date'], group: 'Content' },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  defaultSort: '-date',
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'correction',
      options: [
        { label: 'सुधार / Correction', value: 'correction' },
        { label: 'स्पष्टीकरण / Clarification', value: 'clarification' },
        { label: 'अपडेट / Update', value: 'update' },
      ],
    },
    { name: 'date', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'summary', type: 'textarea', required: true, localized: true, admin: { description: 'What was wrong and what was corrected' } },
  ],
}
