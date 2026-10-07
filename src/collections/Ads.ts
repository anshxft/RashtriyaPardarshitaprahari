import type { CollectionConfig, Where } from 'payload'
import { isEditor } from '../access'

/** Ads that are switched on and inside their dates, for one placement. */
export const liveAdsWhere = (placement: string): Where => {
  const now = new Date().toISOString()
  return {
    and: [
      { active: { equals: true } },
      { placements: { contains: placement } },
      { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
      { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now } }] },
    ],
  }
}

/**
 * Advertisement Manager. Ads show only when Site Settings → “Ads enabled” is ON, always under a visible
 * “विज्ञापन / Advertisement” label (kept apart from news). No ad = no empty space anywhere.
 */
export const Ads: CollectionConfig = {
  slug: 'ads',
  labels: { singular: 'Advertisement', plural: 'Advertisements / विज्ञापन' },
  admin: { group: 'Content', useAsTitle: 'title', defaultColumns: ['title', 'placements', 'active', 'startsAt', 'endsAt'] },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Advertiser / internal name (also the image alt text)' } },
    { name: 'image', type: 'upload', relationTo: 'media', required: true, admin: { description: 'Portrait works best for the e-paper column (e.g. 600×900).' } },
    { name: 'link', type: 'text', admin: { description: 'Optional website of the advertiser' } },
    {
      name: 'placements',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['epaper'],
      options: [
        { label: 'E-paper advertisement column (page 1)', value: 'epaper' },
        { label: 'Website home page (top)', value: 'home-top' },
        { label: 'Website story pages (inside the story)', value: 'article' },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
