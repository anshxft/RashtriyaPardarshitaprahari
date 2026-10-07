import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor, isLoggedIn } from '../access'

/**
 * Reusable pronunciation dictionary for the female voice (names of places, officials, departments).
 * SPEECH ONLY: the displayed news text is never changed by these entries.
 */
export const Pronunciations: CollectionConfig = {
  slug: 'pronunciations',
  labels: { singular: 'Pronunciation', plural: 'Pronunciation dictionary' },
  admin: { group: 'Content', useAsTitle: 'word', defaultColumns: ['word', 'speakAs', 'note'], description: 'आवाज़ में सही उच्चारण के लिए। खबर का दिखने वाला पाठ नहीं बदलता।' },
  access: { read: isLoggedIn, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: 'word', type: 'text', required: true, unique: true, admin: { description: 'As written in the news, e.g. झामुमो' } },
    { name: 'speakAs', type: 'text', required: true, admin: { description: 'How the voice should say it, e.g. झारखंड मुक्ति मोर्चा' } },
    { name: 'note', type: 'text' },
  ],
}
