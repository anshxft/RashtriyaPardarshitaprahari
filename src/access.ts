import type { Access, FieldAccess, PayloadRequest } from 'payload'

export type Role = 'admin' | 'editor' | 'reporter'

const role = (req: PayloadRequest): Role | undefined =>
  (req.user as { role?: Role } | null)?.role

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)
export const isAdmin: Access = ({ req }) => role(req) === 'admin'
/** Editors and admins: the only roles that may publish. */
export const isEditor: Access = ({ req }) => role(req) === 'admin' || role(req) === 'editor'
export const isEditorField: FieldAccess = ({ req }) => role(req) === 'admin' || role(req) === 'editor'
export const isAdminField: FieldAccess = ({ req }) => role(req) === 'admin'
export const canPublish = (req: PayloadRequest) => role(req) === 'admin' || role(req) === 'editor'
export const anyone: Access = () => true
