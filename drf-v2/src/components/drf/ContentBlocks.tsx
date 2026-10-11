import type { Locale, Metric, PortfolioContent, Project } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'
import { InstrumentValue } from './InstrumentValue.tsx'
import { EvidenceExplorer } from './EvidenceExplorer.tsx'

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
  ) : null
}

export function MetricCards({ content, locale, metrics = content.metrics }: ContentProps & { metrics?: readonly Metric[] }) {
  const t = uiLabels(locale)
  return metrics.length ? <div className="drf-metrics">{metrics.map(metric => {
    const project = content.projects.find(project => project.id === metric.projectId)
    const unit = metric.unit === 'records' ? t.records : metric.unit
    return <article className="drf-metric" key={metric.id}>
      <span className="drf-tag">{t[metric.state]}</span>
      <h4>{metric.label[locale]}</h4>
      <p className="drf-metric-value"><InstrumentValue value={metric.value === null ? '—' : new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 20 }).format(metric.value)} /> <span className="drf-metric-unit">{unit}</span></p>
      {project && <p className="drf-muted">{project.title[locale]}</p>}
      <dl><div><dt>{t.unit}</dt><dd>{unit}</dd></div><div><dt>{t.period}</dt><dd>{metric.period[locale]}</dd></div>
        <div><dt>{t.context}</dt><dd>{metric.context?.[locale] ?? t.missing}</dd></div></dl>
      <p className="drf-field-label">{t.sources}</p>
      <EvidenceList content={content} locale={locale} ids={metric.evidenceIds} />
    </article>
  })}</div> : <p className="drf-muted">{t.noMetrics}</p>
}

export function ProjectDetail({ project, content, locale, section = 'all', qualification = true }: ContentProps & { project: Project; section?: 'all' | 'overview' | 'engineering' | 'evidence'; qualification?: boolean }) {
  const t = uiLabels(locale)
  const media = content.media.filter(media => project.mediaIds.includes(media.id))
  const metrics = content.metrics.filter(metric => project.metricIds.includes(metric.id))
  const overview = section === 'all' || section === 'overview'
  const engineering = section === 'all' || section === 'engineering'
  const evidence = section === 'all' || section === 'evidence'
  const sources = project.evidenceIds.length > 0 ? <><h4>{t.sources}</h4>{section === 'all' ? <EvidenceList content={content} locale={locale} ids={project.evidenceIds} /> : <EvidenceExplorer content={content} locale={locale} ids={project.evidenceIds} />}</> : null
  return <div className="drf-project-detail">
    {overview && <>
    {qualification && <p className="drf-tag">{project.contentStatus === 'pending-evidence' ? t.pending : t.reviewed}</p>}
    <p className="drf-lead">{project.summary[locale]}</p>
    {project.technologies.length > 0 && <div className="drf-case-stack"><h4>{t.stack}</h4><ul className="drf-chips">{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul></div>}
    {(project.problem || project.contribution || project.productStatus) && <dl className="drf-facts">
      {project.problem && <div><dt>{t.problem}</dt><dd>{project.problem[locale]}</dd></div>}
      {project.contribution && <div><dt>{t.contribution}</dt><dd>{project.contribution[locale]}</dd></div>}
      {project.productStatus && <div><dt>{t.productStatus}</dt><dd>{project.productStatus[locale]}</dd></div>}
    </dl>}
    </>}
    {engineering && <>
    {project.decisions.length > 0 && <><h4>{t.decisions}</h4><ul className="drf-text-list">{project.decisions.map((decision, i) => <li key={i}>{decision[locale]}</li>)}</ul></>}
    {project.limitations.length > 0 && <div className="drf-callout"><h4>{t.limitations}</h4><ul className="drf-text-list">{project.limitations.map((limit, i) => <li key={i}>{limit[locale]}</li>)}</ul></div>}
    </>}
    {evidence && <>
    {section === 'evidence' && sources}
    {metrics.length > 0 && <><h4>{content.zones.find(zone => zone.id === 'telemetry')?.label[locale]}</h4><MetricCards content={content} locale={locale} metrics={metrics} /></>}
    {section === 'all' && sources}
    </>}
    {overview && <>
    {media.map(item => <figure key={item.id}><img src={item.src} alt={item.alt[locale]} loading="lazy" /><figcaption>{item.credit[locale]} · {item.licenseRef}</figcaption></figure>)}
    <div className="drf-links">
      {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">{t.repository} ↗</a>}
      {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">{t.demo} ↗</a>}
    </div>
    {project.demoUrl && <p className="drf-muted"><small>{t.demoNotice}</small></p>}
    </>}
  </div>
}
