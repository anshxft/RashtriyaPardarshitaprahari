import sharp from 'sharp'

/**
 * Tiny markup → Lexical JSON for seed content.
 * "## " = h2, "### " = h3, "- " = bullet item, blank line = new paragraph, **bold** inline.
 */
const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }
const inline = (s: string) =>
  s
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => {
      const bold = part.startsWith('**') && part.endsWith('**')
      return { type: 'text', text: bold ? part.slice(2, -2) : part, format: bold ? 1 : 0, detail: 0, mode: 'normal', style: '', version: 1 }
    })

export function rt(src: string) {
  const children: unknown[] = []
  let list: { children: unknown[] } | null = null
  for (const block of src.trim().split(/\n\s*\n|\n(?=##|- )/)) {
    const line = block.trim().replace(/\s*\n\s*/g, ' ')
    if (!line) continue
    if (line.startsWith('- ')) {
      if (!list) {
        list = { type: 'list', listType: 'bullet', start: 1, tag: 'ul', ...base, children: [] } as { children: unknown[] }
        children.push(list)
      }
      list!.children.push({ type: 'listitem', value: list!.children.length + 1, ...base, children: inline(line.slice(2)) })
      continue
    }
    list = null
    const h = /^(#{2,3}) (.*)$/.exec(line)
    if (h) children.push({ type: 'heading', tag: h[1].length === 2 ? 'h2' : 'h3', ...base, children: inline(h[2]) })
    else children.push({ type: 'paragraph', ...base, textFormat: 0, textStyle: '', children: inline(line) })
  }
  return { root: { type: 'root', ...base, children } } as never
}

/** Minimal valid one-page PDF (Helvetica, ASCII) — used for the fictional "Documents Speak" sample. */
export function samplePdf(lines: string[]) {
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`)
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 60 ${780 - i * 22} Td (${esc(l)}) Tj ET`).join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
  ]
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out))
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(out)
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}

/** A "scanned letter" style PNG with a big SAMPLE watermark. */
export async function sampleLetterPng(lines: string[]) {
  const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  const body = lines
    .map((l, i) => `<text x="70" y="${170 + i * 44}" font-size="${i === 0 ? 34 : 26}" font-weight="${i === 0 ? 700 : 400}" font-family="Nirmala UI, Noto Sans Devanagari, sans-serif" fill="#1a1a1a">${esc(l)}</text>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1300">
  <rect width="100%" height="100%" fill="#fbf8f0"/><rect x="40" y="40" width="920" height="1220" fill="none" stroke="#c9b98f" stroke-width="3"/>
  <line x1="70" y1="120" x2="930" y2="120" stroke="#0b1f4d" stroke-width="4"/>
  ${body}
  <text x="500" y="820" font-size="150" font-weight="800" fill="#d0201a" fill-opacity="0.18" text-anchor="middle" transform="rotate(-30 500 820)" font-family="sans-serif">SAMPLE / नमूना</text>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
