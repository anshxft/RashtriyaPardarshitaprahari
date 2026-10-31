import { AdsPage } from '@/components/desk/AdsPage'

export const metadata = { title: 'वेबसाइट विज्ञापन' }
export const dynamic = 'force-dynamic'

export default function DeskAds() {
  return <AdsPage mode="web" />
}
