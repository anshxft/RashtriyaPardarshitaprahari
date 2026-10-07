/** Official social profiles from Site Settings → Social, as small icon links (header) or labelled chips (footer). */
const ICONS: Record<string, { label: string; path: string }> = {
  facebook: { label: 'Facebook', path: 'M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8Z' },
  x: { label: 'X', path: 'M4 4h4.5l4 5.6L17.2 4H20l-6.2 7.4L20.5 20H16l-4.3-6-5 6H4l6.4-7.6L4 4Z' },
  youtube: {
    label: 'YouTube',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z',
  },
  instagram: {
    label: 'Instagram',
    path: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.8-3.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
  },
  telegram: {
    label: 'Telegram',
    path: 'M21 4 2.8 11.1c-1 .4-1 1 0 1.3l4.6 1.4 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8L22 5.3c.3-1.3-.5-1.8-1-1.3ZM9.6 13.6l8.6-5.4c.4-.3.8-.1.5.2l-7.1 6.5-.3 3-1.7-4.3Z',
  },
  whatsappChannel: {
    label: 'WhatsApp',
    path: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 13.7c-.2.5-1.1 1-1.6 1.1-.4 0-.9.2-3-.6a10.6 10.6 0 0 1-4.2-3.7 4.8 4.8 0 0 1-1-2.6 2.8 2.8 0 0 1 .9-2.1 1 1 0 0 1 .7-.3h.5c.2 0 .4 0 .6.4l.8 1.9c0 .2.1.3 0 .5l-.4.6-.3.4c-.1.1-.2.3 0 .5a7.2 7.2 0 0 0 3.4 3c.2.1.4.1.5 0l.8-1c.2-.2.3-.2.5-.1l1.8.8c.3.2.4.2.5.3a2 2 0 0 1-.2 1.2Z',
  },
}

export function SocialLinks({ social, variant }: { social: Record<string, unknown> | null | undefined; variant: 'icons' | 'chips' }) {
  const items = Object.keys(ICONS).flatMap((k) => {
    const href = social?.[k]
    return typeof href === 'string' && /^https?:\/\//.test(href) ? [{ k, href, ...ICONS[k] }] : []
  })
  if (!items.length) return null
  return (
    <ul className={variant === 'icons' ? 'flex items-center gap-1' : 'flex flex-wrap gap-2 text-sm'}>
      {items.map((i) => (
        <li key={i.k}>
          <a
            href={i.href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={i.label}
            title={i.label}
            className={
              variant === 'icons'
                ? 'flex h-7 w-7 items-center justify-center rounded hover:bg-white/10'
                : 'flex items-center gap-1.5 rounded border border-white/25 px-2 py-1 hover:bg-white/10'
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
              <path d={i.path} />
            </svg>
            {variant === 'chips' && i.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
