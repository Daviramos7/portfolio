import type { PortfolioShellProps, Project } from '../contracts/index.ts'
import { ZoneContent } from './ZoneContent.tsx'
import { uiLabels } from './uiLabels.ts'

type Props = PortfolioShellProps & {
  onProject: (project: Project, trigger: HTMLButtonElement) => void
}

// Traditional reading remains separate from the spatial experience.
export function RecruiterView({ content, state, actions, onProject }: Props) {
  const t = uiLabels(state.locale)
  return <>
    <a className="drf-skip" href="#drf-content" onClick={event => {
      event.preventDefault()
      const target = document.getElementById('drf-content')
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'start' })
    }}>{t.skip}</a>
    <header className="drf-header">
      <div className="drf-brand"><span className="drf-monogram" aria-hidden="true">DRF<span>01</span></span><div><p className="drf-wordmark">DRF ENGINEERING</p><p className="drf-muted">{t.identity}</p></div></div>
      <div className="drf-preferences">
        <nav className="drf-recruiter-nav" aria-label={t.navigation}>
          <select aria-label={t.navigation} value={state.target.zoneId} onChange={event => {
            const zone = content.zones.find(item => item.id === event.target.value)
            if (zone) actions.navigate({ zoneId: zone.id, projectId: null })
          }}>{content.zones.map(item => <option key={item.id} value={item.id}>{item.label[state.locale]}</option>)}</select>
        </nav>
        <div role="group" aria-label={t.locale} className="drf-segment">{(['pt', 'en'] as const).map(locale => <button type="button" key={locale} aria-pressed={state.locale === locale} onClick={() => actions.setLocale(locale)} aria-label={locale === 'pt' ? 'Português' : 'English'}>{locale.toUpperCase()}</button>)}</div>
        <button id="drf-return-garage" type="button" className="drf-button" onClick={() => actions.setMode('immersive')}>{t.returnGarage} ↗</button>
      </div>
    </header>
    <div className="drf-intro"><div><p className="drf-code">{content.profile.location[state.locale]}</p><h1>{content.profile.name}</h1><p className="drf-lead">{content.profile.summary[state.locale]}</p></div><p className="drf-team-note">{t.fiction}</p></div>
    <div className="drf-status-strip"><p role="status">{t.recruiterNotice}</p></div>
    <div id="drf-content" tabIndex={-1} className="drf-content">
      {content.zones.map((item, index) => <section key={item.id} className="drf-recruiter-zone" aria-labelledby={`drf-zone-${item.id}`}>
        <div className="drf-section-heading"><p className="drf-code">0{index + 1} / DRF ENGINEERING</p><h2 id={`drf-zone-${item.id}`} tabIndex={-1}>{item.label[state.locale]}</h2><p className="drf-muted">{item.summary[state.locale]}</p></div>
        <ZoneContent content={content} locale={state.locale} zoneId={item.id} recruiter selectedProjectId={state.target.projectId} onProject={onProject} />
      </section>)}
    </div>
    <footer className="drf-footer"><span>DRF ENGINEERING / {content.profile.name}</span><div className="drf-links">{content.profile.contactLinks.map(link => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">{link.label[state.locale]} ↗</a>)}</div></footer>
  </>
}
