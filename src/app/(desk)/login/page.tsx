import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/desk/LoginForm'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'लॉगिन' }

/** Only same-site paths are allowed as the place to go after login. */
const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/desk')

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; redirect?: string }> }) {
  const sp = await searchParams
  const next = safeNext(sp.next || sp.redirect)
  if (await currentUser()) redirect(next)
  return <LoginForm next={next} />
}
