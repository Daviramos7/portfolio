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
      target?.focus()
      target?.scrollIntoView({ block: 'start' })
    }}>{t.skip}</a>
    <header className="drf-header">
      <div className="drf-brand"><span className="drf-monogram" aria-hidden="true">DRF<span>01</span></span><div><p className="drf-wordmark">DRF ENGINEERING</p><p className="drf-muted">{t.identity}</p></div></div>
      <div className="drf-preferences">
        <div role="group" aria-label={t.locale} className="drf-segment">{(['pt', 'en'] as const).map(locale => <button type="button" key={locale} aria-pressed={state.locale === locale} onClick={() => actions.setLocale(locale)} aria-label={locale === 'pt' ? 'Português' : 'English'}>{locale.toUpperCase()}</button>)}</div>
        <div role="group" aria-label={t.mode} className="drf-segment"><button type="button" aria-pressed={false} onClick={() => actions.setMode('immersive')}>{t.immersive}</button><button type="button" aria-pressed onClick={() => actions.setMode('recruiter')}>{t.recruiter}</button></div>
      </div>
    </header>
    <div className="drf-intro"><div><p className="drf-code">{content.profile.location[state.locale]}</p><h1>{content.profile.name}</h1><p className="drf-lead">{content.profile.summary[state.locale]}</p></div><p className="drf-team-note">{t.fiction}</p></div>
    <nav className="drf-zone-nav" aria-label={t.navigation}>{content.zones.map((item, i) => <button type="button" key={item.id} aria-current={item.id === state.target.zoneId ? 'location' : undefined} onClick={() => {
      actions.navigate({ zoneId: item.id, projectId: null })
      const target = document.getElementById(`drf-zone-${item.id}`)
      target?.focus()
      target?.scrollIntoView({ block: 'start' })
    }}><span className="drf-code" aria-hidden="true">0{i + 1}</span>{item.label[state.locale]}</button>)}</nav>
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
