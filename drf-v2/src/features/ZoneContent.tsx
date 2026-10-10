import type { Locale, PortfolioContent, Project, ZoneId } from '../contracts/index.ts'
import { EvidenceList, MetricCards, ProjectDetail } from '../components/drf/ContentBlocks.tsx'
import { uiLabels } from './uiLabels.ts'
import { TelemetryInstrument } from '../components/drf/TelemetryInstrument.tsx'
import { Download } from 'lucide-react'

type Props = {
  content: PortfolioContent
  locale: Locale
  zoneId: ZoneId
  recruiter: boolean
  reducedMotion?: boolean
  selectedProjectId: string | null
  onProject: (project: Project, trigger: HTMLButtonElement) => void
}

export function ZoneContent({ content, locale, zoneId, recruiter, reducedMotion = true, selectedProjectId, onProject }: Props) {
  const t = uiLabels(locale)
  const projectButton = (project: Project) => <button type="button" className="drf-button" onClick={event => onProject(project, event.currentTarget)}>{t.openProject} <span className="drf-sr-only">{project.title[locale]}</span> ↗</button>
  const date = (value: string) => new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`))

  if (zoneId === 'garage') return <div className={recruiter ? 'drf-dossiers' : 'drf-project-grid'}>
    {content.projects.map((project, index) => <article key={project.id} className="drf-project-card" data-selected={selectedProjectId === project.id}>
      <div className="drf-card-top"><span className="drf-code">{String(index + 1).padStart(2, '0')} / DRF</span><span className="drf-tag">{project.contentStatus === 'pending-evidence' ? t.pending : t.reviewed}</span></div>
      <h3 id={`drf-project-${project.id}`} tabIndex={-1}>{project.title[locale]}</h3>
      {recruiter ? <ProjectDetail project={project} content={content} locale={locale} /> : <>
        <p>{project.summary[locale]}</p><ul className="drf-chips">{project.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
        <button id={`drf-select-${project.id}`} type="button" className="drf-card-action" onClick={event => onProject(project, event.currentTarget)}>
          {selectedProjectId === project.id ? `${t.selected} · ${t.read}` : t.openProject} <span className="drf-sr-only">{project.title[locale]}</span><span aria-hidden="true">↗</span>
        </button>
      </>}
    </article>)}
  </div>

  if (zoneId === 'telemetry') return recruiter ? <><p className="drf-lead">{t.metricIntro}</p><MetricCards content={content} locale={locale} /></> : <TelemetryInstrument content={content} locale={locale} reducedMotion={reducedMotion} />

  if (zoneId === 'pit-wall') return <>
    <div className="drf-timeline">{content.experiences.map(experience => <article key={experience.id}>
      {(experience.start || experience.end || experience.isCurrent === true) && <p className="drf-code">{[experience.start && date(experience.start), experience.isCurrent === true ? t.current : experience.end && date(experience.end)].filter(Boolean).join(' · ')}</p>}
      <h3>{experience.role[locale]}</h3><p className="drf-lead">{experience.organization[locale]}</p><p>{experience.summary[locale]}</p>
      <EvidenceList content={content} locale={locale} ids={experience.evidenceIds} />
    </article>)}</div>
    <h3>{t.education}</h3><ul className="drf-text-list">{content.profile.education.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul>
  </>

  if (zoneId === 'driver-profile') return <>
    <p className="drf-code">{content.profile.location[locale]}</p><h3>{content.profile.name}</h3><p className="drf-lead">{content.profile.summary[locale]}</p>
    <h3>{t.education}</h3><ul className="drf-text-list">{content.profile.education.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul>
    <h3>{t.interests}</h3><ul className="drf-text-list">{content.profile.interests.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul>
    {content.profile.cvUrl && <a className="drf-button" href={content.profile.cvUrl} download><Download size={16} aria-hidden="true" />{t.downloadCv}</a>}
    <div className="drf-performance"><p className="drf-code">{t.performance}</p><p>{t.performanceIntro}</p>
      {content.projects.filter(project => project.relatedZones.includes('driver-profile')).map(project => <article key={project.id}><h3>{project.title[locale]}</h3><p>{project.summary[locale]}</p>{projectButton(project)}</article>)}
    </div>
  </>

  return <><p className="drf-lead">{t.strategyIntro}</p><div className="drf-strategies">
    {content.projects.filter(project => project.relatedZones.includes('strategy-room')).map(project => <article key={project.id}>
      <h3>{project.title[locale]}</h3>
      {project.decisions.length > 0 && <section className="drf-strategy-decisions"><h4 className="drf-field-label">{t.decisions}</h4><ul className="drf-text-list">{project.decisions.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul></section>}
      {project.limitations.length > 0 && <section className="drf-strategy-limits"><h4 className="drf-field-label">{t.limitations}</h4><ul className="drf-text-list">{project.limitations.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul></section>}{projectButton(project)}
    </article>)}
  </div><h3>{t.contact}</h3><div className="drf-links">{content.profile.contactLinks.map(link => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">{link.label[locale]} ↗</a>)}</div></>
}
