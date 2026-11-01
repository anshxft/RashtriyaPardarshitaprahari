import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PackageRecorder } from '@/components/desk/PackageRecorder'
import { resolveUrl } from '@/lib/storage'
import type { Video } from '@/payload-types'
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
  // Video news: the video itself — with the whole on-screen package (made in this browser), or the plain file.
  if (a.format === 'video' && a.video) {
    const vid = typeof a.video === 'object' ? a.video.id : a.video
    const v = (await (await db()).findByID({ collection: 'videos', id: vid, depth: 0, draft: true })) as Video
    const src = await resolveUrl(v.processedUrl)
    const stamp0 = a.firstPublishedAt || a.publishedAt
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="font-display text-xl font-extrabold text-navy-900">⬇ वीडियो डाउनलोड</h1>
        <p className="rounded-xl bg-bg p-4 font-semibold">{a.title}</p>
        {src ? (
          <PackageRecorder
            onDownload={logDownload.bind(null, a.id)}
            input={{
              src,
              fileName: downloadName(a.newsId, a.title, stamp0, 'mp4').replace(/\.mp4$/, ''),
              top: a.title,
              bottom: a.subheadline,
              script: a.flash?.enabled ? a.flash?.script : null,
              breaking: Boolean(a.flash?.breaking),
              place: a.videoTag?.place,
              name: a.videoTag?.name,
              role: a.videoTag?.role,
              ticker: a.videoTag?.ticker,
            }}
          />
        ) : (
          <p className="rounded-xl border border-line bg-bg p-4 text-muted">वीडियो अभी तैयार हो रहा है — प्रोसेसिंग पूरी होने के बाद यहाँ आएं।</p>
        )}
        <a className={row} href={`/api/desk/download?video=${vid}&kind=published`}>
          सिर्फ वीडियो (बिना डिज़ाइन, लोगो के साथ) <span aria-hidden>⬇</span>
        </a>
        <p className="text-xs text-muted">हर डाउनलोड ऑडिट लॉग में दर्ज होता है।</p>
      </div>
    )
  }
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
          <p className="mb-2 font-semibold">न्यूज़ कार्ड (फोटो, QR और News ID के साथ)</p>
          <StoryTools
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
          प्रकाशित कॉपी (टेक्स्ट) <span aria-hidden>⬇</span>
        </a>
        {live && (
          <Link className={row} href={`${paths.article('hi', a.slug)}/print?auto=1`} target="_blank">
            PDF (प्रिंट → “Save as PDF”) <span aria-hidden>↗</span>
          </Link>
        )}
        {img && (
          <a className={row} href={`/api/desk/download?id=${a.id}&kind=photo`}>
            फोटो / थंबनेल <span aria-hidden>⬇</span>
          </a>
        )}
      </div>
      <p className="text-xs text-muted">हर डाउनलोड ऑडिट लॉग में दर्ज होता है। आम पाठकों को डाउनलोड का कोई विकल्प नहीं दिखता।</p>
    </div>
  )
}
