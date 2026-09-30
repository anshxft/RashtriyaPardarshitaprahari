import { VideoEditor } from '@/components/desk/VideoEditor'
import { currentUser } from '@/lib/auth'
import { emptyVideo, categoryOptions, mayPublish, teamOptions } from '@/lib/deskData'
import { blobConfigured } from '@/lib/storage'

export const metadata = { title: 'नया वीडियो' }
export const maxDuration = 300 // logo processing continues after the response (Vercel Fluid: up to 5 min)

export default async function NewVideo() {
  const user = (await currentUser())!
  const [categories, team] = await Promise.all([categoryOptions(), teamOptions()])
  return <VideoEditor initial={emptyVideo()} blob={blobConfigured()} categories={categories} team={team} mayPublish={mayPublish(user)} />
}
