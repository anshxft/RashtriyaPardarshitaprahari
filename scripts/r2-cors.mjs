// One-time: allow the website to upload videos straight to the R2/S3 bucket (resumable uploads need the ETag header).
//   node scripts/r2-cors.mjs            (reads S3_* and NEXT_PUBLIC_SITE_URL from .env.vercel or the environment)
import { readFileSync } from 'node:fs'
import { AwsClient } from 'aws4fetch'

for (const f of ['.env.vercel', '.env']) {
  try {
    for (const line of readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z_0-9]+)=(.*)$/.exec(line.trim())
      if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}
const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, NEXT_PUBLIC_SITE_URL } = process.env
if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) throw new Error('S3_* missing')
const origins = [NEXT_PUBLIC_SITE_URL, 'http://localhost:3000'].filter(Boolean)
const body = `<CORSConfiguration><CORSRule>${origins.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join('')}<AllowedMethod>PUT</AllowedMethod><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader><ExposeHeader>ETag</ExposeHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>`
const aws = new AwsClient({ accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY, service: 's3', region: S3_REGION || 'auto' })
const res = await aws.fetch(`${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}?cors`, { method: 'PUT', body, headers: { 'content-type': 'application/xml' } })
console.log(res.ok ? `✓ CORS set for ${origins.join(', ')}` : `✗ ${res.status} ${await res.text()}`)
