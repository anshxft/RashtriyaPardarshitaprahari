/**
 * "Copy → Paste → Auto Format": splits a whole pre-written story into headline / sub-headline / reporter / location /
 * paragraphs. Pure heuristics, no network. The editor can always tweak the result.
 */
export type Parsed = { title?: string; subheadline?: string; reporter?: string; location?: string; paragraphs: string[] }
type Known = { title?: string; subheadline?: string; reporter?: string; location?: string }

const LABELS: [keyof Omit<Parsed, 'paragraphs'>, RegExp][] = [
  ['title', /^(?:शीर्षक|हेडलाइन|मुख्य शीर्षक|Headline|Title)\s*[:：-]\s*(.+)$/i],
  ['subheadline', /^(?:उपशीर्षक|सब\s*हेडिंग|Sub-?headline|Sub)\s*[:：-]\s*(.+)$/i],
  ['reporter', /^(?:रिपोर्टर|रिपोर्ट|संवाददाता|प्रतिनिधि|लेखक|By|Reported by|Reporter)\s*[:：-]\s*(.+)$/i],
  ['location', /^(?:स्थान|डेटलाइन|Location|Dateline)\s*[:：-]\s*(.+)$/i],
]
const END = /[।.?!:"”’)]$/
const DATELINE = /^([ऀ-ॿA-Za-z][ऀ-ॿA-Za-z .]{1,28}?)\s*(?:,\s*\d{1,2}\s+[ऀ-ॿA-Za-z]+(?:\s+\d{4})?)?\s*(?:[:：—–]|-\s|\()/

export function parsePastedStory(raw: string, known: Known = {}): Parsed {
  const text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[   ]/g, ' ')
    .replace(/[​﻿⁠]/g, '') // zero-width junk (keep ZWJ/ZWNJ: Devanagari needs them)
    .replace(/[ \t]+$/gm, '')
    .trim()
  if (!text) return { paragraphs: [] }

  // Paragraphs: blank lines separate them; single line breaks inside a block are hard wraps and are joined.
  const hasBlank = /\n\s*\n/.test(text)
  const isLabel = (l: string) => LABELS.some(([, re]) => re.test(l))
  const blocks: string[] = []
  for (const chunk of hasBlank ? text.split(/\n\s*\n/) : text.split('\n')) {
    let run: string[] = []
    const flush = () => run.length && (blocks.push(run.join(' ')), (run = []))
    for (const l of chunk.split('\n').map((x) => x.trim()).filter(Boolean)) {
      if (isLabel(l)) (flush(), blocks.push(l)) // a labelled line ("रिपोर्ट: …") is always its own block
      else run.push(l)
    }
    flush()
  }

  const out: Parsed = { paragraphs: [] }
  const has = (k: keyof Known) => Boolean(known[k]) || Boolean(out[k])

  // 1. explicitly labelled lines near the top ("शीर्षक: …", "रिपोर्ट: …")
  for (let i = 0; i < Math.min(blocks.length, 8); ) {
    const hit = LABELS.map(([k, re]) => [k, re.exec(blocks[i])] as const).find(([, m]) => m)
    if (hit && !has(hit[0])) {
      out[hit[0]] = hit[1]![1].trim()
      blocks.splice(i, 1)
    } else i++
  }

  // 2. unlabelled top: short line without sentence end = headline; the next one (if short) = sub-headline
  const isHeading = (b?: string, max = 160) => Boolean(b) && b!.length <= max && !END.test(b!)
  if (!has('title') && isHeading(blocks[0])) out.title = blocks.shift()
  if (!has('subheadline') && blocks.length >= 3 && isHeading(blocks[0], 260) && (out.title || known.title)) out.subheadline = blocks.shift()

  // 3. trailing "— Name" byline
  const last = blocks[blocks.length - 1]
  const tail = last && /^(?:—|–|-)\s*([^\n]{2,60})$/.exec(last)
  if (tail && !has('reporter') && !END.test(tail[1])) {
    out.reporter = tail[1].trim()
    blocks.pop()
  }

  // 4. dateline in the first paragraph → location (text keeps the dateline, like a real paper)
  const dl = blocks[0] && DATELINE.exec(blocks[0])
  if (dl && !has('location') && blocks[0].length > 60 && dl[1].trim().split(/\s+/).length <= 3) out.location = dl[1].trim()

  out.paragraphs = blocks
  return out
}
