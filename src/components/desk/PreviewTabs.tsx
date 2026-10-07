'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Desktop / Mobile / Social (/ Video) preview of the exact public page. Iframes are scaled down to fit the phone or laptop. */
export function PreviewTabs({ src, social, video }: { src: string; social: ReactNode; video?: ReactNode }) {
  const tabs = [
    ['desktop', '🖥 डेस्कटॉप'],
    ['mobile', '📱 मोबाइल'],
    ...(video ? [['video', '🎬 वीडियो'] as const] : []),
    ['social', '📣 सोशल शेयर'],
  ] as const
  const [tab, setTab] = useState<string>('desktop')
  return (
    <div>
      <div role="tablist" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${tab === k ? 'bg-navy-900 text-white' : 'border border-line bg-bg'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'desktop' && <Scaled src={src} width={1280} height={1600} />}
      {tab === 'mobile' && (
        <div className="mx-auto w-[min(100%,390px)] overflow-hidden rounded-[2rem] border-8 border-navy-950 shadow-xl">
          <Scaled src={src} width={390} height={780} />
        </div>
      )}
      {tab === 'video' && video}
      {tab === 'social' && social}
    </div>
  )
}

function Scaled({ src, width, height }: { src: string; width: number; height: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / width))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={box} className="w-full overflow-hidden rounded-lg border border-line bg-white" style={{ height: height * scale }}>
      <iframe src={src} title="preview" style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }} />
    </div>
  )
}
