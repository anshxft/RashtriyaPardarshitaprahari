/** Plain text ⇄ Lexical JSON helpers (pure; used by the Desk editor, the e-paper and the home page). */

const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

const para = (text: string) => ({
  type: 'paragraph',
  ...base,
  textFormat: 0,
  textStyle: '',
  children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
})

/** One paragraph per array item. */
export const paragraphsToLexical = (paragraphs: string[]) => ({ root: { type: 'root', ...base, children: paragraphs.filter(Boolean).map(para) } }) as never

type LNode = { type?: string; text?: string; children?: LNode[] }

const blocks = (root: unknown): LNode[] => ((root as { root?: LNode })?.root?.children as LNode[]) || []
const inline = (n: LNode): string => (n.type === 'linebreak' ? '\n' : n.text ?? (n.children || []).map(inline).join(''))

/** Lexical → paragraphs. Headings/list items become their own paragraphs. */
export function lexicalToParagraphs(data: unknown): string[] {
  const out: string[] = []
  for (const b of blocks(data)) {
    if (b.type === 'list') for (const li of b.children || []) out.push(inline(li).trim())
    else out.push(inline(b).trim())
  }
  return out.filter(Boolean)
}

/** True when the body is only plain paragraphs, so the Desk textarea can edit it without losing formatting. */
export function isPlainBody(data: unknown): boolean {
  const ok = (n: LNode): boolean => ['paragraph', 'text', 'linebreak', undefined].includes(n.type) && (n.children || []).every(ok)
  return blocks(data).every(ok)
}

export const lexicalToText = (data: unknown) => lexicalToParagraphs(data).join('\n\n')

/** Short plain-text teaser (used on cards / home). */
export function teaser(data: unknown, max = 240): string {
  const t = lexicalToParagraphs(data).join(' ')
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, '')}…`
}
