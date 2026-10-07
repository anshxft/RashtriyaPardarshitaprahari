import { VideoEditor } from '@/components/desk/VideoEditor'
import { currentUser } from '@/lib/auth'
import { emptyVideo, categoryOptions, mayPublish, teamOptions } from '@/lib/deskData'
import { QUOTA_NOTE } from '@/lib/tts'
import { uploadMode } from '@/lib/videoState'

export const metadata = { title: 'नई वीडियो खबर' }
export const maxDuration = 300 // without the external worker, processing continues after the response (Vercel: up to 5 min)

export default async function NewVideo() {
  const user = (await currentUser())!
  const [categories, team] = await Promise.all([categoryOptions(), teamOptions()])
  return <VideoEditor initial={emptyVideo()} uploadMode={uploadMode()} categories={categories} team={team} mayPublish={mayPublish(user)} ttsNote={QUOTA_NOTE} />
}
