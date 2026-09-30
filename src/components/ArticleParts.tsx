import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'
import Link from 'next/link'
import type { Article } from '@/payload-types'
import { asMedia, type Card } from '@/lib/data'
import { formatDate, t, type Lang } from '@/lib/i18n'
import { paths } from '@/lib/paths'
import { QuestionBadge, VerdictBadge } from './ui'

type RT = Parameters<typeof LexicalRichText>[0]['data']
export const RichText = ({ data, className = '' }: { data?: unknown; className?: string }) =>
  data ? (
    <LexicalRichText
      data={data as RT}
      className={`article-body prose max-w-none prose-neutral dark:prose-invert prose-headings:font-display prose-headings:text-navy-900 prose-a:text-link dark:prose-headings:text-gold-300 ${className}`}
    />
  ) : null

const Box = ({ title, children, tone = 'navy' }: { title: string; children: React.ReactNode; tone?: 'navy' | 'gold' | 'red' | 'green' }) => {
  const border = { navy: 'border-navy-700', gold: 'border-gold-500', red: 'border-alert-600', green: 'border-india-600' }[tone]
  return (
    <section className={`my-8 rounded-lg border border-line border-l-4 ${border} bg-surface p-5`}>
      <h2 className="mb-3 font-display text-xl font-bold text-navy-900 dark:text-gold-300">{title}</h2>
      {children}
    </section>
  )
}

export function FactCheckBox({ a, lang }: { a: Article; lang: Lang }) {
  const d = t(lang)
  const fc = a.factCheck
  if (!fc?.verdict && !fc?.claim) return null
  return (
    <Box title={d.factCheck} tone="red">
      {fc.claim && (
        <p className="text-lg">
          <strong>{d.claim}:</strong> “{fc.claim}”
        </p>
      )}
      {fc.claimedBy && (
        <p className="mt-1 text-sm text-muted">
          {d.claimedBy}: {fc.claimedBy}
        </p>
      )}
      <p className="mt-4 flex items-center gap-3">
        <strong>{d.verdict}:</strong> <VerdictBadge verdict={fc.verdict} lang={lang} large />
      </p>
    </Box>
  )
}

const STAGES = ['problem', 'complaint', 'department', 'response', 'action', 'result'] as const
const DOT: Record<string, string> = { done: 'bg-india-600 text-white', progress: 'bg-gold-400 text-navy-950', pending: 'bg-bg text-muted border-2 border-line' }

/** समस्या → शिकायत → संबंधित विभाग → जवाब → कार्रवाई → परिणाम. Stages without an entry show as pending. */
export function TrackerTimeline({ steps, lang }: { steps: NonNullable<Article['tracker']>; lang: Lang }) {
  const d = t(lang)
  const byStage = new Map(steps.map((s) => [s.stage, s]))
  return (
    <Box title={`📍 ${d.tracker}`} tone="green">
      <ol className="relative ml-4 border-l-2 border-line md:ml-0 md:flex md:border-t-2 md:border-l-0">
        {STAGES.map((stage, i) => {
          const s = byStage.get(stage)
          const status = s?.status || 'pending'
          return (
            <li key={stage} className="relative mb-6 pl-8 md:mb-0 md:flex-1 md:pt-8 md:pr-3 md:pl-0">
              <span
                className={`absolute top-0 -left-[15px] flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold md:-top-[15px] md:left-0 ${DOT[status]}`}
                aria-hidden
              >
                {status === 'done' ? '✓' : i + 1}
              </span>
              <p className="font-display font-bold">{d.stages[stage]}</p>
              <p className="text-xs text-muted">
                {d.stepStatus[status as 'done']}
                {s?.date ? ` · ${formatDate(s.date, lang)}` : ''}
              </p>
              {s?.note && <p className="mt-1 text-sm">{s.note}</p>}
            </li>
          )
        })}
      </ol>
    </Box>
  )
}

