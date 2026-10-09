import { useEffect, useRef, useState } from 'react'
import type { Locale } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'

// Loaded only by the DEV/query-gated Recruiter entry. Files never leave the browser.
export default function LocalCvReview({ locale }: { locale: Locale }) {
  const t = uiLabels(locale)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)
  const [invalid, setInvalid] = useState(false)
  const currentUrl = useRef<string | null>(null)
  const generation = useRef(0)
  useEffect(() => () => {
    generation.current++
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
  }, [])

  return <section id="drf-cv-review" className="drf-cv-review" tabIndex={-1} aria-labelledby="drf-cv-review-title">
    <h2 id="drf-cv-review-title">{t.draftCv}</h2>
    <p>{t.localCvNotice}</p>
    <label htmlFor="drf-cv-file">{t.choosePdf}</label>
    <input id="drf-cv-file" type="file" accept="application/pdf,.pdf" onChange={async event => {
      const file = event.currentTarget.files?.[0]
      const request = ++generation.current
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
      currentUrl.current = null
      setPreview(null)
      setInvalid(false)
      if (!file) return
      try {
        const header = await file.slice(0, 5).text()
        if (request !== generation.current) return
        if (header !== '%PDF-') { setInvalid(true); return }
        const url = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }))
        currentUrl.current = url
        setPreview({ url, name: file.name })
      } catch { if (request === generation.current) setInvalid(true) }
    }} />
    {invalid && <p role="alert">{t.invalidPdf}</p>}
    {preview && <>
      <p role="status">{preview.name} · {t.draftCv}</p>
      <a className="drf-button" href={preview.url} download={`draft-${preview.name}`}>{t.downloadDraft} ↧</a>
      <object className="drf-cv-preview" data={preview.url} type="application/pdf" aria-label={t.previewDraft}><p>{t.pdfFallback}</p></object>
    </>}
  </section>
}
