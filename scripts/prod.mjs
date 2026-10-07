// Run any command against the PRODUCTION database without pasting secrets:
//   node scripts/prod.mjs npx payload migrate
//   node scripts/prod.mjs npx payload run src/seed/round3.ts
// Reads DATABASE_URL / PAYLOAD_SECRET (and BLOB token if present) from the git-ignored .env.vercel.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const env = { ...process.env, NODE_ENV: 'production', RUN_MIGRATIONS: 'true', NODE_OPTIONS: '--no-deprecation' }
for (const line of readFileSync(new URL('../.env.vercel', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z_0-9]+)=(.*)$/.exec(line.trim())
  if (m && m[2] && !['REQUIRE_2FA'].includes(m[1])) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
}
const [cmd, ...args] = process.argv.slice(2)
if (!cmd) (console.error('Usage: node scripts/prod.mjs <command…>'), process.exit(1))
process.exit(spawnSync(cmd, args, { stdio: 'inherit', env, shell: true }).status ?? 1)
