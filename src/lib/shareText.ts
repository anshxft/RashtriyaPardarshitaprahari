/** Pure share texts and manual "open platform" links — safe for the browser (no secrets, no node modules). */
export type ShareItem = { headline: string; description: string; hashtags: string; url: string; newsId?: string | null; imageUrl?: string | null; videoUrl?: string | null }
export type PlatformId = 'telegram' | 'facebook' | 'instagram' | 'x' | 'whatsapp'

/** Pure: the post text. Keeps within each platform's limit and always ends with the link + News ID. */
export function caption(item: ShareItem, platform: PlatformId): string {
  const tail = [item.newsId && `News ID: ${item.newsId}`, item.url].filter(Boolean).join('\n')
  const tags = item.hashtags.trim()
  if (platform === 'x') {
    // X counts every link as 23 characters; keep the whole post ≤ 280.
    const room = 280 - 23 - (item.newsId ? item.newsId.length + 10 : 0) - (tags ? tags.length + 2 : 0) - 4
    const head = item.headline.length > room ? `${item.headline.slice(0, room - 1).trimEnd()}…` : item.headline
    return [head, tags, item.newsId && `News ID: ${item.newsId}`, item.url].filter(Boolean).join('\n')
  }
  const body = [item.headline, item.description].filter(Boolean).join('\n\n')
  const max = platform === 'telegram' ? 1000 : 2000
  const trimmed = body.length > max - tail.length - tags.length - 8 ? `${body.slice(0, max - tail.length - tags.length - 9).trimEnd()}…` : body
  return [trimmed, tags, tail].filter(Boolean).join('\n\n')
}

/** Manual fallback links (no credentials needed): open the platform with the text / link ready. */
export function openLink(item: ShareItem, p: PlatformId): string {
  const t = encodeURIComponent(caption(item, p === 'x' ? 'x' : 'facebook'))
  const u = encodeURIComponent(item.url)
  switch (p) {
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${encodeURIComponent(item.headline)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`
    case 'x':
      return `https://x.com/intent/post?text=${encodeURIComponent(caption({ ...item, url: '' }, 'x'))}&url=${u}`
    case 'whatsapp':
      return `https://wa.me/?text=${t}`
    case 'instagram':
      return 'https://www.instagram.com/'
  }
}

