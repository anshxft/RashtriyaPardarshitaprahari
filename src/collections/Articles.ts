import type { CollectionConfig, Where } from 'payload'
import { canPublish, isEditorField } from '../access'
import { slugField } from '../fields'
import { allowed } from '../lib/permissions'
import { articleAfterChange, articleBeforeChange } from '../lib/articleHooks'
import { INK_OPTIONS, TEMPLATES } from '../lib/layout'
import { siteUrl } from '../lib/paths'

export const FORMATS = [
  { label: 'News / समाचार', value: 'news' },
  { label: 'Fact Check / फैक्ट चेक', value: 'factcheck' },
  { label: 'Investigation / जांच', value: 'investigation' },
  { label: 'Direct Question / सीधा सवाल', value: 'question' },
  { label: 'Complaint Tracker / शिकायत से समाधान', value: 'tracker' },
  { label: 'Documents Speak / दस्तावेज़ बोलते हैं', value: 'documents' },
  { label: 'Opinion / विचार', value: 'opinion' },
  { label: 'Link to another portal / लिंक न्यूज़', value: 'link' },
  { label: 'Video News / वीडियो खबर', value: 'video' },
] as const

const is = (...formats: string[]) => (data: Record<string, unknown>) => formats.includes(data?.format as string)

/** Not archived / not in the trash (rows from before Round 4 have no lifecycle value = active). */
export const liveLifecycle = (): Where => ({ or: [{ lifecycle: { equals: 'active' } }, { lifecycle: { exists: false } }] })

/**
 * Public visitors only ever see published, non-archived articles whose publish time has arrived (= scheduled publishing).
 * For English (query with locale 'en') only stories that really have an English version are listed — no Hindi text
 * under an English menu. Untranslated stories show a "available in Hindi" note on their English URL.
 */
