import QRCode from 'qrcode'

/** Inline SVG QR code (rendered on the server; no client JS, prints crisply). */
export async function Qr({ value, size = 132, className = '' }: { value: string; size?: number; className?: string }) {
  const svg = await QRCode.toString(value, { type: 'svg', margin: 1, width: size, errorCorrectionLevel: 'M', color: { dark: '#0b1f4d', light: '#ffffff' } })
  return <div className={className} style={{ width: size, height: size }} role="img" aria-label="QR code" dangerouslySetInnerHTML={{ __html: svg }} />
}
