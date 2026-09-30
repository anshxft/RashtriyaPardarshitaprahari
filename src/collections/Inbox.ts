import type { CollectionConfig, Field } from 'payload'
import { isAdmin, isEditor } from '../access'
import { appointmentFields, contactFields, submissionFields, type FormField } from '../content/forms'
import { notifyOnCreate } from '../lib/notify'

const toField = (f: FormField): Field =>
  f.type === 'textarea' ? { name: f.name, type: 'textarea', label: f.label.en } : { name: f.name, type: 'text', label: f.label.en }

const meta = (statuses: string[]): Field[] => [
  { name: 'referenceId', type: 'text', index: true, admin: { position: 'sidebar', readOnly: true } },
  {
    name: 'status',
    type: 'select',
    defaultValue: statuses[0],
    options: statuses.map((s) => ({ label: s, value: s })),
    admin: { position: 'sidebar' },
  },
  { name: 'internalNotes', type: 'textarea', admin: { position: 'sidebar' } },
  { name: 'consentAt', type: 'date', admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
  { name: 'lang', type: 'text', admin: { position: 'sidebar', readOnly: true } },
]

// Created only by the public form handlers (server-side, overrideAccess). Never publicly readable.
const inboxAccess = { read: isEditor, create: () => false, update: isEditor, delete: isAdmin }

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: { singular: 'Citizen submission', plural: 'Citizen submissions' },
  admin: { useAsTitle: 'subject', defaultColumns: ['subject', 'issueType', 'state', 'status', 'createdAt'], group: 'Inbox' },
  access: inboxAccess,
  hooks: { afterChange: [notifyOnCreate('citizen submission')] },
  fields: [
    { name: 'anonymous', type: 'checkbox', label: 'Sender asked to remain anonymous (never publish identity)' },
    ...submissionFields.map(toField),
    { name: 'files', type: 'upload', relationTo: 'private-files', hasMany: true },
    ...meta(['new', 'verifying', 'story-in-progress', 'published', 'closed', 'spam']),
  ],
}

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  admin: { useAsTitle: 'purpose', defaultColumns: ['name', 'purpose', 'preferredDate', 'status'], group: 'Inbox' },
  access: inboxAccess,
  hooks: { afterChange: [notifyOnCreate('appointment request')] },
  fields: [...appointmentFields.map(toField), ...meta(['new', 'confirmed', 'rescheduled', 'declined', 'done'])],
}

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  admin: { useAsTitle: 'subject', defaultColumns: ['subject', 'name', 'topic', 'status', 'createdAt'], group: 'Inbox' },
  access: inboxAccess,
  hooks: { afterChange: [notifyOnCreate('contact message')] },
  fields: [...contactFields.map(toField), ...meta(['new', 'replied', 'closed', 'spam'])],
}
