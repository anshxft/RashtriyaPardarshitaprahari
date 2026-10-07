import type { GlobalConfig } from 'payload'
import { isAdmin, isEditorField } from '../access'
import { validateMobile } from '../lib/contact'

/** The one place for contact details, Trust registration, Editor-in-Chief name, address and social links. */
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
            { name: 'descriptor', type: 'text', localized: true, admin: { description: 'Line under the site name (header, footer, e-paper masthead), e.g. “आधिकारिक ई-पेपर और डिजिटल न्यूज़”.' } },
            // The registered tagline lives in code (content/brand.ts) and cannot be edited here.
            { name: 'tagline', type: 'text', localized: true, admin: { hidden: true } },
            { name: 'trustName', type: 'text', localized: true },
            { name: 'trustRegistrationNo', type: 'text' },
            { name: 'editorName', type: 'text', localized: true, label: 'Editor-in-Chief name (प्रधान संपादक)' },
            { name: 'publisherName', type: 'text', localized: true },
            { name: 'registrationNote', type: 'textarea', localized: true, admin: { description: 'Any other legal / registration text for the footer' } },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'offices',
              type: 'array',
              labels: { singular: 'Office', plural: 'Offices' },
              admin: { description: 'Shown on the Contact page and in the footer. WhatsApp numbers also appear in the floating WhatsApp button.' },
              fields: [
                { name: 'title', type: 'text', localized: true, required: true, admin: { description: 'e.g. पंजीकृत कार्यालय' } },
                { name: 'address', type: 'textarea', localized: true },
                { name: 'unit', type: 'text', localized: true, admin: { description: 'Optional second line, e.g. ऑनलाइन समाचारपत्र एवं डिजिटल न्यूज़ प्रकोष्ठ …' } },
                {
                  name: 'phones',
                  type: 'array',
                  labels: { singular: 'Number', plural: 'Numbers' },
                  fields: [
                    { name: 'number', type: 'text', required: true, validate: validateMobile },
                    { name: 'kind', type: 'select', defaultValue: 'both', options: [{ label: 'WhatsApp + Call', value: 'both' }, { label: 'WhatsApp only', value: 'whatsapp' }, { label: 'Call only', value: 'call' }] },
                  ],
                },
              ],
            },
            { name: 'whatsappMessage', type: 'text', localized: true, admin: { description: 'Pre-filled text when a visitor opens WhatsApp from the site.' } },
            { name: 'whatsappButton', type: 'checkbox', defaultValue: true, label: 'Show the floating WhatsApp button on every page' },
            { name: 'address', type: 'textarea', localized: true, admin: { description: 'Old single address (used only when no offices are listed above).' } },
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
          label: 'Video watermark',
          fields: [
            {
              name: 'videoWatermark',
              type: 'group',
              admin: { description: 'Set once. Applied automatically to every uploaded video (the original file is kept untouched).' },
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                { name: 'position', type: 'select', defaultValue: 'tr', options: [{ label: 'Top right (default)', value: 'tr' }, { label: 'Top left', value: 'tl' }, { label: 'Bottom right', value: 'br' }, { label: 'Bottom left', value: 'bl' }] },
                { name: 'sizePercent', type: 'number', defaultValue: 14, min: 5, max: 30, admin: { description: 'Logo width as % of the video width' } },
                { name: 'opacity', type: 'number', defaultValue: 90, min: 20, max: 100, admin: { description: 'Logo opacity in %' } },
                { name: 'marginPercent', type: 'number', defaultValue: 2.5, min: 0, max: 10, admin: { description: 'Distance from the edge, as % of the video width' } },
                { name: 'logo', type: 'upload', relationTo: 'media', admin: { description: 'Optional PNG with transparent background. Blank = the official round logo.' } },
              ],
            },
            { name: 'aiVoiceNote', type: 'checkbox', defaultValue: false, label: 'Show “AI voice / कृत्रिम आवाज़” note under videos that use the synthetic female voice' },
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
