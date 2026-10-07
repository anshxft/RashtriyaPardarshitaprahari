import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { isAdmin, isAdminField, isLoggedIn } from '../access'
import { passwordProblem } from '../lib/security'
import { audit } from '../lib/audit'

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
    afterLogin: [({ req, user }) => audit(req.payload, user as never, { action: 'login', collectionSlug: 'users' }, req.headers)],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === 'update' && previousDoc?.role !== doc.role)
          await audit(req.payload, req.user as never, { action: 'role-change', collectionSlug: 'users', title: doc.email, fromStatus: previousDoc?.role, toStatus: doc.role }, req.headers, req)
        return doc
      },
    ],
    beforeValidate: [
      ({ data }) => {
        // Strong passwords for everyone, on create, change and reset.
        const bad = typeof data?.password === 'string' ? passwordProblem(data.password) : null
        if (bad) throw new APIError(bad, 400, undefined, true)
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // An Admin un-ticking '2-step verification' resets it: the old secret is dropped, the person enrols again.
        if (operation === 'update' && data.totpEnabled === false && originalDoc?.totpEnabled) Object.assign(data, { totpSecret: null, totpLast: 0, totpFails: 0, totpLockUntil: null })
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
        { label: 'Admin / प्रधान संपादक (Super Admin — all rights)', value: 'admin' },
        { label: 'Senior Editor / वरिष्ठ संपादक (approve, re-publish, restore)', value: 'senior' },
        { label: 'Editor / संपादक (reviews & publishes)', value: 'editor' },
        { label: 'Reporter / रिपोर्टर (drafts only)', value: 'reporter' },
      ],
    },
    {
      name: 'canPublish',
      type: 'checkbox',
      defaultValue: true,
      label: 'Can publish (Editors only)',
      admin: { description: 'Untick to stop this Editor from publishing. Admins always can. Reporters can never publish.', position: 'sidebar' },
      access: { update: isAdminField, create: isAdminField },
    },
    {
      name: 'totpEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: '2-step verification set up',
      admin: { description: 'Untick (Admin only) to reset this person’s authenticator app — they will scan a new QR at next login.', position: 'sidebar' },
      access: { update: isAdminField, create: () => false },
    },
    // Internal 2-step data: never readable or writable through the API, only by server code.
    { name: 'totpSecret', type: 'text', admin: { hidden: true }, access: { read: () => false, create: () => false, update: () => false } },
    { name: 'totpLast', type: 'number', admin: { hidden: true }, access: { read: () => false, create: () => false, update: () => false } },
    { name: 'totpFails', type: 'number', admin: { hidden: true }, access: { read: () => false, create: () => false, update: () => false } },
    { name: 'totpLockUntil', type: 'date', admin: { hidden: true }, access: { read: () => false, create: () => false, update: () => false } },
  ],
}
