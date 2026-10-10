import { useState } from 'react'
import { ArrowUpRight, FileText } from 'lucide-react'
import type { Locale, PortfolioContent } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'

// Inspection of a source record, never an inferred evidence tier or ranking.
export function EvidenceExplorer({ content, locale, ids }: { content: PortfolioContent; locale: Locale; ids: readonly string[] }) {
  const t = uiLabels(locale)
  const sources = ids.flatMap(id => content.evidence.filter(source => source.id === id))
  const [selectedId, setSelectedId] = useState(sources[0]?.id)
  const source = sources.find(item => item.id === selectedId) ?? sources[0]
  if (!source) return null
  return <div className="drf-evidence-explorer">
    <ul className="drf-source-index" aria-label={t.sources}>
      {sources.map((item, index) => <li key={item.id}><button type="button" data-source-id={item.id} aria-label={item.label[locale]} title={item.label[locale]} aria-pressed={source.id === item.id} onClick={() => setSelectedId(item.id)}><span className="drf-code">{String(index + 1).padStart(2, '0')}</span><FileText size={14} aria-hidden="true" /></button></li>)}
    </ul>
    <section className="drf-source-detail" data-source-selected={source.id} aria-label={t.sourceInspection} aria-live="polite">
      <p className="drf-field-label">{t.sourceInspection}</p>
      <h4>{source.label[locale]}</h4>
      <dl><div><dt>{t.checked}</dt><dd><time dateTime={source.checkedAt}>{new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { timeZone: 'UTC' }).format(new Date(`${source.checkedAt}T00:00:00Z`))}</time></dd></div>
        {source.revision && <div><dt>{t.revision}</dt><dd><code>{source.revision}</code></dd></div>}
      </dl>
      {source.publicUrl && <a href={source.publicUrl} target="_blank" rel="noopener noreferrer">{t.openSource}<ArrowUpRight size={14} aria-hidden="true" /></a>}
    </section>
  </div>
}
