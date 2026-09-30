import dns from 'node:dns'
import net from 'node:net'
import { Agent, fetch } from 'undici'

export type LinkMeta = { url: string; title?: string; siteName?: string; description?: string; imageUrl?: string }

/** Loopback, private, link-local, CGNAT, multicast … anything that is not a normal public internet address. */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
  }
  const v6 = ip.toLowerCase()
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7))
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb') || v6.startsWith('ff')
}

/** Every connection (including redirects) is re-checked at connect time, so DNS tricks can't reach internal addresses. */
const agent = new Agent({
  connect: {
    lookup: (host, opts, cb) =>
      dns.lookup(host, opts as dns.LookupOptions, (err, address, family) => {
        const list = Array.isArray(address) ? address : [{ address, family }]
        if (!err && (list as { address: string }[]).some((a) => isPrivateAddress(a.address))) err = new Error('blocked address') as NodeJS.ErrnoException
        ;(cb as (...a: unknown[]) => void)(err, address, family)
      }),
  },
})

const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (_, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e.toLowerCase() as 'amp'] ?? ''
  })

/** Pure: pull Open-Graph / Twitter / <title> data out of an HTML string. */
export function parseMeta(html: string, pageUrl: string): LinkMeta {
  const head = html.slice(0, 200_000)
  const meta = new Map<string, string>()
  for (const m of head.matchAll(/<meta\s+([^>]+?)\/?>/gi)) {
    const attrs = Object.fromEntries([...m[1].matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map((a) => [a[1].toLowerCase(), a[3] ?? a[4]]))
    const key = (attrs.property || attrs.name || '').toLowerCase()
    if (key && attrs.content && !meta.has(key)) meta.set(key, decode(attrs.content).trim())
  }
  const title = meta.get('og:title') || meta.get('twitter:title') || decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] || '').trim() || undefined
  let image = meta.get('og:image') || meta.get('og:image:url') || meta.get('twitter:image')
  try {
    image = image ? new URL(image, pageUrl).toString() : undefined
    if (image && !/^https?:/.test(image)) image = undefined
  } catch {
    image = undefined
  }
  return {
    url: pageUrl,
    title: title?.replace(/\s+/g, ' ').slice(0, 240),
    siteName: (meta.get('og:site_name') || new URL(pageUrl).hostname.replace(/^www\./, '')).slice(0, 80),
    description: (meta.get('og:description') || meta.get('twitter:description') || meta.get('description'))?.replace(/\s+/g, ' ').slice(0, 400),
    imageUrl: image,
  }
}

/** Fetch a public web page (8 s, 1 MB, ≤4 redirects, public addresses only) and read its link-preview data. */
export async function fetchLinkMeta(raw: string): Promise<LinkMeta> {
  let url = new URL(raw.trim())
  if (!/^https?:$/.test(url.protocol)) throw new Error('केवल http/https लिंक')
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(url, { dispatcher: agent, redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; PraharLinkPreview/1.0)', accept: 'text/html,application/xhtml+xml' } })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url)
      if (!/^https?:$/.test(url.protocol)) throw new Error('अमान्य रीडायरेक्ट')
      continue
    }
    if (!res.ok) throw new Error(`साइट ने ${res.status} लौटाया`)
    if (!/html/i.test(res.headers.get('content-type') || '')) throw new Error('यह HTML पेज नहीं है')
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (size < 1_000_000) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
    }
    await reader.cancel().catch(() => {})
    const charset = /charset=([\w-]+)/i.exec(res.headers.get('content-type') || '')?.[1] || 'utf-8'
    return parseMeta(new TextDecoder(charset, { fatal: false }).decode(Buffer.concat(chunks)), url.toString())
  }
  throw new Error('बहुत ज़्यादा रीडायरेक्ट')
}
