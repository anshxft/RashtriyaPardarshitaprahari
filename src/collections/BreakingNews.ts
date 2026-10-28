import type { Access, CollectionConfig, Where } from 'payload'
import { isEditor } from '../access'

export const FLASH_STATUS = {
  draft: 'ड्राफ्ट / Draft',
  active: 'फ्लैश चालू / Breaking Flash Active',
  paused: 'फ्लैश रुका / Breaking Flash Paused',
  removed: 'फ्लैश से हटाया / Breaking Flash Removed',
} as const
export type FlashStatus = keyof typeof FLASH_STATUS

/** How long a flash runs; null = until someone removes it. */
export const FLASH_DURATIONS: { value: string; label: string; minutes: number | null }[] = [
  { value: '30m', label: '30 मिनट', minutes: 30 },
  { value: '1h', label: '1 घंटा', minutes: 60 },
  { value: '3h', label: '3 घंटे', minutes: 180 },
  { value: '6h', label: '6 घंटे', minutes: 360 },
  { value: '12h', label: '12 घंटे', minutes: 720 },
  { value: '24h', label: '24 घंटे', minutes: 1440 },
  { value: 'manual', label: 'जब तक हटाएँ नहीं', minutes: null },
]

/** A flash readers can see right now: switched on and its time not over. */
export const liveFlashWhere = (): Where => ({
  and: [{ status: { equals: 'active' } }, { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: new Date().toISOString() } }] }],
})

// Readers (and the future mobile app) only ever get live flashes; drafts / paused / removed stay inside the desk.
const readFlash: Access = ({ req }) => (req.user ? true : liveFlashWhere())

/**
 * Breaking Flash: a short 1–3 line alert with an optional photo and/or video, shown in the red ticker on every page and
 * as the rotating Breaking card on the home page. Every save keeps a version (internal revision history, staff only).
 */
export const BreakingNews: CollectionConfig = {
  slug: 'breaking-news',
  labels: { singular: 'Breaking Flash', plural: 'Breaking Flash' },
  admin: { useAsTitle: 'text', defaultColumns: ['text', 'status', 'priority', 'expiresAt', 'updatedAt'], group: 'Content' },
  access: { read: readFlash, create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: isEditor },
  versions: { maxPerDoc: 50 },
  defaultSort: '-priority',
  fields: [
    { name: 'text', type: 'textarea', required: true, localized: true, maxLength: 300, admin: { description: '1–3 छोटी पंक्तियाँ (हर पंक्ति नई लाइन में)' } },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', index: true, options: Object.entries(FLASH_STATUS).map(([value, label]) => ({ value, label })) },
    { name: 'priority', type: 'number', defaultValue: 0, index: true, admin: { description: 'बड़ा नंबर = ऊपर / पहले दिखे' } },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'video', type: 'relationship', relationTo: 'videos', admin: { description: 'वीडियो की आवाज़ अपने-आप नहीं चलती; पाठक Play दबाकर देखते हैं' } },
    {
      name: 'showMedia',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { value: 'auto', label: 'अपने-आप (वीडियो हो तो वीडियो, वरना फोटो)' },
        { value: 'photo', label: 'केवल फोटो' },
        { value: 'video', label: 'केवल वीडियो' },
        { value: 'both', label: 'फोटो और वीडियो दोनों' },
      ],
    },
    { name: 'caption', type: 'text', localized: true, maxLength: 160 },
    { name: 'article', type: 'relationship', relationTo: 'articles', admin: { description: 'पूरी खबर — फ्लैश पर क्लिक से यही खुलेगी' } },
    { name: 'link', type: 'text', admin: { description: 'Optional other link, e.g. /hi/news/some-slug (used when no news is chosen)' } },
    { name: 'reporterName', type: 'text', admin: { description: 'किस संवाददाता ने भेजा' } },
    { name: 'showReporter', type: 'checkbox', defaultValue: false, admin: { description: 'संवाददाता का नाम पाठकों को दिखाएँ' } },
    { name: 'duration', type: 'select', defaultValue: '6h', options: FLASH_DURATIONS.map(({ value, label }) => ({ value, label })) },
    { name: 'publishedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'expiresAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' }, description: 'समय पूरा होते ही फ्लैश अपने-आप बंद; खबर वेबसाइट पर रहती है' } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'demoContent', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
}
