import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor } from '../access'

/** Citizen uploads. Never public: only editors/admins can read; created only by server-side form handlers. */
export const PrivateFiles: CollectionConfig = {
  slug: 'private-files',
  admin: { group: 'Inbox', description: 'Files attached by citizens. Not publicly accessible.' },
  access: { read: isEditor, create: () => false, update: isEditor, delete: isAdmin },
  upload: { mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
  fields: [{ name: 'note', type: 'text' }],
}
