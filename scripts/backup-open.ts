// Open a downloaded backup:  BACKUP_KEY=... PAYLOAD_SECRET=... npm run backup:open -- path/to/2026-10-01.json.gz.enc
// Writes <file>.json next to it. (Uses BACKUP_KEY if the site had one, otherwise the site's PAYLOAD_SECRET.)
import { readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { backupKey, unseal } from '../src/lib/security.ts'

const file = process.argv[2]
if (!file) {
  console.error('Usage: npm run backup:open -- <backup file>')
  process.exit(1)
}
const json = gunzipSync(unseal(readFileSync(file, 'utf8').trim(), backupKey()))
writeFileSync(`${file}.json`, json)
console.log(`Opened → ${file}.json (${(json.length / 1024).toFixed(0)} KB)`)
