import type { Access, FieldAccess, PayloadRequest } from 'payload'

export type Role = 'admin' | 'editor' | 'reporter'

const me = (req: PayloadRequest) => req.user as { role?: Role; canPublish?: boolean } | null
const role = (req: PayloadRequest): Role | undefined => me(req)?.role

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)
export const isAdmin: Access = ({ req }) => role(req) === 'admin'
/** Editors and admins: the only roles that may publish. */
export const isEditor: Access = ({ req }) => role(req) === 'admin' || role(req) === 'editor'
export const isEditorField: FieldAccess = ({ req }) => role(req) === 'admin' || role(req) === 'editor'
export const isAdminField: FieldAccess = ({ req }) => role(req) === 'admin'
/** Admins always; Editors unless an Admin switched off their publish right (Users → 'Can publish'). */
export const canPublish = (req: PayloadRequest) => role(req) === 'admin' || (role(req) === 'editor' && me(req)?.canPublish !== false)
export const anyone: Access = () => true
