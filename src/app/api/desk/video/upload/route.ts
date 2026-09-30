import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Issues short-lived tokens so the browser can send big videos straight to Vercel Blob (bypassing the 4.5 MB function limit). */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const user = await currentUser()
        if (!user) throw new Error('login required')
        if (!pathname.startsWith('videos/original/')) throw new Error('bad path')
        return { allowedContentTypes: ['video/*'], maximumSizeInBytes: 1_500_000_000, addRandomSuffix: true }
      },
      onUploadCompleted: async () => {},
    })
    return Response.json(json)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
