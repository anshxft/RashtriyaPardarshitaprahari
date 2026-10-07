/**
 * Role → action permission matrix. Admin (प्रधान संपादक / Super Admin) can always do everything, so nobody can lock
 * themselves out. The other roles follow the "Permissions" global, editable by an Admin (defaults below = the client's spec).
 * Pure + a tiny per-instance cache, so sync checks (canPublish) and async server actions read the same rules.
 */
export const ROLES = ['reporter', 'editor', 'senior', 'admin'] as const
export type Role = (typeof ROLES)[number]
export const ROLE_LABEL: Record<Role, string> = { reporter: 'रिपोर्टर', editor: 'संपादक', senior: 'वरिष्ठ संपादक', admin: 'प्रधान संपादक / एडमिन' }

export const ACTIONS = {
  publish: 'प्रकाशित करना / Publish',
  approve: 'दूसरों की खबर स्वीकृत करना / Approve review',
  editOthers: 'दूसरों की खबर संपादित करना / Edit others’ news',
  download: 'डाउनलोड / Download',
  share: 'सोशल शेयर / Social share',
  archive: 'आर्काइव / Archive',
  republish: 'पुनः प्रकाशन / Re-publish',
  restore: 'आर्काइव से वापस / Restore',
  versionHistory: 'संस्करण इतिहास / Version history',
  trashOwnDraft: 'अपना ड्राफ्ट हटाना / Delete own draft',
  trashPublished: 'प्रकाशित/आर्काइव खबर हटाना / Delete published news',
  trashVideo: 'वीडियो खबर हटाना / Delete video news',
  auditLog: 'ऑडिट लॉग देखना / View audit log',
} as const
export type Action = keyof typeof ACTIONS
export type Matrix = Record<Action, Role[]>

export const DEFAULTS: Matrix = {
  publish: ['editor', 'senior'],
  approve: ['senior'],
  editOthers: ['editor', 'senior'],
  download: ['editor', 'senior'],
  share: ['editor', 'senior'],
  archive: ['editor', 'senior'],
  republish: ['senior'],
  restore: ['senior'],
  versionHistory: ['senior'],
  trashOwnDraft: ['reporter', 'editor', 'senior'],
  trashPublished: [],
  trashVideo: [],
  auditLog: [],
}

/** Global document ({ publish: { reporter: false, editor: true, … }, … }) → matrix; missing values fall back to the defaults. */
export function matrixFrom(doc: Record<string, unknown> | null | undefined): Matrix {
  const out = {} as Matrix
  for (const a of Object.keys(ACTIONS) as Action[]) {
    const row = (doc?.[a] || {}) as Record<string, unknown>
    out[a] = (['reporter', 'editor', 'senior'] as const).filter((r) => (typeof row[r] === 'boolean' ? row[r] : DEFAULTS[a].includes(r)))
  }
  return out
}

let cache: { m: Matrix; at: number } = { m: DEFAULTS, at: 0 }
export const setMatrix = (m: Matrix) => (cache = { m, at: Date.now() })

/** Re-reads the global at most every 30 s per server instance. Call before permission checks in server code. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any Payload instance (typed config not importable from this pure module)
export async function loadPermissions(payload: { findGlobal: (a: any) => Promise<unknown> }) {
  if (Date.now() - cache.at < 30_000) return cache.m
  try {
    setMatrix(matrixFrom((await payload.findGlobal({ slug: 'permissions', depth: 0 })) as Record<string, unknown>))
  } catch {
    cache.at = Date.now() // table missing during a first migration: keep defaults
  }
  return cache.m
}

export const isRole = (r: unknown): r is Role => ROLES.includes(r as Role)
/** The single permission check. */
export function allowed(user: { id?: unknown; role?: string | null; canPublish?: boolean | null } | null | undefined, action: Action, m: Matrix = cache.m): boolean {
  if (!user || !isRole(user.role)) return false
  if (user.role === 'admin') return true
  if (action === 'publish' && user.canPublish === false) return false
  return m[action].includes(user.role)
}
