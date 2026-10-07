import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'

/** Every share attempt: platform, success / failure, the platform's answer. Written by the server only. */
export const ShareLog: CollectionConfig = {
  slug: 'share-log',
  labels: { singular: 'Share attempt', plural: 'Share log' },
  admin: { group: 'Admin', useAsTitle: 'platform', defaultColumns: ['createdAt', 'platform', 'status', 'newsId', 'title', 'by'] },
  access: { read: isEditor, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', index: true },
    { name: 'newsId', type: 'text', index: true },
    { name: 'title', type: 'text' },
    { name: 'kind', type: 'select', options: ['news', 'video', 'epaper'], defaultValue: 'news' },
    { name: 'platform', type: 'text', required: true, index: true },
    { name: 'status', type: 'select', required: true, index: true, options: ['queued', 'success', 'failed'] },
    { name: 'auto', type: 'checkbox', admin: { description: 'Sent automatically on publish' } },
    { name: 'postUrl', type: 'text' },
    { name: 'response', type: 'text' },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'by', type: 'text' },
    { name: 'item', type: 'json', admin: { description: 'What was posted (headline, text, link, media)' } },
  ],
}
