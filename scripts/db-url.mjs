// npm run db-url
// Reads SUPABASE_DB_PASSWORD from .env.vercel, builds the Supabase pooler DATABASE_URL, tests it,
// and writes it into .env.vercel. Prints only OK/FAIL (never the password or the URL).
import fs from 'node:fs'
import pg from 'pg'

const FILE = '.env.vercel'
const REF = 'wuqqjerkjmuqyxumfmag' // Supabase project ref (Mumbai)
const HOSTS = ['aws-0-ap-south-1.pooler.supabase.com', 'aws-1-ap-south-1.pooler.supabase.com']

const text = fs.readFileSync(FILE, 'utf8')
const password = (text.match(/^SUPABASE_DB_PASSWORD=(.*)$/m)?.[1] || '').trim()
if (!password) {
  console.error(`✗ ${FILE} mein SUPABASE_DB_PASSWORD= ke baad password nahi mila.`)
  process.exit(1)
}

for (const host of HOSTS) {
  const url = `postgresql://postgres.${REF}:${encodeURIComponent(password)}@${host}:6543/postgres`
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 })
  try {
    await client.connect()
    await client.query('select 1')
    await client.end()
    const line = `DATABASE_URL=${url}`
    fs.writeFileSync(FILE, /^DATABASE_URL=.*$/m.test(text) ? text.replace(/^DATABASE_URL=.*$/m, line) : `${text.trimEnd()}\n${line}\n`)
    console.log(`✓ Database connection OK. DATABASE_URL ${FILE} mein likh diya gaya.`)
    process.exit(0)
  } catch {
    await client.end().catch(() => {})
  }
}
console.error('✗ Connection nahi hua. Password sahi hai? (Supabase → Database → Reset password)')
process.exit(1)
