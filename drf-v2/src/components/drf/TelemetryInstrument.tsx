import type { Locale, PortfolioContent } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'
import { EvidenceList } from './ContentBlocks.tsx'
import { InstrumentValue } from './InstrumentValue.tsx'

export function TelemetryInstrument({ content, locale }: { content: PortfolioContent; locale: Locale }) {
  const t = uiLabels(locale)
  return <div className="drf-telemetry-instrument">
    <div className="drf-telemetry-readouts">
      {content.metrics.map(metric => <article key={metric.id} className="drf-telemetry-readout" data-metric-id={metric.id} data-metric-state={metric.state}>
        <p className="drf-readout-project">{content.projects.find(project => project.id === metric.projectId)?.title[locale]}</p>
        <div className="drf-readout-caption"><h3>{metric.label[locale]}</h3><span className="drf-code">{t[metric.state]}</span></div>
        <p className="drf-telemetry-number"><InstrumentValue value={metric.value === null ? '—' : new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 20 }).format(metric.value)} /><span className="drf-readout-unit">{metric.unit === 'records' ? t.records : metric.unit}</span></p>
        <p className="drf-readout-period"><span>{t.period}: {metric.period[locale]}</span></p>
        <p className="drf-readout-context"><span className="drf-field-label">{t.context}</span>{metric.context?.[locale] ?? t.missing}</p>
        <details className="drf-metric-context drf-readout-evidence">
          <summary>{t.sources}<span aria-hidden="true" /></summary>
          <div className="drf-metric-context-body"><EvidenceList content={content} locale={locale} ids={metric.evidenceIds} /></div>
        </details>
        <p className="drf-readout-source">{content.evidence.filter(source => metric.evidenceIds.includes(source.id)).map(source => source.label[locale]).join(' · ')}</p>
      </article>)}
    </div>
  </div>
}
