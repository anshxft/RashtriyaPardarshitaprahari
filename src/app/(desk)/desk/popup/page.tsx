import { FlashDesk } from '@/components/desk/FlashDesk'

export const metadata = { title: 'फ्लैश पॉप-अप' }
export const dynamic = 'force-dynamic'

export default function PopupPage() {
  return <FlashDesk mode="popup" />
}
