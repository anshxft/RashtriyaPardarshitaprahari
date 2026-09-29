// TEMPORARY deploy diagnostic — reports only the *shape* of settings, never values. Delete after launch.
import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.DATABASE_URL || ''
  const out: Record<string, unknown> = {
    dbUrlStartsWith: url.slice(0, 13),
    dbUrlHasWhitespace: /\s/.test(url),
    dbUrlLength: url.length,
    payloadSecretLength: (process.env.PAYLOAD_SECRET || '').length,
    blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  }
  try {
    const payload = await getPayload({ config })
    out.categories = (await payload.count({ collection: 'categories' })).totalDocs
    out.ok = true
  } catch (e) {
    out.ok = false
    out.error = String((e as Error)?.message || e).replace(url, '***').slice(0, 400)
  }
  return Response.json(out)
}
