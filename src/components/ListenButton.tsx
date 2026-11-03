'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * “खबर सुनें”: reads the story aloud with the reader's own device voice (browser speech — free, nothing sent anywhere).
 * Prefers a Hindi female voice. Speaks sentence by sentence because some phones stop long utterances part-way.
 * The text spoken is exactly the published text.
 */
export function ListenButton({ parts, lang, label }: { parts: string[]; lang: 'hi' | 'en'; label?: string }) {
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [supported, setSupported] = useState(false)
  const queue = useRef<string[]>([])
  const hi = lang === 'hi'

  useEffect(() => {
    setSupported('speechSynthesis' in window)
    return () => {
      if ('speechSynthesis' in window) speechSynthesis.cancel()
    }
  }, [])

  const voice = () => {
    const code = hi ? 'hi' : 'en'
    const all = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(code))
    return all.find((v) => /female|lekha|swara|kalpana|heera|google हिन्दी|google hindi|zira|samantha/i.test(v.name)) || all[0]
  }

  const next = () => {
    const s = queue.current.shift()
    if (!s) return setState('idle')
    const u = new SpeechSynthesisUtterance(s)
    u.lang = hi ? 'hi-IN' : 'en-IN'
    const v = voice()
    if (v) u.voice = v
    u.rate = 0.95
    u.pitch = 1.05
    u.onend = next
    u.onerror = () => setState('idle')
    speechSynthesis.speak(u)
  }

  const start = () => {
    speechSynthesis.cancel()
    queue.current = parts
      .join('\n')
      .split(/(?<=[।.!?])\s+|\n+/)
      .map((x) => x.trim())
      .filter(Boolean)
    setState('playing')
    // Some browsers load their voice list late
    if (!speechSynthesis.getVoices().length) speechSynthesis.onvoiceschanged = () => ((speechSynthesis.onvoiceschanged = null), next())
    else next()
  }

  if (!supported) return null
  const btn = 'inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold'
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      {state === 'idle' ? (
        <button type="button" onClick={start} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
          </svg>
          {label || (hi ? 'खबर सुनें' : 'Listen to this story')}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => (state === 'playing' ? (speechSynthesis.pause(), setState('paused')) : (speechSynthesis.resume(), setState('playing')))}
            className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}
          >
            {state === 'playing' ? `⏸ ${hi ? 'रोकें' : 'Pause'}` : `▶ ${hi ? 'आगे सुनें' : 'Resume'}`}
          </button>
          <button type="button" onClick={() => ((queue.current = []), speechSynthesis.cancel(), setState('idle'))} className={`${btn} border border-line hover:bg-surface`}>
            ⏹ {hi ? 'बंद करें' : 'Stop'}
          </button>
        </>
      )}
    </div>
  )
}
