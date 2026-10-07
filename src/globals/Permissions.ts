import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access'
import { ACTIONS, DEFAULTS, matrixFrom, setMatrix, type Action } from '../lib/permissions'

/** Admin → Permissions: tick what each role may do. Admin always has every right. */
export const Permissions: GlobalConfig = {
  slug: 'permissions',
  label: 'Role permissions / अधिकार',
  admin: { group: 'Admin', description: 'प्रधान संपादक / एडमिन के पास हमेशा सभी अधिकार रहते हैं। बाकी भूमिकाओं के अधिकार यहां बदलें; बदलाव लगभग 30 सेकंड में हर जगह लागू होते हैं।' },
  access: { read: ({ req }) => Boolean(req.user), update: isAdmin },
  hooks: { afterChange: [({ doc }) => setMatrix(matrixFrom(doc))] },
  fields: (Object.keys(ACTIONS) as Action[]).map((a) => ({
    name: a,
    type: 'group' as const,
    label: ACTIONS[a],
    admin: { hideGutter: true },
    fields: (['reporter', 'editor', 'senior'] as const).map((r) => ({
      name: r,
      type: 'checkbox' as const,
      label: { reporter: 'रिपोर्टर', editor: 'संपादक', senior: 'वरिष्ठ संपादक' }[r],
      defaultValue: DEFAULTS[a].includes(r),
      admin: { width: '33%' },
    })),
  })),
}
