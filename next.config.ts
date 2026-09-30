import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
    // videos/posters served by /api/files in local development
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/api/files/**' }, { pathname: '/**' }],
  },
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  // ffmpeg is a native binary resolved at runtime: keep it out of the bundle and make sure it (and the logo) ship with the Desk functions.
  serverExternalPackages: ['@ffmpeg-installer/ffmpeg', 'undici'],
  outputFileTracingIncludes: {
    '/desk/**': ['./node_modules/@ffmpeg-installer/**/*', './public/logo-watermark.png'],
  },
  async redirects() {
    return [{ source: '/', destination: '/hi', permanent: false }]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: { root: path.resolve(dirname) },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
