import type { CSSProperties } from 'react'

const SAFFRON: CSSProperties = { color: '#f47c20' }
// White word stays readable on a white page: navy outline painted behind the fill.
const WHITE: CSSProperties = { color: '#fff', WebkitTextStroke: '0.06em #0b1f4d', paintOrder: 'stroke fill' }
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
