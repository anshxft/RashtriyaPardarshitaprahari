import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Articles } from './collections/Articles'
import { Authors } from './collections/Authors'
import { BreakingNews } from './collections/BreakingNews'
import { Categories } from './collections/Categories'
import { Corrections } from './collections/Corrections'
import { Appointments, ContactMessages, Submissions } from './collections/Inbox'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { PrivateFiles } from './collections/PrivateFiles'
import { Tags } from './collections/Tags'
import { TeamMembers } from './collections/TeamMembers'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { migrations } from './migrations'
import { SiteSettings } from './globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const env = process.env

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — प्रहरी Admin', icons: [{ url: '/icon.png' }] },
    components: {
      graphics: { Logo: '/components/admin/Graphics#Logo', Icon: '/components/admin/Graphics#Icon' },
    },
  },
  collections: [
    Articles, Videos, Categories, Tags, Authors, TeamMembers, BreakingNews, Corrections, Pages, Media,
    Submissions, Appointments, ContactMessages, PrivateFiles, Users,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // postgres://… (Supabase, production) → Postgres; anything else → local SQLite file (development).
  // Postgres: schema changes ship as migrations (src/migrations), applied automatically in production.
  db: /^postgres(ql)?:\/\//.test(env.DATABASE_URL || '')
    ? postgresAdapter({
        // ponytail: encrypted but unverified TLS (Supabase CA isn't in Node's store); pin their CA cert if you need verification.
        pool: { connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } },
        prodMigrations: env.RUN_MIGRATIONS === 'false' ? undefined : migrations,
      })
    : sqliteAdapter({
        client: { url: env.DATABASE_URL || 'file:./prahari.db' },
        // Schema sync for local SQLite only runs on request (npm run db:push, seed scripts). Auto-push on every hot reload crashes drizzle.
        push: env.DB_PUSH === '1',
      }),
  sharp,
  localization: {
    locales: [
      { code: 'hi', label: 'हिन्दी' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'hi',
    fallback: true,
  },
  email: env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: env.SMTP_FROM || 'no-reply@example.org',
        defaultFromName: 'Rashtriya Pardarshita Prahari',
        transportOptions: {
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT || 587),
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        },
      })
    : undefined, // no SMTP → Payload logs emails to the console
  plugins: env.BLOB_READ_WRITE_TOKEN
    ? [vercelBlobStorage({ collections: { media: true, 'private-files': true }, token: env.BLOB_READ_WRITE_TOKEN })]
    : [],
  upload: { limits: { fileSize: 20_000_000 } },
})
