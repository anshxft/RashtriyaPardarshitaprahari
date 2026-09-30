import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isLoggedIn } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', defaultColumns: ['name', 'email', 'role'], group: 'Admin' },
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000, tokenExpiration: 8 * 60 * 60 },
  access: {
    read: isLoggedIn,
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin' || { id: { equals: req.user?.id } },
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // The very first account (created via /admin/create-first-user) becomes Admin.
        if (operation === 'create' && (await req.payload.count({ collection: 'users' })).totalDocs === 0) data.role = 'admin'
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'reporter',
      access: { update: isAdminField, create: isAdminField },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor (reviews & publishes)', value: 'editor' },
        { label: 'Reporter (drafts only)', value: 'reporter' },
      ],
    },
  ],
}
