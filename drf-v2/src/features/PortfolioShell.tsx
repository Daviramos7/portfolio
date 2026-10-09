import type { ReactNode } from 'react'
import type { PortfolioShellProps, Project } from '../contracts/index.ts'
import { ProjectDetail } from '../components/drf/ContentBlocks.tsx'
import { useReadingFocus } from '../hooks/ui/useReadingFocus.ts'
import { ZoneContent } from './ZoneContent.tsx'
import { uiLabels } from './uiLabels.ts'
import '../styles/ui/portfolio.css'

// The Lead composes the visual region; this shell does not import the scene.
export function PortfolioShell({ content, state, actions, children }: PortfolioShellProps & { children?: ReactNode }) {
  const t = uiLabels(state.locale)
  const recruiter = state.mode === 'recruiter'
  const zone = content.zones.find(zone => zone.id === state.target.zoneId)
  const selected = content.projects.find(project => project.id === state.target.projectId)
  const { openerRef, headingRef, close } = useReadingFocus({ state, actions })
  const onProject = (project: Project, trigger: HTMLButtonElement) => {
    openerRef.current = trigger
    actions.navigate({ zoneId: state.target.zoneId === 'driver-profile' && project.relatedZones.includes('driver-profile') ? 'driver-profile' : 'garage', projectId: project.id })
    actions.setPanelOpen(true)
    if (recruiter) document.getElementById(`drf-project-${project.id}`)?.focus()
    else headingRef.current?.focus()
  }
  const audioLabel = { off: t.audioOff, on: t.audioOn, requested: t.audioRequested, unavailable: t.audioUnavailable }[state.audio]
  const audioEnabled = state.audio === 'on' || state.audio === 'requested'
  return <div className="drf-ui" data-view-mode={state.mode} data-reduced-motion={state.reducedMotion} lang={state.locale}>
    <a className="drf-skip" href="#drf-content" onClick={event => { event.preventDefault(); const target = document.getElementById('drf-content'); target?.focus(); target?.scrollIntoView({ block: 'start' }) }}>{t.skip}</a>
    <header className="drf-header">
      <div className="drf-brand"><span className="drf-monogram" aria-hidden="true">DRF<span>01</span></span><div><p className="drf-wordmark">DRF ENGINEERING</p><p className="drf-muted">{t.identity}</p></div></div>
      <div className="drf-preferences">
        <div role="group" aria-label={t.locale} className="drf-segment">{(['pt', 'en'] as const).map(locale => <button type="button" key={locale} aria-pressed={state.locale === locale} onClick={() => actions.setLocale(locale)} aria-label={locale === 'pt' ? 'Português' : 'English'}>{locale.toUpperCase()}</button>)}</div>
        <div role="group" aria-label={t.mode} className="drf-segment"><button type="button" aria-pressed={!recruiter} onClick={() => actions.setMode('immersive')}>{t.immersive}</button><button type="button" aria-pressed={recruiter} onClick={() => actions.setMode('recruiter')}>{t.recruiter}</button></div>
      </div>
    </header>
    <div className="drf-intro"><div><p className="drf-code">{content.profile.location[state.locale]}</p><h1>{content.profile.name}</h1><p className="drf-lead">{content.profile.summary[state.locale]}</p></div><p className="drf-team-note">{t.fiction}</p></div>
    <nav className="drf-zone-nav" aria-label={t.navigation}>{content.zones.map((item, i) => <button type="button" key={item.id} aria-current={item.id === state.target.zoneId ? 'location' : undefined} onClick={event => {
      openerRef.current = event.currentTarget
      actions.navigate({ zoneId: item.id, projectId: null })
      if (recruiter) { const target = document.getElementById(`drf-zone-${item.id}`); target?.focus(); target?.scrollIntoView({ block: 'start' }) }
    }}><span className="drf-code" aria-hidden="true">0{i + 1}</span>{item.label[state.locale]}</button>)}</nav>
    <div className="drf-status-strip">
      <p role="status">{recruiter ? t.recruiterNotice : t[state.renderStatus]}</p>
      {!recruiter && (state.renderStatus === 'error' || state.renderStatus === 'unavailable') && <button type="button" className="drf-button" onClick={actions.retryScene}>{t.retry}</button>}
      {!recruiter && <div className="drf-environment"><button type="button" aria-pressed={audioEnabled} disabled={state.renderStatus !== 'ready' || state.audio === 'unavailable'} onClick={() => { void actions.setAudioEnabled(!audioEnabled) }}>{t.audio}: {audioLabel}</button>
        <button type="button" aria-pressed={state.ambientEnabled && !state.reducedMotion} disabled={state.reducedMotion} onClick={() => actions.setAmbientEnabled(!state.ambientEnabled)}>{t.ambient}: {state.ambientEnabled && !state.reducedMotion ? t.enabled : t.disabled}</button></div>}
    </div>
    {!recruiter && (state.reducedMotion || state.panelOpen) && <p className="drf-policy">{state.reducedMotion ? t.reduced : t.reading}</p>}
    {!recruiter && children}
    <div id="drf-content" tabIndex={-1} className="drf-content">
      {recruiter ? content.zones.map((item, index) => <section key={item.id} className="drf-recruiter-zone" aria-labelledby={`drf-zone-${item.id}`}>
        <div className="drf-section-heading"><p className="drf-code">0{index + 1} / DRF ENGINEERING</p><h2 id={`drf-zone-${item.id}`} tabIndex={-1}>{item.label[state.locale]}</h2><p className="drf-muted">{item.summary[state.locale]}</p></div>
        <ZoneContent content={content} locale={state.locale} zoneId={item.id} recruiter selectedProjectId={state.target.projectId} onProject={onProject} />
      </section>) : <>
        <section aria-labelledby="drf-active-zone"><div className="drf-section-heading"><p className="drf-code">{t.selection}</p><h2 id="drf-active-zone">{zone?.label[state.locale]}</h2><p className="drf-muted">{zone?.summary[state.locale]}</p></div>
          {state.target.zoneId === 'garage' ? <ZoneContent content={content} locale={state.locale} zoneId="garage" recruiter={false} selectedProjectId={state.target.projectId} onProject={onProject} /> : <button id="drf-open-reading" type="button" className="drf-button drf-primary" aria-expanded={state.panelOpen} aria-controls="drf-reading" onClick={event => { openerRef.current = event.currentTarget; actions.setPanelOpen(true); headingRef.current?.focus() }}>{t.read} ↗</button>}
        </section>
        {state.panelOpen && <section className="drf-reading" id="drf-reading" aria-labelledby="drf-reading-title">
          <div className="drf-reading-top"><p className="drf-code">DRF / {t.read}</p><button type="button" className="drf-button" onClick={close}>{t.close} <span aria-hidden="true">×</span></button></div>
          <h2 id="drf-reading-title" ref={headingRef} tabIndex={-1}>{selected ? selected.title[state.locale] : zone?.label[state.locale]}</h2>
          {selected ? <><ProjectDetail content={content} locale={state.locale} project={selected} /><button type="button" className="drf-button" onClick={() => { actions.navigate({ zoneId: 'garage', projectId: null }); close() }}>{t.back}</button></> : <ZoneContent content={content} locale={state.locale} zoneId={state.target.zoneId} recruiter={false} selectedProjectId={null} onProject={onProject} />}
        </section>}
      </>}
    </div>
    <footer className="drf-footer"><span>DRF ENGINEERING / {content.profile.name}</span><div className="drf-links">{content.profile.contactLinks.map(link => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">{link.label[state.locale]} ↗</a>)}</div></footer>
  </div>
}
