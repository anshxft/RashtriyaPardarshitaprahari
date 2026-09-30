import { TeamEditor } from '@/components/desk/TeamEditor'
import { currentUser } from '@/lib/auth'
import { emptyTeam, mayPublish } from '@/lib/deskData'

export const metadata = { title: 'नया सदस्य' }

export default async function NewMember() {
  const user = (await currentUser())!
  return <TeamEditor initial={emptyTeam()} locale="hi" mayPublish={mayPublish(user)} />
}
