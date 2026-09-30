// npm run db:push — sync the local SQLite schema with the collections (run after changing a collection).
import config from '@payload-config'
import { getPayload } from 'payload'
await getPayload({ config })
console.log('✓ local database schema is up to date')
process.exit(0)
