import type { Locale, Metric, PortfolioContent, Project } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'

type ContentProps = { content: PortfolioContent; locale: Locale }

export function EvidenceList({ content, locale, ids }: ContentProps & { ids: readonly string[] }) {
  const t = uiLabels(locale)
  const sources = content.evidence.filter(source => ids.includes(source.id))
  return sources.length ? (
    <ul className="drf-evidence">
      {sources.map(source => <li key={source.id}>
        {source.publicUrl ? <a href={source.publicUrl} target="_blank" rel="noopener noreferrer">{source.label[locale]} ↗</a> : <span>{source.label[locale]}</span>}
        <small>{t.checked}: <time dateTime={source.checkedAt}>{new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { timeZone: 'UTC' }).format(new Date(`${source.checkedAt}T00:00:00Z`))}</time>
          {source.revision && <> · {t.revision}: <code>{source.revision}</code></>}
        </small>
      </li>)}
    </ul>
  ) : <p className="drf-muted">{t.noSources}</p>
}

export function MetricCards({ content, locale, metrics = content.metrics }: ContentProps & { metrics?: readonly Metric[] }) {
  const t = uiLabels(locale)
  return metrics.length ? <div className="drf-metrics">{metrics.map(metric => {
    const project = content.projects.find(project => project.id === metric.projectId)
    const unit = metric.unit === 'records' ? t.records : metric.unit
    return <article className="drf-metric" key={metric.id}>
      <span className="drf-tag">{t[metric.state]}</span>
      <h4>{metric.label[locale]}</h4>
      <p className="drf-metric-value">{metric.value === null ? '—' : new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 20 }).format(metric.value)} <span>{unit}</span></p>
      {project && <p className="drf-muted">{project.title[locale]}</p>}
      <dl><div><dt>{t.unit}</dt><dd>{unit}</dd></div><div><dt>{t.period}</dt><dd>{metric.period[locale]}</dd></div>
        <div><dt>{t.context}</dt><dd>{metric.context?.[locale] ?? t.missing}</dd></div></dl>
      <p className="drf-field-label">{t.sources}</p>
      <EvidenceList content={content} locale={locale} ids={metric.evidenceIds} />
    </article>
  })}</div> : <p className="drf-muted">{t.noMetrics}</p>
}

export function ProjectDetail({ project, content, locale }: ContentProps & { project: Project }) {
  const t = uiLabels(locale)
  const media = content.media.filter(media => project.mediaIds.includes(media.id))
  return <div className="drf-project-detail">
    <p className="drf-tag">{project.contentStatus === 'pending-evidence' ? t.pending : t.reviewed}</p>
    <p className="drf-lead">{project.summary[locale]}</p>
    <dl className="drf-facts">
      <div><dt>{t.problem}</dt><dd>{project.problem?.[locale] ?? t.notRecorded}</dd></div>
      <div><dt>{t.contribution}</dt><dd>{project.contribution?.[locale] ?? t.notRecorded}</dd></div>
      <div><dt>{t.productStatus}</dt><dd>{project.productStatus?.[locale] ?? t.notRecorded}</dd></div>
    </dl>
    <h4>{t.stack}</h4><ul className="drf-chips">{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
    <h4>{t.decisions}</h4>
    {project.decisions.length ? <ul className="drf-text-list">{project.decisions.map((decision, i) => <li key={i}>{decision[locale]}</li>)}</ul> : <p className="drf-muted">{t.noDecisions}</p>}
    {project.limitations.length > 0 && <div className="drf-callout"><h4>{t.limitations}</h4><ul className="drf-text-list">{project.limitations.map((limit, i) => <li key={i}>{limit[locale]}</li>)}</ul></div>}
    <h4>{content.zones.find(zone => zone.id === 'telemetry')?.label[locale]}</h4>
    <MetricCards content={content} locale={locale} metrics={content.metrics.filter(metric => project.metricIds.includes(metric.id))} />
    <h4>{t.sources}</h4><EvidenceList content={content} locale={locale} ids={project.evidenceIds} />
    {media.length ? media.map(item => <figure key={item.id}><img src={item.src} alt={item.alt[locale]} loading="lazy" /><figcaption>{item.credit[locale]} · {item.licenseRef}</figcaption></figure>) : <p className="drf-muted drf-media-note">{t.noMedia}</p>}
    <div className="drf-links">
      {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">{t.repository} ↗</a>}
      {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">{t.demo} ↗</a>}
    </div>
    {project.demoUrl && <p className="drf-muted"><small>{t.demoNotice}</small></p>}
  </div>
}
