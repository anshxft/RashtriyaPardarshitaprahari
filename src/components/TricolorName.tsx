import type { CSSProperties } from 'react'

const SAFFRON: CSSProperties = { color: '#f47c20' }
// White word stays readable on a white page: a thin navy outline drawn behind the letters (text-shadow, so the
// fine serif strokes stay solid white instead of looking hollow like -webkit-text-stroke does).
const O = '0.025em'
const WHITE: CSSProperties = { color: '#fff', textShadow: `${O} 0 #0b1f4d, -${O} 0 #0b1f4d, 0 ${O} #0b1f4d, 0 -${O} #0b1f4d, ${O} ${O} #0b1f4d, -${O} -${O} #0b1f4d, ${O} -${O} #0b1f4d, -${O} ${O} #0b1f4d` }
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
