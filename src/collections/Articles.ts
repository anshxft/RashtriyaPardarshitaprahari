import { APIError, type CollectionConfig, type Where } from 'payload'
import { canPublish, isEditor, isEditorField } from '../access'
import { slugField } from '../fields'

export const FORMATS = [
  { label: 'News / समाचार', value: 'news' },
  { label: 'Fact Check / फैक्ट चेक', value: 'factcheck' },
  { label: 'Investigation / जांच', value: 'investigation' },
  { label: 'Direct Question / सीधा सवाल', value: 'question' },
  { label: 'Complaint Tracker / शिकायत से समाधान', value: 'tracker' },
  { label: 'Documents Speak / दस्तावेज़ बोलते हैं', value: 'documents' },
  { label: 'Opinion / विचार', value: 'opinion' },
] as const

const is = (...formats: string[]) => (data: Record<string, unknown>) => formats.includes(data?.format as string)

/** Public visitors only ever see published articles whose publish time has arrived (= scheduled publishing). */
export const publicArticleWhere = (): Where => ({
  and: [{ _status: { equals: 'published' } }, { publishedAt: { less_than_equal: new Date().toISOString() } }],
})

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'format', 'category', 'reviewStatus', '_status', 'publishedAt'],
    group: 'Content',
    description:
      'Reporters save drafts and set Review status → "Submitted". Only Editors/Admins can publish. Future publish date = scheduled.',
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: ({ req }) => (req.user ? true : publicArticleWhere()),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => (!req.user ? false : canPublish(req) || { createdBy: { equals: req.user.id } }),
    delete: isEditor,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user) data.createdBy = req.user.id
        // Defamation safety: nothing goes live without Editor/Admin approval.
        // No req.user = trusted server code (seed scripts); REST/admin always has a user here because create/update require login.
        if (req.user && !canPublish(req) && data._status === 'published') {
          throw new APIError('Reporters cannot publish. Save as draft and set Review status to "Submitted".', 403, null, true)
        }
        if (canPublish(req) && data._status === 'published') data.reviewStatus = 'approved'
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'excerpt', type: 'textarea', localized: true, admin: { description: '1–2 line summary for cards and SEO' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Story',
          fields: [
            { name: 'content', type: 'richText', localized: true },
            {
              name: 'sources',
              type: 'array',
              admin: { description: 'Sources shown in the "Sources & documents" box' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Fact check',
          admin: { condition: is('factcheck') },
          fields: [
            {
              name: 'factCheck',
              type: 'group',
              fields: [
                { name: 'claim', type: 'textarea', localized: true, admin: { description: 'The claim being checked' } },
                { name: 'claimedBy', type: 'text', localized: true, admin: { description: 'Where / by whom the claim was made' } },
                {
                  name: 'verdict',
                  type: 'select',
                  options: [
                    { label: 'सही / True', value: 'true' },
                    { label: 'गलत / False', value: 'false' },
                    { label: 'भ्रामक / Misleading', value: 'misleading' },
                    { label: 'अपुष्ट / Unverified', value: 'unverified' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Investigation',
          admin: { condition: is('investigation') },
          fields: [
            {
              name: 'investigation',
              type: 'group',
              admin: { description: 'Template: Issue → Facts → Documents → Response → Ground reality → Public questions → Answer → Follow-up' },
              fields: ['issue', 'facts', 'documents', 'response', 'groundReality', 'publicQuestions', 'answer', 'followUp'].map(
                (name) => ({ name, type: 'richText' as const, localized: true }),
              ),
            },
          ],
        },
        {
          label: 'Complaint tracker',
          admin: { condition: is('tracker') },
          fields: [
            {
              name: 'tracker',
              type: 'array',
              admin: { description: 'समस्या → शिकायत → संबंधित विभाग → जवाब → कार्रवाई → परिणाम' },
              fields: [
                {
                  name: 'stage',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'समस्या / Problem', value: 'problem' },
                    { label: 'शिकायत / Complaint', value: 'complaint' },
                    { label: 'संबंधित विभाग / Department', value: 'department' },
                    { label: 'जवाब / Response', value: 'response' },
                    { label: 'कार्रवाई / Action', value: 'action' },
                    { label: 'परिणाम / Result', value: 'result' },
                  ],
                },
                { name: 'date', type: 'date' },
                {
                  name: 'status',
                  type: 'select',
                  defaultValue: 'pending',
                  options: [
                    { label: 'Done / पूर्ण', value: 'done' },
                    { label: 'In progress / जारी', value: 'progress' },
                    { label: 'Pending / लंबित', value: 'pending' },
                  ],
                },
                { name: 'note', type: 'textarea', localized: true },
              ],
            },
          ],
        },
        {
          label: 'Question & follow-ups',
          admin: { condition: is('question', 'news', 'investigation', 'tracker') },
          fields: [
            {
              name: 'questionStatus',
              type: 'select',
              admin: { description: 'Shown as a badge on "Direct Question to Government" stories' },
              options: [
                { label: 'पूछा गया / Asked', value: 'asked' },
                { label: 'जवाब आया / Response received', value: 'responded' },
                { label: 'कार्रवाई हुई / Action taken', value: 'action' },
              ],
            },
            { name: 'askedTo', type: 'text', localized: true, admin: { description: 'Ministry / department / official asked' } },
            {
              name: 'followUpOf',
              type: 'relationship',
              relationTo: 'articles',
              admin: { description: 'If this is a "Response received" / "Action taken" story, link the original question here. Links show on both pages.' },
            },
          ],
        },
        {
          label: 'Documents',
          fields: [
            {
              name: 'documents',
              type: 'array',
              admin: { description: 'Documents Speak: attach PDFs/images with source and reference' },
              fields: [
                { name: 'file', type: 'upload', relationTo: 'media', required: true },
                { name: 'title', type: 'text', localized: true },
                { name: 'source', type: 'text', localized: true, admin: { description: 'e.g. RTI reply, Govt order, Court record' } },
                { name: 'reference', type: 'text', admin: { description: 'Letter no. / RTI no. / date' } },
              ],
            },
          ],
        },
      ],
    },
    // Sidebar
    slugField('title'),
    { name: 'format', type: 'select', required: true, defaultValue: 'news', options: [...FORMATS], admin: { position: 'sidebar' } },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, index: true, admin: { position: 'sidebar' } },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'authors', admin: { position: 'sidebar' } },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Future date = scheduled; goes live automatically.' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media', admin: { position: 'sidebar' } },
    {
      name: 'externalImage',
      type: 'group',
      admin: { position: 'sidebar', description: 'Only for freely-licensed hotlinked images (Wikimedia/Unsplash). Credit is required.' },
      fields: [
        { name: 'url', type: 'text' },
        { name: 'credit', type: 'text' },
        { name: 'creditUrl', type: 'text' },
      ],
    },
    { name: 'featured', type: 'checkbox', label: 'Lead story (home page)', access: { create: isEditorField, update: isEditorField }, admin: { position: 'sidebar' } },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted for review', value: 'submitted' },
        { label: 'Changes requested', value: 'changes' },
        { label: 'Approved', value: 'approved' },
      ],
    },
    { name: 'legalReviewed', type: 'checkbox', label: 'Allegation content legally reviewed', admin: { position: 'sidebar' } },
    { name: 'sample', type: 'checkbox', label: 'Show "Sample" label', admin: { position: 'sidebar' } },
    { name: 'demoContent', type: 'checkbox', index: true, admin: { position: 'sidebar', description: 'Temporary demo item. Bulk delete: npm run demo:remove' } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  ],
}
