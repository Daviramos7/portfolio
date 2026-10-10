import { ArrowUpRight } from 'lucide-react'
import type { Locale, Project } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'

// A compact HTML equivalent for selected in-world programme information.
export function ProgramContext({ project, locale, reading, onInspect }: { project: Project; locale: Locale; reading: boolean; onInspect: (trigger: HTMLButtonElement) => void }) {
  const t = uiLabels(locale)
  return <div className="drf-program-context" hidden={reading}>
    <div className="drf-program-context-copy">
      <p className="drf-program-summary">{project.summary[locale]}</p>
      {project.technologies.length > 0 && <>
        <p className="drf-code">{t.stack}</p>
        <ul className="drf-program-stack">{project.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
      </>}
    </div>
    <div className="drf-program-context-actions">
      <button id="drf-open-case" type="button" onClick={event => onInspect(event.currentTarget)}>{t.openProject}<ArrowUpRight size={14} aria-hidden="true" /></button>
      {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">{t.repository}<ArrowUpRight size={14} aria-hidden="true" /></a>}
      {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">{t.demo}<ArrowUpRight size={14} aria-hidden="true" /></a>}
    </div>
  </div>
}
