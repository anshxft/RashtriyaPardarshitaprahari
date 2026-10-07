import type { CollectionConfig, Where } from 'payload'
import { canPublish, isEditor, isLoggedIn } from '../access'
import { slugField } from '../fields'

/** Public sees only published videos whose time has come (same rule as articles = scheduled publishing). */
export const publicVideoWhere = (): Where => ({
  and: [{ _status: { equals: 'published' } }, { publishedAt: { less_than_equal: new Date().toISOString() } }],
})

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'processing', '_status', 'publishedAt'],
    description: 'Tip: the Desk (/desk/video) uploads videos in a few clicks; the logo is added automatically.',
  },
  versions: { drafts: true, maxPerDoc: 15 },
  access: {
    read: ({ req }) => (req.user ? true : publicVideoWhere()),
    create: isLoggedIn,
    update: ({ req }) => (!req.user ? false : canPublish(req) || { createdBy: { equals: req.user.id } }),
    delete: isEditor,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user) data.createdBy = req.user.id
        // Reporters can upload, but only Editors/Admins can publish.
        if (req.user && !canPublish(req) && data._status === 'published') data._status = 'draft'
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'description', type: 'textarea', localized: true },
    { name: 'location', type: 'text', localized: true },
    { name: 'eventDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, description: 'Date of the event (not the publish time)' } },
    { name: 'reporterName', type: 'text', localized: true },
    { name: 'reporter', type: 'relationship', relationTo: 'team-members' },
    { name: 'category', type: 'relationship', relationTo: 'categories', index: true },
    { name: 'thumbnail', type: 'upload', relationTo: 'media', admin: { description: 'Optional. Blank = a frame from the video is used.' } },
    {
      type: 'collapsible',
      label: 'Files (managed automatically)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'originalUrl', type: 'text', admin: { readOnly: true, description: 'The untouched upload. Kept separately; never overwritten.' } },
        { name: 'processedUrl', type: 'text', admin: { readOnly: true, description: 'Logo-watermarked copy that is published.' } },
        { name: 'posterUrl', type: 'text', admin: { readOnly: true } },
        {
          name: 'processing',
          type: 'select',
          defaultValue: 'queued',
          index: true,
          options: ['queued', 'processing', 'ready', 'failed'],
          admin: { readOnly: true },
        },
        { name: 'processError', type: 'text', admin: { readOnly: true } },
        { name: 'durationSec', type: 'number', admin: { readOnly: true } },
        { name: 'sizeBytes', type: 'number', admin: { readOnly: true } },
        { name: 'width', type: 'number', admin: { readOnly: true } },
        { name: 'height', type: 'number', admin: { readOnly: true } },
        { name: 'hasAudio', type: 'checkbox', admin: { readOnly: true } },
        { name: 'socialUrl', type: 'text', admin: { readOnly: true, description: 'Social-Ready 1920×1080 (headline, News ID, date, reporter, end screen)' } },
        { name: 'verticalUrl', type: 'text', admin: { readOnly: true, description: 'Social-Ready vertical 1080×1920' } },
        { name: 'flashUrl', type: 'text', admin: { readOnly: true, description: 'Final video with Flash strip + voice' } },
        {
          name: 'previousFiles',
          type: 'array',
          admin: { readOnly: true, description: 'Replaced videos are kept here (never deleted).' },
          fields: [
            { name: 'originalUrl', type: 'text' },
            { name: 'processedUrl', type: 'text' },
            { name: 'replacedAt', type: 'date' },
            { name: 'by', type: 'text' },
          ],
        },
      ],
    },
    { name: 'article', type: 'relationship', relationTo: 'articles', index: true, admin: { position: 'sidebar', readOnly: true, description: 'The master news record (News ID, QR, publish state) this video belongs to.' } },
    { name: 'publishedAt', type: 'date', index: true, admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Future date = scheduled.' } },
    { name: 'demoContent', type: 'checkbox', index: true, admin: { position: 'sidebar' } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  ],
}
