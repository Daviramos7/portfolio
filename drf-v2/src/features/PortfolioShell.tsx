import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { PortfolioShellProps, Project } from '../contracts/index.ts'
import { ProjectDetail } from '../components/drf/ContentBlocks.tsx'
import { useReadingFocus } from '../hooks/ui/useReadingFocus.ts'
import { useRecruiterContext } from '../hooks/ui/useRecruiterContext.ts'
import { ImmersiveHud } from './ImmersiveHud.tsx'
import { RecruiterView } from './RecruiterView.tsx'
import { ZoneContent } from './ZoneContent.tsx'
import { uiLabels } from './uiLabels.ts'
import '../styles/ui/portfolio.css'
import '../styles/ui/immersive.css'
import './nightShift.css'
import './stationInstruments.css'

// The stable visual slot is owned by the Lead. Reading never replaces its tree.
export function PortfolioShell({ content, state, actions, children }: PortfolioShellProps & { children?: ReactNode }) {
  const t = uiLabels(state.locale)
  const recruiter = state.mode === 'recruiter'
  const zone = content.zones.find(zone => zone.id === state.target.zoneId)
  const selected = content.projects.find(project => project.id === state.target.projectId)
  const program = selected ?? content.projects[0]
  const { openerRef, headingRef, close } = useReadingFocus({ state, actions })
  const readingActions = useRecruiterContext({ state, actions })
  const uiActions = { ...actions, ...readingActions }

  const onProject = (project: Project, trigger: HTMLButtonElement) => {
    openerRef.current = trigger
    uiActions.navigate({ zoneId: state.target.zoneId === 'driver-profile' && project.relatedZones.includes('driver-profile') ? 'driver-profile' : 'garage', projectId: project.id })
    actions.setPanelOpen(true)
    if (!recruiter) requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }
  const onChoose = (project: Project) => {
    const reading = state.panelOpen
    actions.navigate({ zoneId: 'garage', projectId: project.id })
    if (reading) actions.setPanelOpen(true)
  }
  const inspect = (trigger: HTMLButtonElement) => {
    openerRef.current = trigger
    if (state.target.zoneId === 'garage' && program) actions.navigate({ zoneId: 'garage', projectId: program.id })
    actions.setPanelOpen(true)
  }
  const failed = state.renderStatus === 'error' || state.renderStatus === 'unavailable'

  return <div className="drf-ui" data-view-mode={state.mode} data-reduced-motion={state.reducedMotion} data-reading-open={state.panelOpen} lang={state.locale}>
    {recruiter ? <RecruiterView content={content} state={state} actions={uiActions} onProject={onProject} /> : <>
      <div className="drf-immersive-stage">{children}</div>
      <a className="drf-skip" href="#drf-reading" onClick={event => { event.preventDefault(); inspect(document.getElementById('drf-inspect') as HTMLButtonElement) }}>{t.skip}</a>
      <ImmersiveHud content={content} state={state} actions={uiActions} program={program} onChoose={onChoose} onInspect={inspect} onClose={close} />

      {(failed || state.renderStatus === 'idle' || state.renderStatus === 'loading') && <section className="drf-scene-notice" aria-label={t.identity}>
        <p className="drf-code">DRF / ENGINEERING</p>
        <h2>{failed ? t[state.renderStatus] : t.loading}</h2>
        <p>{content.profile.summary[state.locale]}</p>
        <div className="drf-links">
          {failed && <button type="button" className="drf-button" onClick={() => { actions.retryScene(); document.getElementById('drf-inspect')?.focus({ preventScroll: true }) }}>{t.retry}</button>}
          <button type="button" className="drf-button" onClick={() => uiActions.setMode('recruiter')}>{t.cvLabel} ↗</button>
        </div>
      </section>}

      {state.panelOpen && <section id="drf-reading" className="drf-workstation" data-station={state.target.zoneId} aria-labelledby="drf-reading-title">
        <div className="drf-workstation-toolbar">
          <p className="drf-code">{t.workstation}<span> / 0{content.zones.findIndex(item => item.id === state.target.zoneId) + 1}</span></p>
          <button type="button" className="drf-workstation-close" aria-label={t.close} onClick={close}><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="drf-workstation-heading">
          <p className="drf-code">{selected ? t.dossier : zone?.label[state.locale]}</p>
          <h2 id="drf-reading-title" ref={headingRef} tabIndex={-1}>{selected ? selected.title[state.locale] : zone?.label[state.locale]}</h2>
          {state.target.zoneId === 'telemetry' && <p className="drf-documentary-label">{t.documentedOnly}</p>}
        </div>
        <div className="drf-workstation-body" key={`${state.target.zoneId}/${state.target.projectId ?? ''}`} tabIndex={0} aria-label={t.readingContent}>
          {selected ? <ProjectDetail content={content} locale={state.locale} project={selected} /> : <ZoneContent content={content} locale={state.locale} zoneId={state.target.zoneId} recruiter={false} reducedMotion={state.reducedMotion} selectedProjectId={null} onProject={onProject} />}
        </div>
        <div className="drf-workstation-foot"><span>{t.by} {content.profile.name}</span><span>{state.locale.toUpperCase()} / DRF</span></div>
      </section>}
    </>}
  </div>
}