export const publicArticleWhere = (lang?: 'hi' | 'en', opts: { withEpaperOnly?: boolean } = {}): Where => ({
  and: [
    // “सिर्फ ई-पेपर” stories stay out of every website list (home, sections, search, sitemaps); the e-paper and the
    // story's own link (from the e-paper / QR) still open them.
    ...(opts.withEpaperOnly ? [] : [{ or: [{ 'layout.epaperOnly': { equals: false } }, { 'layout.epaperOnly': { exists: false } }] }]),
    { _status: { equals: 'published' } },
    { publishedAt: { less_than_equal: new Date().toISOString() } },
    liveLifecycle(),
    ...(lang === 'en' ? [{ title: { exists: true } }] : []),
  ],
})

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'format', 'category', 'reviewStatus', '_status', 'publishedAt'],
    group: 'Content',
    description:
      'Tip: the Desk (/desk) is the fast way to add news. Reporters save drafts and set Review status → "Submitted". Only Editors/Admins can publish. Future publish date = scheduled.',
    preview: (doc) => `${siteUrl()}/hi/preview/${doc.id}`,
  },
  versions: { drafts: true, maxPerDoc: 0 }, // 0 = keep every version (old versions are never wiped)
  access: {
    read: ({ req }) => (req.user ? true : publicArticleWhere(undefined, { withEpaperOnly: true })),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => (!req.user ? false : canPublish(req) || allowed(req.user as never, 'editOthers') || { createdBy: { equals: req.user.id } }),
    // Nothing is ever hard-deleted from the panel or API: Desk → Delete moves to Trash; only an Admin can purge from the Desk.
    delete: () => false,
  },
  hooks: { beforeChange: [articleBeforeChange], afterChange: [articleAfterChange] },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: 'मुख्य शीर्षक / Headline' },
    { name: 'subheadline', type: 'text', localized: true, label: 'उपशीर्षक / Sub-headline', admin: { description: 'केवल एक छोटी लाइन (वैकल्पिक)। पूरी खबर यहाँ नहीं — नीचे “मुख्य खबर” बॉक्स में लिखें/पेस्ट करें।' } },
    { name: 'excerpt', type: 'textarea', localized: true, label: 'सारांश / Summary', admin: { description: '1–2 लाइन का सार (कार्ड और Google के लिए), वैकल्पिक।' } },
    // Section + photo right under the headline (they used to sit in the sidebar, which drops below the whole form on
    // smaller screens — editors could not find them and Publish failed with “invalid: Category”).
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'relationship', relationTo: 'categories', required: true, index: true, label: 'श्रेणी / Section (ज़रूरी)', admin: { width: '50%' } },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
          label: 'मुख्य फोटो / Hero image',
          admin: { width: '50%', description: 'लैपटॉप या मोबाइल से फोटो चुनें (बड़ी फोटो भी चलेगी)। फोटो न हो तो खाली छोड़ें।' },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'मुख्य खबर / Story',
          fields: [
            { name: 'content', type: 'richText', localized: true, label: 'मुख्य खबर / Full story', admin: { description: 'पूरी खबर यहाँ पेस्ट करें — यही वेबसाइट और ई-पेपर में छपती है। ई-पेपर में वही खबर आती है जिसमें यहाँ लिखा हो।' } },
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
        {
          label: 'Link card',
          admin: { condition: is('link') },
          fields: [
            {
              name: 'linkCard',
              type: 'group',
              admin: { description: 'External news-portal item. Shown as a clearly marked "related news portal" card.' },
              fields: [
                { name: 'url', type: 'text' },
                { name: 'siteName', type: 'text', localized: true },
                { name: 'description', type: 'textarea', localized: true },
                { name: 'imageUrl', type: 'text', admin: { description: 'Leave empty for a text-only card' } },
              ],
            },
          ],
        },
        {
          label: 'ई-पेपर / Layout',
          fields: [
            {
              name: 'layout',
              type: 'group',
              admin: { description: 'Newspaper layout. The Desk sets this from the template; change only to fix a layout.' },
              fields: [
                { name: 'epaperOnly', type: 'checkbox', defaultValue: false, label: 'सिर्फ ई-पेपर में (वेबसाइट की सूची में नहीं) / E-paper only', admin: { description: 'टिक करने पर खबर केवल ई-पेपर में छपेगी; वेबसाइट के होम, सेक्शन, खोज में नहीं दिखेगी।' } },
                { name: 'inEpaper', type: 'checkbox', defaultValue: true, label: 'ई-पेपर में डालें / Include in the e-paper', admin: { description: 'टिक रहे तो खबर उसी दिन के ई-पेपर में अपने-आप लग जाती है।' } },
                { name: 'template', type: 'select', defaultValue: '1', options: Object.entries(TEMPLATES).map(([value, t]) => ({ value, label: `${value} — ${t.hi} / ${t.en}` })) },
                { name: 'columns', type: 'number', min: 1, max: 4, admin: { description: 'Text columns in the e-paper (1–4). Blank = template default.' } },
                { name: 'epaperPage', type: 'number', min: 1, admin: { description: 'Pin to a page. Blank = automatic.' } },
                { name: 'epaperOrder', type: 'number', admin: { description: 'Order inside the edition (lower = earlier). Blank = automatic.' } },
                { name: 'autoFit', type: 'checkbox', defaultValue: true },
                { name: 'bodyScale', type: 'number', min: 75, max: 130, defaultValue: 100, admin: { description: 'Body text size in %. Auto Fit may lower it slightly, never below 90%.' } },
                { name: 'headlineSize', type: 'select', options: ['sm', 'md', 'lg', 'xl'] },
                { name: 'headlineInk', type: 'select', options: INK_OPTIONS },
                { name: 'subheadlineSize', type: 'select', options: ['sm', 'md', 'lg', 'xl'] },
                { name: 'subheadlineInk', type: 'select', options: INK_OPTIONS },
                { name: 'reporterSize', type: 'select', options: ['sm', 'md', 'lg', 'xl'] },
                { name: 'reporterInk', type: 'select', options: INK_OPTIONS },
                { name: 'headlineWeight', type: 'select', options: ['bold', 'normal'] },
                { name: 'headlineAlign', type: 'select', options: ['left', 'center', 'right'] },
                { name: 'headlineFont', type: 'select', options: ['serif', 'sans'] },
                { name: 'subheadlineWeight', type: 'select', options: ['bold', 'normal'] },
                { name: 'subheadlineAlign', type: 'select', options: ['left', 'center', 'right'] },
                { name: 'reporterWeight', type: 'select', options: ['bold', 'normal'] },
                { name: 'reporterAlign', type: 'select', options: ['left', 'center', 'right'] },
                { name: 'align', type: 'select', options: ['left', 'center', 'justify'] },
                { name: 'photoSize', type: 'select', options: ['s', 'm', 'l', 'full'] },
                { name: 'photoPos', type: 'select', options: ['top', 'left', 'right'] },
              ],
            },
          ],
        },
      ],
    },
    // Sidebar
    slugField('title'),
    { name: 'format', type: 'select', required: true, defaultValue: 'news', options: [...FORMATS], admin: { position: 'sidebar' } },
    {
      name: 'gallery',
      type: 'array',
      label: 'और फोटो (गैलरी) / More photos',
      admin: { description: 'मुख्य फोटो के अलावा जितनी चाहें फोटो — खबर के नीचे गैलरी में दिखती हैं।' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'authors', admin: { position: 'sidebar', description: 'Legacy byline (use Reporter below)' } },
    { name: 'reporterName', type: 'text', localized: true, admin: { position: 'sidebar', description: 'Reporter / correspondent shown in the byline' } },
    { name: 'reporter', type: 'relationship', relationTo: 'team-members', admin: { position: 'sidebar', description: 'Optional: link to a team profile' } },
    { name: 'location', type: 'text', localized: true, admin: { position: 'sidebar', description: 'Dateline, e.g. पटना' } },
    { name: 'newsId', type: 'text', unique: true, index: true, admin: { position: 'sidebar', readOnly: true, description: 'Permanent News ID (auto, at first publish)' } },
    { name: 'firstPublishedAt', type: 'date', admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' }, description: 'Original publish time. Never changes.' } },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Future date = scheduled; goes live automatically.' },
    },
    {
      name: 'social',
      type: 'group',
      label: 'Social media version',
      admin: { position: 'sidebar', description: 'Made from this news (Desk → Social share). Edit before sharing; the link and News ID are always added.' },
      fields: [
        { name: 'headline', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'hashtags', type: 'text' },
      ],
    },
    {
      name: 'flash',
      type: 'group',
      label: 'Flash News + voice (video news)',
      admin: {
        position: 'sidebar',
        condition: (d) => d?.format === 'video',
        description: 'ONE approved script: the red FLASH strip and the female voice both use exactly this text. The system never adds facts.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', label: 'Flash ON' },
        { name: 'script', type: 'textarea', admin: { description: 'Short, factual — written and approved by the editor.' } },
        { name: 'breaking', type: 'checkbox', label: 'Breaking News mode' },
        { name: 'repeat', type: 'checkbox', label: 'Repeat ON', defaultValue: true },
        { name: 'intervalSec', type: 'number', min: 5, max: 300, defaultValue: 20, admin: { description: 'Repeat interval (seconds)' } },
        { name: 'voice', type: 'checkbox', label: 'Female voice ON' },
        { name: 'voiceRate', type: 'number', min: 0.7, max: 1.4, defaultValue: 1, admin: { description: 'Speed (1 = normal)' } },
        { name: 'voiceVolume', type: 'number', min: 10, max: 100, defaultValue: 100, admin: { description: 'Voice volume %' } },
        { name: 'pauseMs', type: 'number', min: 0, max: 2000, defaultValue: 400, admin: { description: 'Pause between sentences (ms)' } },
        { name: 'audioUrl', type: 'text', admin: { readOnly: true } },
        { name: 'audioKey', type: 'text', admin: { readOnly: true, description: 'Cache key: script + voice settings' } },
        { name: 'approvedBy', type: 'text', admin: { readOnly: true } },
        { name: 'approvedAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    { name: 'video', type: 'relationship', relationTo: 'videos', admin: { position: 'sidebar', condition: (d) => d?.format === 'video', description: 'Video news: the uploaded video (website version, social versions, flash + voice).' } },
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
    // Round 4 lifecycle — changed only through the Desk's Archive / Delete / Restore actions (server-checked + audited).
    {
      name: 'lifecycle',
      type: 'select',
      defaultValue: 'active',
      index: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
        { label: 'Trash (soft-deleted)', value: 'trashed' },
      ],
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true, description: 'Archive / Delete / Restore from the Desk (/desk/news).' },
    },
    { name: 'lifecycleBefore', type: 'text', admin: { hidden: true } },
    { name: 'trashedAt', type: 'date', access: { create: () => false, update: () => false }, admin: { position: 'sidebar', readOnly: true, condition: (d) => d?.lifecycle === 'trashed' } },
    { name: 'trashReason', type: 'text', access: { create: () => false, update: () => false }, admin: { position: 'sidebar', readOnly: true, condition: (d) => d?.lifecycle === 'trashed' } },
    { name: 'versionMinor', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true, description: 'Version = 1.<this>. Goes up on every change to a published story.' } },
    { name: 'lastPublishedAt', type: 'date', admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' }, description: 'Latest (re-)publish time.' } },
    { name: 'lastEditedBy', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    { name: 'editNote', type: 'text', virtual: true, admin: { position: 'sidebar', description: 'Optional public note for this edit (shown as “संशोधित”). Not stored on the story itself.' } },
    {
      name: 'revisions',
      type: 'array',
      admin: { position: 'sidebar', readOnly: true, description: 'Public edit log (auto).' },
      fields: [
        { name: 'at', type: 'date', required: true },
        { name: 'note', type: 'text' },
        { name: 'locale', type: 'text' },
        { name: 'by', type: 'text', admin: { hidden: true } },
      ],
    },
  ],
}
