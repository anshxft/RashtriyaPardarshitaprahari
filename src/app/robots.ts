import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/paths'

/** AI-training / bulk-copy crawlers may not take our reporting (well-behaved ones obey this); search engines are welcome. */
const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'CCBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'Google-Extended', 'PerplexityBot', 'Bytespider', 'Applebot-Extended', 'meta-externalagent', 'Diffbot', 'Omgilibot', 'cohere-ai']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/hi/search', '/en/search'] },
      { userAgent: AI_BOTS, disallow: '/' },
    ],
    sitemap: [`${siteUrl()}/sitemap.xml`, `${siteUrl()}/news-sitemap.xml`],
  }
}
