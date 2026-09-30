import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/paths'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/hi/search', '/en/search'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
