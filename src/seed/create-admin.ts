/**
 * Create a user from the command line:
 *   ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='long-password' ADMIN_ROLE=admin npm run create-admin
 * (Alternatively open /admin on a fresh database — the first account created there becomes Admin.)
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name = 'Admin', ADMIN_ROLE: role = 'admin' } = process.env
if (!email || !password || password.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars). Optional: ADMIN_NAME, ADMIN_ROLE=admin|editor|reporter')
  process.exit(1)
}
if (!['admin', 'editor', 'reporter'].includes(role)) {
  console.error('ADMIN_ROLE must be admin, editor or reporter')
  process.exit(1)
}
const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
if (existing.docs[0]) {
  console.log(`User ${email} already exists.`)
} else {
  await payload.create({ collection: 'users', data: { email, password, name, role: role as 'admin' } })
  console.log(`Created ${role}: ${email}`)
}
process.exit(0)
