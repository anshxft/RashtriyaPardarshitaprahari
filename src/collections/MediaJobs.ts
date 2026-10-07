import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'

/**
 * The video job queue (status in the database, nothing else to run). Jobs are added by the Desk and picked up either by the
 * separate worker (VIDEO_WORKER=external, recommended: no time limit) or, without a worker, right after the request on Vercel.
 */
export const MediaJobs: CollectionConfig = {
  slug: 'media-jobs',
  labels: { singular: 'Video job', plural: 'Video jobs' },
  admin: { group: 'Admin', useAsTitle: 'kind', defaultColumns: ['kind', 'video', 'status', 'attempts', 'updatedAt'] },
  access: { read: isEditor, create: () => false, update: () => false, delete: () => false },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Website version (logo) + thumbnail', value: 'web' },
        { label: 'Social video 1920×1080', value: 'social' },
        { label: 'Social video vertical 1080×1920', value: 'vertical' },
        { label: 'Final video with Flash + Voice', value: 'flash' },
      ],
    },
    { name: 'video', type: 'relationship', relationTo: 'videos', required: true, index: true },
    { name: 'status', type: 'select', defaultValue: 'queued', index: true, options: ['queued', 'running', 'done', 'failed'] },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'lockedAt', type: 'date' },
    { name: 'error', type: 'text' },
    { name: 'params', type: 'json' },
  ],
}
