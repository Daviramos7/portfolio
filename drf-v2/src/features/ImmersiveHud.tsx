import { ArrowLeft, ArrowRight, BookOpen, Crosshair, X } from 'lucide-react'
import type { PortfolioShellProps, Project } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'

type Props = PortfolioShellProps & {
  program: Project | undefined
  onChoose: (project: Project) => void
  onInspect: (trigger: HTMLButtonElement) => void
  onClose: () => void
}

export function ImmersiveHud({ content, state, actions, program, onChoose, onInspect, onClose }: Props) {
  const t = uiLabels(state.locale)
  const zone = content.zones.find(zone => zone.id === state.target.zoneId)
  const zoneIndex = content.zones.findIndex(zone => zone.id === state.target.zoneId)
  const projectIndex = content.projects.findIndex(project => project.id === program?.id)
  const inGarage = state.target.zoneId === 'garage'
  const sceneLabel = { idle: t.sceneIdle, loading: t.sceneLoading, ready: t.ready, unavailable: t.sceneUnavailable, error: t.sceneError }[state.renderStatus]
  const shortLabels = { garage: t.garageShort, telemetry: t.telemetryShort, 'pit-wall': t.pitShort, 'driver-profile': t.driverShort, 'strategy-room': t.strategyShort }
  const changeProgram = (offset: number) => {
    const next = content.projects[(projectIndex + offset + content.projects.length) % content.projects.length]
    if (next) onChoose(next)
  }

  return <>
    <header className="drf-hud-header">
      <div className="drf-hud-brand">
        <span className="drf-hud-mark" aria-hidden="true">DRF<span>/</span></span>
        <div><h1>ENGINEERING</h1><p>{t.team}</p></div>
      </div>
      <div className="drf-hud-tools">
        <div className="drf-hud-locale" role="group" aria-label={t.locale}>
          {(['pt', 'en'] as const).map(locale => <button type="button" key={locale} aria-pressed={state.locale === locale} aria-label={locale === 'pt' ? 'Português' : 'English'} onClick={() => actions.setLocale(locale)}>{locale.toUpperCase()}</button>)}
        </div>
        <button type="button" className="drf-recruiter-switch" onClick={() => actions.setMode('recruiter')} aria-label={t.cvLabel}>
          <BookOpen size={16} aria-hidden="true" /><span>Recruiter</span>
        </button>
      </div>
    </header>

    <nav className="drf-zone-nav drf-hud-nav" aria-label={t.navigation}>
      {content.zones.map((item, index) => <button type="button" key={item.id} aria-label={item.label[state.locale]} aria-current={item.id === state.target.zoneId ? 'location' : undefined} onClick={() => actions.navigate({ zoneId: item.id, projectId: null })}>
        <span className="drf-nav-index" aria-hidden="true">0{index + 1}</span>
        <span className="drf-nav-label">{item.label[state.locale]}</span>
        <span className="drf-nav-short" aria-hidden="true">{shortLabels[item.id]}</span>
      </button>)}
    </nav>

    <div className="drf-zone-coordinate" aria-hidden="true"><span>DRF–01</span><span>{t.zonePosition} 0{zoneIndex + 1} / 05</span></div>

    <section className="drf-showcase" aria-label={zone?.label[state.locale]}>
      <div className="drf-showcase-toolbar">
        <p className="drf-code">{inGarage ? t.programs : t.briefing}</p>
        <span className="drf-program-count">{inGarage ? `${String(projectIndex + 1).padStart(2, '0')} / ${String(content.projects.length).padStart(2, '0')}` : `0${zoneIndex + 1} / 05`}</span>
      </div>
      <div className="drf-showcase-command">
      {inGarage && program ? <>
        <h2 className="drf-sr-only" aria-live="polite" aria-atomic="true">{program.title[state.locale]}</h2>
        <div className="drf-program-selector" role="group" aria-label={t.chooseProgram}>
        <button type="button" onClick={() => changeProgram(-1)} aria-label={t.previous}><ArrowLeft size={16} aria-hidden="true" /></button>
        <select id="drf-program-select" aria-label={t.chooseProgram} value={program.id} onChange={event => {
          const next = content.projects.find(project => project.id === event.target.value)
          if (next) onChoose(next)
        }}>{content.projects.map((project, index) => <option key={project.id} value={project.id}>{String(index + 1).padStart(2, '0')} — {project.title[state.locale]}</option>)}</select>
        <button type="button" onClick={() => changeProgram(1)} aria-label={t.next}><ArrowRight size={16} aria-hidden="true" /></button>
      </div></> : <div className="drf-showcase-copy" key={zone?.id}><h2 aria-live="polite" aria-atomic="true">{zone?.label[state.locale]}</h2></div>}
      <button id="drf-inspect" type="button" className="drf-inspect" aria-label={state.panelOpen ? t.close : t.inspect} title={state.panelOpen ? t.close : t.inspect} aria-expanded={state.panelOpen} aria-controls={state.panelOpen ? 'drf-reading' : undefined} onClick={event => state.panelOpen ? onClose() : onInspect(event.currentTarget)}>
        {state.panelOpen ? <X size={16} aria-hidden="true" /> : <Crosshair size={16} aria-hidden="true" />}
      </button>
      </div>
    </section>

    <div className="drf-hud-status">
      <p className="drf-scene-status" role="status"><span className="drf-status-indicator" data-ready={state.renderStatus === 'ready'} aria-hidden="true" />{sceneLabel}</p>
      <span className="drf-hud-credit">{t.by} {content.profile.name}</span>
    </div>
  </>
}
