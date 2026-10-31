import type { CollectionConfig } from 'payload'
import { canPublish } from '../access'

/**
 * Hand-made e-paper page layout for one edition date (Desk → ई-पेपर डिज़ाइनर). When present, the e-paper uses these
 * positions instead of the automatic packer. `data` = { pages: [[{ ref, col, span, y, h, scale }]] } (A3 page px).
 */
export const EpaperLayouts: CollectionConfig = {
  slug: 'epaper-layouts',
  labels: { singular: 'E-paper layout', plural: 'E-paper layouts' },
  admin: { group: 'Admin', useAsTitle: 'date', defaultColumns: ['date', 'updatedAt'] },
  access: { read: () => true, create: ({ req }) => canPublish(req), update: ({ req }) => canPublish(req), delete: ({ req }) => canPublish(req) },
  fields: [
    { name: 'date', type: 'text', required: true, unique: true, index: true },
    { name: 'data', type: 'json', required: true },
    { name: 'editedBy', type: 'text' },
  ],
}
