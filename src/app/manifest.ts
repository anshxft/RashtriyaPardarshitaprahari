import type { MetadataRoute } from 'next'

/** Lets phones add the site to the home screen with the right name, icon and colour. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'राष्ट्रीय पारदर्शिता प्रहरी',
    short_name: 'प्रहरी',
    description: 'तथ्य, पारदर्शिता, जवाबदेही और जनहित पर आधारित ई-पेपर एवं डिजिटल न्यूज़',
    start_url: '/hi',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8f1d1f',
    lang: 'hi',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
