import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShareCard } from '@/components/ShareCard'
import { StoryTools } from '@/components/StoryTools'
import { currentUser } from '@/lib/auth'
import { asCat, cardImage, getArticleForPreview, getSettings } from '@/lib/data'
import { downloadName } from '@/lib/fileName'
import { formatDate, t } from '@/lib/i18n'
import { newsStatus } from '@/lib/newsStatus'
import { allowed, loadPermissions } from '@/lib/permissions'
import { db } from '@/lib/data'
import { paths, siteUrl } from '@/lib/paths'
import { logDownload } from '../../actions'

export const metadata = { title: 'डाउनलोड' }

const row = 'flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 font-semibold hover:bg-surface'

/** Editor/Admin download centre for one story. Every file carries the News ID; every download is audited. */
export default async function DownloadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = (await currentUser())!
  await loadPermissions(await db())
  if (!allowed(user, 'download')) return <p className="rounded-xl bg-bg p-6 text-center">डाउनलोड का अधिकार आपकी भूमिका में नहीं है।</p>
  const a = await getArticleForPreview('hi', id, user)
  if (!a) notFound()
  const d = t('hi')
  const settings = await getSettings('hi')
  const img = cardImage(a, 'hero')
  const stamp = a.firstPublishedAt || a.publishedAt
  const shortUrl = a.newsId ? `${siteUrl()}${paths.newsShort(a.newsId)}` : `${siteUrl()}${paths.article('hi', a.slug)}`
  const live = ['published', 'updated'].includes(newsStatus(a))
  const log = logDownload.bind(null, a.id)

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-xl font-extrabold text-navy-900">⬇ डाउनलोड</h1>
      <div className="rounded-xl bg-bg p-4">
        <p className="font-semibold">{a.title}</p>
        <p className="mt-1 text-xs text-muted">फ़ाइल का नाम: {downloadName(a.newsId, a.title, stamp, '…')}</p>
      </div>
      <div className="space-y-2">
        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="mb-2 font-semibold">🖼 न्यूज़ कार्ड (फोटो, QR और News ID के साथ)</p>
          <StoryTools
            staff
            onDownload={log}
            title={a.title}
            shortUrl={shortUrl}
            printHref={live ? `${paths.article('hi', a.slug)}/print` : `/desk/news/${a.id}/preview`}
            fileName={downloadName(a.newsId, a.title, stamp, 'png').replace(/\.png$/, '')}
            labels={{ print: d.printPdf, image: d.downloadImage, share: d.shareLinkLabel, busy: d.imageBusy, fail: d.imageFail, copied: d.linkCopied }}
          >
            <ShareCard lang="hi" title={a.title} subtitle={a.subheadline || a.excerpt} category={asCat(a.category)?.title} date={formatDate(stamp, 'hi')} img={img} newsId={a.newsId} shortUrl={shortUrl} siteName={settings.siteName || d.siteName} />
          </StoryTools>
        </div>
        <a className={row} href={`/api/desk/download?id=${a.id}&kind=copy`}>
          📄 प्रकाशित कॉपी (टेक्स्ट) <span aria-hidden>⬇</span>
        </a>
        {live && (
          <Link className={row} href={`${paths.article('hi', a.slug)}/print?auto=1`} target="_blank">
            🖨 PDF (प्रिंट → “Save as PDF”) <span aria-hidden>↗</span>
          </Link>
        )}
        {img && (
          <a className={row} href={`/api/desk/download?id=${a.id}&kind=photo`}>
            🏞 फोटो / थंबनेल <span aria-hidden>⬇</span>
          </a>
        )}
      </div>
      <p className="text-xs text-muted">हर डाउनलोड ऑडिट लॉग में दर्ज होता है। आम पाठकों को डाउनलोड का कोई विकल्प नहीं दिखता।</p>
    </div>
  )
}
