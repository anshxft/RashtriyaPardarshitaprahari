import type { CSSProperties } from 'react'

const SAFFRON: CSSProperties = { color: '#f47c20' }
// White word stays readable on a white page: a soft dark outline drawn behind the letters. Blurred shadows (not hard
// offsets or -webkit-text-stroke) keep the thin serif strokes clean and solid white at every size.
const EDGE = '#1a1a1a'
const WHITE: CSSProperties = { color: '#fff', textShadow: `0 0 0.03em ${EDGE}, 0 0 0.03em ${EDGE}, 0 0 0.03em ${EDGE}, 0 0 0.03em ${EDGE}, 0 0 0.06em ${EDGE}` }
const GREEN: CSSProperties = { color: '#138808' }
const BANDS = [SAFFRON, WHITE, GREEN]

/** Site name with its words in the tricolour (केसरिया · सफ़ेद · हरा); any word count is split into three bands. */
export function TricolorName({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  return (
    <>
      {words.map((w, i) => (
        <span key={i} style={BANDS[Math.floor((i * 3) / words.length)]}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}
