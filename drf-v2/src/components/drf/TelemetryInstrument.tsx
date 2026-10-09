import type { Locale, PortfolioContent } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'
import { EvidenceList } from './ContentBlocks.tsx'
import { InstrumentValue } from './InstrumentValue.tsx'

export function TelemetryInstrument({ content, locale }: { content: PortfolioContent; locale: Locale }) {
  const t = uiLabels(locale)
  return <div className="drf-telemetry-instrument">
    <div className="drf-telemetry-readouts">
      {content.metrics.map((metric, index) => <article key={metric.id} className="drf-telemetry-readout" data-metric-id={metric.id}>
        <div className="drf-readout-caption"><h3>{metric.label[locale]}</h3><span className="drf-code">{t[metric.state]}</span></div>
        <p className="drf-telemetry-number"><InstrumentValue value={metric.value === null ? '—' : new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 20 }).format(metric.value)} /><span className="drf-readout-unit">{metric.unit === 'records' ? t.records : metric.unit}</span></p>
        <p className="drf-readout-period"><span className="drf-channel" aria-hidden="true">CH–{String(index + 1).padStart(2, '0')}</span><span>{metric.period[locale]}</span></p>
      </article>)}
    </div>
    <div className="drf-evidence-console">
      <p className="drf-code">{t.sources}</p>
      {content.metrics.map(metric => <details key={metric.id} className="drf-metric-context">
        <summary>{metric.label[locale]}<span aria-hidden="true">+</span></summary>
        <div className="drf-metric-context-body">
          <p className="drf-field-label">{t.context}</p><p>{metric.context?.[locale] ?? t.missing}</p>
          <EvidenceList content={content} locale={locale} ids={metric.evidenceIds} />
        </div>
      </details>)}
    </div>
  </div>
}
