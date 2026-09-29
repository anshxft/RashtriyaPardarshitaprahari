import type { CollectionConfig } from 'payload'
import { anyone, isEditor, isLoggedIn } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content', description: 'Images and public documents (PDF). Always fill credit + licence for third-party files.' },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isEditor },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumb', width: 400, height: 225, formatOptions: { format: 'webp', options: { quality: 75 } } },
      { name: 'card', width: 800, height: 450, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'hero', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    adminThumbnail: 'thumb',
  },
  fields: [
    { name: 'alt', type: 'text', required: true, localized: true },
    { name: 'credit', type: 'text', admin: { description: 'e.g. "Photo: Jane Doe / Unsplash"' } },
    { name: 'creditUrl', type: 'text' },
    { name: 'license', type: 'text', admin: { description: 'e.g. CC BY-SA 4.0, Unsplash License, Own' } },
  ],
}