const INV_KEYS = ['issue', 'facts', 'documents', 'response', 'groundReality', 'publicQuestions', 'answer', 'followUp'] as const
export function InvestigationSections({ a, lang }: { a: Article; lang: Lang }) {
  const d = t(lang)
  const inv = a.investigation
  if (!inv) return null
  const present = INV_KEYS.filter((k) => inv[k])
  if (!present.length) return null
  return (
    <div className="my-8">
      <nav aria-label="Contents" className="mb-6 flex flex-wrap gap-2">
        {present.map((k, i) => (
          <a key={k} href={`#inv-${k}`} className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface">
            {i + 1}. {d.investigation[k]}
          </a>
        ))}
      </nav>
      {present.map((k, i) => (
        <section key={k} id={`inv-${k}`} className="mb-8">
          <h2 className="mb-3 flex items-center gap-3 font-display text-2xl font-bold text-navy-900 dark:text-gold-300">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm text-gold-300 dark:bg-gold-400 dark:text-navy-950">{i + 1}</span>
            {d.investigation[k]}
          </h2>
          <RichText data={inv[k]} />
        </section>
      ))}
    </div>
  )
}

export function DocumentsBox({ docs, lang }: { docs: NonNullable<Article['documents']>; lang: Lang }) {
  const d = t(lang)
  if (!docs.length) return null
  return (
    <Box title={`📄 ${d.documentsSpeak}`} tone="gold">
      <ul className="grid gap-4 sm:grid-cols-2">
        {docs.map((doc) => {
          const m = asMedia(doc.file)
          if (!m?.url) return null
          const isPdf = m.mimeType === 'application/pdf'
          return (
            <li key={doc.id} className="overflow-hidden rounded-md border border-line bg-bg">
              {isPdf ? (
                <object data={m.url} type="application/pdf" className="h-72 w-full" aria-label={doc.title || m.filename || ''}>
                  <p className="p-4 text-sm">PDF</p>
                </object>
              ) : (
                <a href={m.url} target="_blank" rel="noopener" className="relative block aspect-[4/3] bg-surface">
                  <Image src={m.url} alt={m.alt || doc.title || ''} fill sizes="(min-width:640px) 40vw, 100vw" className="object-contain" />
                </a>
              )}
              <div className="p-3 text-sm">
                {doc.title && <p className="font-bold">{doc.title}</p>}
                {doc.source && (
                  <p>
                    <span className="text-muted">{d.source}:</span> {doc.source}
                  </p>
                )}
                {doc.reference && (
                  <p>
                    <span className="text-muted">{d.reference}:</span> {doc.reference}
                  </p>
                )}
                <a href={m.url} target="_blank" rel="noopener" className="mt-1 inline-block font-semibold text-link underline">
                  {d.openDocument} ↗
                </a>
              </div>
            </li>
          )
        })}
      </ul>
    </Box>
  )
}

export function SourcesBox({ sources, lang }: { sources: NonNullable<Article['sources']>; lang: Lang }) {
  if (!sources.length) return null
  return (
    <Box title={`🔗 ${t(lang).sources}`}>
      <ul className="list-disc space-y-1 pl-5">
        {sources.map((s) => (
          <li key={s.id}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-link underline">
                {s.label}
              </a>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ul>
    </Box>
  )
}

export function FollowUps({ parent, next, lang, current }: { parent?: Card; next: Card[]; lang: Lang; current: Article }) {
  const d = t(lang)
  if (!parent && !next.length) return null
  const chain = [...(parent ? [{ a: parent, label: d.originalQuestion }] : []), { a: current as unknown as Card, label: '' }, ...next.map((a) => ({ a, label: '' }))]
  return (
    <Box title={`❓ ${d.followUps}`} tone="gold">
      <ol className="space-y-3">
        {chain.map(({ a, label }) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2">
            <QuestionBadge status={a.questionStatus || (a.id === parent?.id ? 'asked' : undefined)} lang={lang} />
            {a.id === current.id ? (
              <strong>{a.title}</strong>
            ) : (
              <Link href={paths.article(lang, a.slug)} className="font-semibold text-link underline">
                {a.title}
              </Link>
            )}
            <span className="text-xs text-muted">
              {label && `${label} · `}
              {formatDate(a.publishedAt, lang)}
            </span>
          </li>
        ))}
      </ol>
    </Box>
  )
}

export function CorrectionsBox({ items, lang }: { items: { id: number; date: string; summary: string; type?: string | null }[]; lang: Lang }) {
  const d = t(lang)
  if (!items.length) return null
  return (
    <Box title={`⚠ ${d.correctionNote}`} tone="red">
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id}>
            <span className="text-sm font-semibold">{formatDate(c.date, lang)}:</span> {c.summary}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <Link href={paths.page(lang, 'correction-policy')} className="text-link underline">
          {d.correctionPolicyLink}
        </Link>
      </p>
    </Box>
  )
}
