import { AdsPage } from '@/components/desk/AdsPage'

export const metadata = { title: 'ई-पेपर विज्ञापन' }
export const dynamic = 'force-dynamic'

export default function DeskEpaperAds() {
  return <AdsPage mode="epaper" />
}
