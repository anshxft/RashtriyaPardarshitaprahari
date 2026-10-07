import type { Access, FieldAccess, PayloadRequest } from 'payload'
import { allowed, type Role } from './lib/permissions'

export type { Role }

const me = (req: PayloadRequest) => req.user as { role?: Role; canPublish?: boolean } | null
const role = (req: PayloadRequest): Role | undefined => me(req)?.role
const deskRoles: (Role | undefined)[] = ['admin', 'senior', 'editor']

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)
export const isAdmin: Access = ({ req }) => role(req) === 'admin'
/** Editors, senior editors and admins (manage sections, breaking news, pages, inbox …). */
export const isEditor: Access = ({ req }) => deskRoles.includes(role(req))
export const isEditorField: FieldAccess = ({ req }) => deskRoles.includes(role(req))
export const isAdminField: FieldAccess = ({ req }) => role(req) === 'admin'
/** Publish right from the editable role matrix (Admin → Permissions) + the per-user 'Can publish' switch. */
export const canPublish = (req: PayloadRequest) => allowed(me(req), 'publish')
export const anyone: Access = () => true
