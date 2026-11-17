import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronUp, Crosshair, SlidersHorizontal, X } from 'lucide-react'
import type { PortfolioShellProps, Project } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'
import { EnvironmentControls } from './EnvironmentControls.tsx'
import { ProgramIdentity } from '../components/drf/ProgramIdentity.tsx'
import { ProgramContext } from '../components/drf/ProgramContext.tsx'
import { useCompactHud } from '../hooks/ui/useCompactHud.ts'
import { closeDetailsOnEscape } from './detailsEscape.ts'

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
  const programCount = `${String(projectIndex + 1).padStart(2, '0')} / ${String(content.projects.length).padStart(2, '0')}`
  // M16 fila 15: no celular (≤ 480 px) a ficha de programas começa recolhida e o resto do HUD vai para um menu único.
  const compact = useCompactHud()
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheet = compact && inGarage ? (sheetOpen ? 'open' : 'closed') : undefined
  const toggleRef = useRef<HTMLButtonElement>(null)
  const touchStart = useRef<number | null>(null)
  const collapseSheet = () => { setSheetOpen(false); toggleRef.current?.focus({ preventScroll: true }) }
  const onSheetKey = (event: KeyboardEvent<HTMLElement>) => {
    if (sheet !== 'open' || event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    collapseSheet()
  }
  const onSheetTouchStart = (event: TouchEvent<HTMLElement>) => { touchStart.current = event.touches[0]?.clientY ?? null }
  const onSheetTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current
    touchStart.current = null
    const end = event.changedTouches[0]?.clientY
    // Arrastar para baixo ≥ 48 px recolhe a ficha aberta.
    if (sheet === 'open' && start !== null && end !== undefined && end - start >= 48) collapseSheet()
  }
  const localeGroup = <div className="drf-hud-locale" role="group" aria-label={t.locale}>
    {(['pt', 'en'] as const).map(locale => <button type="button" key={locale} aria-pressed={state.locale === locale} aria-label={locale === 'pt' ? 'Português' : 'English'} onClick={() => actions.setLocale(locale)}>{locale.toUpperCase()}</button>)}
  </div>
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
      {compact ? <details className="drf-hud-menu" onKeyDown={closeDetailsOnEscape}>
        <summary aria-label={`${t.menu}: ${t.menuHint}`}><SlidersHorizontal size={16} aria-hidden="true" /><span>{t.menu}</span><small aria-hidden="true">{state.locale.toUpperCase()}</small></summary>
        <div className="drf-hud-menu-panel">
          {localeGroup}
          <EnvironmentControls state={state} actions={actions} inline />
        </div>
      </details> : <EnvironmentControls state={state} actions={actions} />}
      <div className="drf-hud-tools">
        {!compact && localeGroup}
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

    <section id="drf-showcase" className="drf-showcase" aria-label={zone?.label[state.locale]} data-compact={compact || undefined} data-sheet={sheet} onKeyDown={onSheetKey} onTouchStart={sheet ? onSheetTouchStart : undefined} onTouchEnd={sheet ? onSheetTouchEnd : undefined}>
      <div className="drf-showcase-toolbar">
        {sheet ? <button ref={toggleRef} type="button" className="drf-showcase-toggle" aria-expanded={sheetOpen} aria-controls="drf-showcase" aria-label={`${sheetOpen ? t.hidePrograms : t.showPrograms}: ${programCount}, ${program?.title[state.locale] ?? ''}`} onClick={() => setSheetOpen(open => !open)}>
          <span className="drf-showcase-toggle-head"><span className="drf-code">{t.programs}</span><span className="drf-program-count">{programCount}</span>{sheetOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}</span>
          {!sheetOpen && <span className="drf-showcase-toggle-title" aria-hidden="true">{program?.title[state.locale]}</span>}
        </button> : <>
        <p className="drf-code">{inGarage ? t.programs : t.briefing}</p>
        <span className="drf-program-count">{inGarage ? programCount : `0${zoneIndex + 1} / 05`}</span>
        </>}
      </div>
      {inGarage && program && <ProgramIdentity project={program} locale={state.locale} index={projectIndex} total={content.projects.length} />}
      <div className="drf-showcase-command">
      {inGarage && program ? <>
        <div className="drf-program-selector" role="group" aria-label={t.chooseProgram}>
        <button type="button" onClick={() => changeProgram(-1)} aria-label={t.previous}><ArrowLeft size={16} aria-hidden="true" /></button>
        <select id="drf-program-select" aria-label={t.chooseProgram} value={program.id} onChange={event => {
          const next = content.projects.find(project => project.id === event.target.value)
          if (next) onChoose(next)
        }}>{content.projects.map((project, index) => <option key={project.id} value={project.id}>{String(index + 1).padStart(2, '0')} — {project.title[state.locale]}</option>)}</select>
        <button type="button" onClick={() => changeProgram(1)} aria-label={t.next}><ArrowRight size={16} aria-hidden="true" /></button>
      </div></> : <div className="drf-showcase-copy" key={zone?.id}><h2 aria-live="polite" aria-atomic="true">{zone?.label[state.locale]}</h2></div>}
      <button id="drf-inspect" type="button" className="drf-inspect" aria-label={state.panelOpen ? t.close : t.inspect} title={state.panelOpen ? t.close : t.inspect} data-reading={state.panelOpen} aria-expanded={state.panelOpen} aria-controls={state.panelOpen ? 'drf-reading' : undefined} onClick={event => state.panelOpen ? onClose() : onInspect(event.currentTarget)}>
        {state.panelOpen ? <X size={16} aria-hidden="true" /> : <Crosshair size={16} aria-hidden="true" />}
      </button>
      </div>
      {inGarage && program && <ProgramContext project={program} locale={state.locale} reading={state.panelOpen} onInspect={onInspect} />}
    </section>

    <div className="drf-hud-status">
      <p className="drf-scene-status" role="status"><span className="drf-status-indicator" data-ready={state.renderStatus === 'ready'} aria-hidden="true" />{sceneLabel}</p>
      <span className="drf-hud-credit">{t.by} {content.profile.name}</span>
    </div>
  </>
}
