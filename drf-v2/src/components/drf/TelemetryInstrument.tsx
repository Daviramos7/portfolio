import type { Locale, PortfolioContent } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'
import { EvidenceList } from './ContentBlocks.tsx'
import { InstrumentValue } from './InstrumentValue.tsx'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, RotateCcw } from 'lucide-react'
import { InstrumentToolbar } from './InstrumentToolbar.tsx'

export function TelemetryInstrument({ content, locale, reducedMotion }: { content: PortfolioContent; locale: Locale; reducedMotion: boolean }) {
  const t = uiLabels(locale)
  const [selectedId, setSelectedId] = useState(content.metrics[0]?.id)
  const [replay, setReplay] = useState(0)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const copyRequest = useRef(0)
  useEffect(() => () => { copyRequest.current++ }, [])
  const metric = content.metrics.find(item => item.id === selectedId) ?? content.metrics[0]
  if (!metric) return <p>{t.noMetrics}</p>
  const index = content.metrics.indexOf(metric)
  const choose = (id: string) => { copyRequest.current++; setCopyStatus('idle'); setSelectedId(id) }
  const select = (offset: number) => choose(content.metrics[(index + offset + content.metrics.length) % content.metrics.length].id)
  const sources = content.evidence.filter(source => metric.evidenceIds.includes(source.id))
  const value = metric.value === null ? '—' : new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 20 }).format(metric.value)
  const unit = metric.unit === 'records' ? t.records : metric.unit
  const copy = async () => {
    const request = ++copyRequest.current
    setCopyStatus('idle')
    const receipt = [
      content.projects.find(project => project.id === metric.projectId)?.title[locale],
      metric.label[locale], `${value} ${unit}`, t[metric.state],
      `${t.period}: ${metric.period[locale]}`, `${t.context}: ${metric.context?.[locale] ?? t.missing}`,
      `${t.sources}:`, ...sources.map(source => [source.label[locale], source.publicUrl, source.revision].filter(Boolean).join(' · ')),
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(receipt)
      if (request === copyRequest.current) setCopyStatus('copied')
    } catch { if (request === copyRequest.current) setCopyStatus('error') }
  }
  return <div className="drf-telemetry-instrument">
    <div className="drf-instrument-console">
      <label htmlFor="drf-metric-select" className="drf-field-label">{t.chooseMetric}<span className="drf-code">{String(index + 1).padStart(2, '0')} / {String(content.metrics.length).padStart(2, '0')}</span></label>
      <select id="drf-metric-select" value={metric.id} onChange={event => choose(event.currentTarget.value)}>{content.metrics.map(item => <option key={item.id} value={item.id}>{content.projects.find(project => project.id === item.projectId)?.title[locale]} — {item.label[locale]}</option>)}</select>
      <InstrumentToolbar label={t.instrumentControls} commands={[
        { label: t.previousMetric, icon: <ArrowLeft size={16} aria-hidden="true" />, run: () => select(-1) },
        { label: t.nextMetric, icon: <ArrowRight size={16} aria-hidden="true" />, run: () => select(1) },
        { label: t.copyMeasurement, icon: copyStatus === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />, run: () => { void copy() } },
        { label: t.replayValue, icon: <RotateCcw size={16} aria-hidden="true" />, run: () => setReplay(value => value + 1), disabled: reducedMotion },
      ]} />
      <p className="drf-instrument-policy">{reducedMotion ? t.staticValue : t.valueDemo}</p>
    </div>
    <div className="drf-telemetry-readouts">
      <article className="drf-telemetry-readout" data-metric-id={metric.id} data-metric-state={metric.state}>
        <p className="drf-readout-project">{content.projects.find(project => project.id === metric.projectId)?.title[locale]}</p>
        <div className="drf-readout-caption"><h3>{metric.label[locale]}</h3><span className="drf-code">{t[metric.state]}</span></div>
        <p className="drf-telemetry-number"><InstrumentValue reducedMotion={reducedMotion} replay={replay} value={value} /><span className="drf-readout-unit">{unit}</span></p>
        {copyStatus !== 'idle' && <p className="drf-copy-feedback" role="status">{copyStatus === 'copied' ? t.measurementCopied : t.copyUnavailable}</p>}
        <dl className="drf-instrument-metadata"><div><dt>{t.period}</dt><dd>{metric.period[locale]}</dd></div><div><dt>{t.sources}</dt><dd>{sources.map(source => source.label[locale]).join(' · ') || t.noSources}</dd></div></dl>
        <p className="drf-readout-context"><span className="drf-field-label">{t.context}</span>{metric.context?.[locale] ?? t.missing}</p>
        <details key={metric.id} className="drf-metric-context drf-readout-evidence">
          <summary>{t.sources}<span aria-hidden="true" /></summary>
          <div className="drf-metric-context-body"><EvidenceList content={content} locale={locale} ids={metric.evidenceIds} /></div>
        </details>
      </article>
    </div>
    <small className="drf-instrument-credit">{t.numberInspiration} <a href="https://skiper-ui.com/v1/skiper37" target="_blank" rel="noopener noreferrer">Skiper UI</a></small>
  </div>
}
