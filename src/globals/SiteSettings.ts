import type { GlobalConfig } from 'payload'
import { isAdmin, isEditorField } from '../access'

/** The one place for contact details, Trust registration, editor name, address and social links. */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Admin' },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'siteName', type: 'text', localized: true, required: true },
            { name: 'tagline', type: 'text', localized: true },
            { name: 'trustName', type: 'text', localized: true },
            { name: 'trustRegistrationNo', type: 'text' },
            { name: 'editorName', type: 'text', localized: true, admin: { description: 'Editor / Editor-in-chief' } },
            { name: 'publisherName', type: 'text', localized: true },
            { name: 'registrationNote', type: 'textarea', localized: true, admin: { description: 'Any other legal / registration text for the footer' } },
          ],
        },
        {
          label: 'Contact',
          fields: [
            { name: 'address', type: 'textarea', localized: true },
            { name: 'email', type: 'email' },
            { name: 'phone', type: 'text' },
            { name: 'whatsapp', type: 'text' },
            {
              name: 'grievanceOfficer',
              type: 'group',
              fields: [
                { name: 'name', type: 'text', localized: true },
                { name: 'email', type: 'email' },
                { name: 'phone', type: 'text' },
              ],
            },
            {
              name: 'notifyEmail',
              type: 'email',
              access: { read: isEditorField },
              admin: { description: 'New submissions / appointments / contact messages are emailed here (falls back to NOTIFY_EMAIL env).' },
            },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'social',
              type: 'group',
              fields: ['facebook', 'x', 'youtube', 'instagram', 'whatsappChannel', 'telegram'].map((name) => ({ name, type: 'text' as const })),
            },
          ],
        },
        {
          label: 'Future slots',
          fields: [
            { name: 'adsEnabled', type: 'checkbox', defaultValue: false, admin: { description: 'Placeholder only — ad slots render nothing until built.' } },
            { name: 'donationsEnabled', type: 'checkbox', defaultValue: false, admin: { description: 'Placeholder only — not built yet.' } },
          ],
        },
      ],
    },
  ],
}
