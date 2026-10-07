/** Office phone / WhatsApp helpers. Pure: used by Site Settings validation, the footer, Contact page and the WhatsApp button. */

/** "94319 24522", "+91-9431924522" → "9431924522"; null if it is not a 10-digit Indian mobile number. */
export function mobile10(raw: string | null | undefined): string | null {
  const d = String(raw || '').replace(/\D/g, '')
  const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d
  return /^[6-9]\d{9}$/.test(ten) ? ten : null
}

export const telLink = (n: string) => `tel:+91${mobile10(n)}`
export const waLink = (n: string, text?: string | null) => `https://wa.me/91${mobile10(n)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export type Office = {
  title?: string | null
  address?: string | null
  unit?: string | null
  phones?: { number?: string | null; kind?: 'both' | 'whatsapp' | 'call' | null }[] | null
}
export type ContactNumber = { office: string; number: string; call: boolean; whatsapp: boolean }

/** Every valid number with what it can be used for (invalid entries are skipped, never shown broken). */
export function officeNumbers(offices: Office[] | null | undefined): ContactNumber[] {
  return (offices || []).flatMap((o) =>
    (o.phones || []).flatMap((p) => {
      const n = mobile10(p.number)
      if (!n) return []
      const kind = p.kind || 'both'
      return [{ office: o.title || '', number: n, call: kind !== 'whatsapp', whatsapp: kind !== 'call' }]
    }),
  )
}

/** Payload field validator for an office number. */
export const validateMobile = (v: unknown) => (mobile10(String(v || '')) ? true : '10-digit Indian mobile number / 10 अंकों का मोबाइल नंबर')
