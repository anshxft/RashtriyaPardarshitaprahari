import type { CollectionConfig } from 'payload'
import { canPublish, isEditor } from '../access'
import { STATE_LIST } from '../content/states'
import { slugField } from '../fields'
import { siteUrl } from '../lib/paths'

/** Rank order for the public "हमारी टीम" page. */
export const TIERS = [
  { value: 'editor-in-chief', hi: 'प्रधान संपादक', en: 'Editor-in-Chief' },
  { value: 'editorial', hi: 'संपादकीय टीम', en: 'Editorial team' },
  { value: 'state-bureau', hi: 'राज्य ब्यूरो', en: 'State bureau' },
  { value: 'assistant-bureau', hi: 'सहायक ब्यूरो', en: 'Assistant bureau' },
  { value: 'special-correspondent', hi: 'विशेष संवाददाता', en: 'Special correspondents' },
  { value: 'reporter', hi: 'संवाददाता', en: 'Reporters' },
  { value: 'photographer', hi: 'फोटोग्राफर', en: 'Photographers' },
  { value: 'other', hi: 'अन्य', en: 'Others' },
] as const
export type Tier = (typeof TIERS)[number]['value']

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: 'Team member', plural: 'Team (हमारी टीम)' },
  admin: {
    useAsTitle: 'name',
    group: 'Team',
    defaultColumns: ['name', 'designation', 'tier', 'state', 'district', '_status'],
    listSearchableFields: ['name', 'designation', 'idNumber', 'district', 'bureau'],
    description: 'Save as draft → click Preview → then Publish. Only Editors/Admins can add or change profiles.',
    preview: (doc) => `${siteUrl()}/hi/team/preview/${doc.id}`,
  },
  versions: { drafts: true, maxPerDoc: 15 },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    // Profiles go live only through an Editor/Admin who has publish rights.
    beforeChange: [
      ({ data, req }) => {
        if (req.user && data._status === 'published' && !canPublish(req)) data._status = 'draft'
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    slugField('name'),
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'designation', type: 'text', required: true, localized: true, admin: { description: 'As shown publicly, e.g. "राज्य ब्यूरो प्रमुख, बिहार"' } },
    {
      name: 'tier',
      type: 'select',
      required: true,
      defaultValue: 'reporter',
      index: true,
      admin: { description: 'Decides the group and the order on the Team page.' },
      options: TIERS.map((t) => ({ label: `${t.hi} / ${t.en}`, value: t.value })),
    },
    { name: 'workArea', type: 'text', localized: true, admin: { description: 'कार्यक्षेत्र, e.g. "पटना और आसपास के ज़िले"' } },
    { name: 'state', type: 'select', index: true, options: STATE_LIST.map((s) => ({ label: `${s.hi} / ${s.value}`, value: s.value })) },
    { name: 'district', type: 'text', index: true },
    { name: 'bureau', type: 'text', localized: true, index: true, admin: { description: 'Bureau / office' } },
    { name: 'idNumber', type: 'text', index: true, admin: { description: 'Press / ID card number' } },
    { name: 'bio', type: 'textarea', localized: true },
    { name: 'experience', type: 'textarea', localized: true, admin: { description: 'Experience / specialisation (optional)' } },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'publishContact',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show email / phone publicly',
      admin: { description: 'Off by default. Contact details are shown on the site only if this is ticked.' },
    },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Lower = earlier within the same group.' } },
    { name: 'demoContent', type: 'checkbox', index: true, admin: { position: 'sidebar', description: 'Sample profile (removed by npm run demo:remove)' } },
  ],
}
