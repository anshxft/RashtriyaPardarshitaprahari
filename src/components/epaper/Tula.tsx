/** Digital 3D-style तुला (scales of justice) for the e-paper masthead — pure SVG, so it stays sharp in print/PDF. */
export function Tula({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="तुला">
      <defs>
        <linearGradient id="tula-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#7a5a12" />
          <stop offset=".45" stopColor="#f6d77a" />
          <stop offset="1" stopColor="#9a7218" />
        </linearGradient>
        <linearGradient id="tula-pan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#8a6414" />
        </linearGradient>
        <radialGradient id="tula-knob" cx=".35" cy=".35" r=".7">
          <stop offset="0" stopColor="#fff6d0" />
          <stop offset="1" stopColor="#a17a1c" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="30" ry="5" fill="#0b1f4d" opacity=".25" />
      <path d="M38 108 h44 l-6 -8 h-32 z" fill="url(#tula-metal)" stroke="#5c4310" strokeWidth=".8" />
      <rect x="57" y="24" width="6" height="77" rx="2" fill="url(#tula-metal)" stroke="#5c4310" strokeWidth=".8" />
      <rect x="14" y="26" width="92" height="5" rx="2.5" fill="url(#tula-metal)" stroke="#5c4310" strokeWidth=".8" />
      <circle cx="60" cy="22" r="6" fill="url(#tula-knob)" stroke="#5c4310" strokeWidth=".8" />
      <g stroke="#7a5a12" strokeWidth="1">
        <path d="M18 31 L6 70 M18 31 L30 70" />
        <path d="M102 31 L90 70 M102 31 L114 70" />
      </g>
      <path d="M4 70 h28 a14 8 0 0 1 -28 0 z" fill="url(#tula-pan)" stroke="#5c4310" strokeWidth=".8" />
      <path d="M88 70 h28 a14 8 0 0 1 -28 0 z" fill="url(#tula-pan)" stroke="#5c4310" strokeWidth=".8" />
      <ellipse cx="18" cy="70" rx="14" ry="2.2" fill="#fff3c4" opacity=".7" />
      <ellipse cx="102" cy="70" rx="14" ry="2.2" fill="#fff3c4" opacity=".7" />
      {/* digital accent: tricolour dots on the base */}
      <circle cx="52" cy="104" r="1.6" fill="#f47c20" />
      <circle cx="60" cy="104" r="1.6" fill="#fff" stroke="#0b1f4d" strokeWidth=".5" />
      <circle cx="68" cy="104" r="1.6" fill="#138808" />
    </svg>
  )
}
