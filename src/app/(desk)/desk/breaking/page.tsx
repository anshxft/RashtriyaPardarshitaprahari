import { FlashDesk } from '@/components/desk/FlashDesk'

export const metadata = { title: 'ब्रेकिंग फ्लैश' }
export const dynamic = 'force-dynamic'

export default function BreakingPage() {
  return <FlashDesk mode="ticker" />
}
