import { useId, useState } from 'react'
import type { Locale, PortfolioContent, Project } from '../../contracts/index.ts'
import { uiLabels } from '../../features/uiLabels.ts'
import { ProjectDetail } from './ContentBlocks.tsx'

type Section = 'overview' | 'engineering' | 'evidence'

// Original related-panel navigation. All content remains linear in Recruiter.
export function CaseWorkbench({ project, content, locale }: { project: Project; content: PortfolioContent; locale: Locale }) {
  const t = uiLabels(locale)
  const id = useId()
  const [selected, setSelected] = useState<Section>('overview')
  const sections: { id: Section; label: string }[] = [
    { id: 'overview', label: t.caseOverview },
    ...(project.decisions.length || project.limitations.length ? [{ id: 'engineering' as const, label: t.caseEngineering }] : []),
    ...(project.evidenceIds.length || project.metricIds.length ? [{ id: 'evidence' as const, label: t.caseEvidence }] : []),
  ]
  const active = sections.find(item => item.id === selected) ?? sections[0]
  return <div className="drf-case-workbench">
    <div className="drf-case-tab-list" role="tablist" aria-label={t.caseNavigation} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]'))
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
      setSelected(sections[index].id)
      buttons[index]?.focus({ preventScroll: true })
    }}>
      {sections.map((item, index) => <button key={item.id} type="button" role="tab" id={`${id}-${item.id}`} data-case-tab={item.id} aria-selected={active.id === item.id} aria-controls={`${id}-panel`} tabIndex={active.id === item.id ? 0 : -1} onClick={() => setSelected(item.id)}><span aria-hidden="true">0{index + 1}</span>{item.label}</button>)}
    </div>
    <div key={active.id} id={`${id}-panel`} className="drf-case-pane" role="tabpanel" aria-labelledby={`${id}-${active.id}`} tabIndex={0} data-case-section={active.id}>
      <ProjectDetail project={project} content={content} locale={locale} section={active.id} />
    </div>
  </div>
}
