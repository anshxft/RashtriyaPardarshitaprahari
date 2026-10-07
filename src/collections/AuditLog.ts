import type { CollectionConfig } from 'payload'
import { allowed } from '../lib/permissions'

/**
 * Append-only audit trail. Nobody can create, edit or delete entries through the admin panel or the API —
 * only server code writes them (lib/audit.ts). Admins (and roles given "View audit log") can read and filter.
 */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Audit entry', plural: 'Audit log' },
  admin: {
    group: 'Admin',
    useAsTitle: 'summary',
    defaultColumns: ['createdAt', 'action', 'newsId', 'title', 'userName', 'role', 'fromStatus', 'toStatus'],
    description: 'हर ज़रूरी कार्रवाई का स्थायी रिकॉर्ड। इसे बदला या मिटाया नहीं जा सकता।',
  },
  access: {
    read: ({ req }) => allowed(req.user as never, 'auditLog'),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  timestamps: true,
  fields: [
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'summary', type: 'text' },
    { name: 'newsId', type: 'text', index: true },
    { name: 'articleId', type: 'number', index: true },
    { name: 'collectionSlug', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'url', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'userName', type: 'text' },
    { name: 'role', type: 'text' },
    { name: 'fromStatus', type: 'text' },
    { name: 'toStatus', type: 'text' },
    { name: 'reason', type: 'text' },
    { name: 'version', type: 'text' },
    { name: 'changedFields', type: 'text' },
    { name: 'ip', type: 'text' },
    { name: 'session', type: 'text', admin: { description: 'Short fingerprint of the login session (never the token itself).' } },
    { name: 'details', type: 'json' },
  ],
}
