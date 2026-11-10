'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { deleteLooseVideoAction } from '@/app/(desk)/desk/video/actions'

/** Delete for a video that is not (yet) a news story. */
export function DeleteVideoButton({ id, title, after }: { id: number; title: string; after?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full bg-alert-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(`यह वीडियो हमेशा के लिए हटाएं?\n\n${title}`)) return
        start(async () => {
          const r = await deleteLooseVideoAction(id)
          if (!r.ok) return window.alert(r.error)
          if (after) router.push(after)
          else router.refresh()
        })
      }}
    >
      🗑 हटाएं
    </button>
  )
}
