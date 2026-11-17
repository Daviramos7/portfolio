import { Activity, Pause, Volume2, VolumeX } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import type { PortfolioShellProps } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'
import { qualityLevels } from '../app/browserEnvironment.ts'
import { closeDetailsOnEscape } from './detailsEscape.ts'

const mobileQuery = () => window.matchMedia('(max-width: 600px)')
const subscribeMobile = (notify: () => void) => {
  const query = mobileQuery()
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const isMobile = () => mobileQuery().matches
const serverMobile = () => false

// inline: dentro do menu único do HUD compacto (≤ 480 px), sem as gavetas próprias de Ambiente e Movimento.
export function EnvironmentControls({ state, actions, inline = false }: Pick<PortfolioShellProps, 'state' | 'actions'> & { inline?: boolean }) {
  const t = uiLabels(state.locale)
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, serverMobile)
  const audioEnabled = state.audio === 'on' || state.audio === 'requested'
  const audioLabel = { off: t.audioOff, on: t.audioOn, requested: t.audioRequested, unavailable: t.audioUnavailable }[state.audio]
  const sceneLabel = { idle: t.sceneIdle, loading: t.sceneLoading, ready: t.enabled, unavailable: t.sceneUnavailable, error: t.sceneError }[state.renderStatus]
  const ambientActive = state.renderStatus === 'ready' && state.ambientEnabled && !state.reducedMotion && !state.panelOpen
  const ambientLabel = state.renderStatus !== 'ready' ? sceneLabel : state.reducedMotion ? t.motionRestricted : state.ambientEnabled ? state.panelOpen ? t.paused : t.enabled : t.disabled
  const secondary = <>
    <span id="drf-audio-policy" className="drf-sr-only">{t.audioOptIn}</span>
    <button id="drf-audio-toggle" type="button" aria-pressed={audioEnabled} aria-describedby="drf-audio-policy" disabled={!audioEnabled && state.renderStatus !== 'ready'} title={t.audioOptIn} onClick={() => { void actions.setAudioEnabled(!audioEnabled) }}>
      {audioEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
      <span>{t.audio}<small aria-live="polite">{audioLabel}</small></span>
    </button>
    <label className="drf-volume-control" htmlFor="drf-audio-volume">
      <span>{t.volume}<output htmlFor="drf-audio-volume">{Math.round(state.audioVolume * 100)}%</output></span>
      <input id="drf-audio-volume" type="range" min="0" max="1" step="0.01" value={state.audioVolume} aria-valuetext={`${Math.round(state.audioVolume * 100)}%`} title={t.volumeHint} onChange={event => actions.setAudioVolume(Number(event.currentTarget.value))} />
    </label>
    <button id="drf-ambient-toggle" type="button" aria-pressed={ambientActive} disabled={state.reducedMotion || state.renderStatus !== 'ready'} title={state.renderStatus !== 'ready' ? sceneLabel : state.reducedMotion ? t.reduced : state.panelOpen ? t.reading : t.ambient} aria-label={`${t.ambient}: ${ambientLabel}`} onClick={() => actions.setAmbientEnabled(!state.ambientEnabled)}>
      {ambientActive ? <Activity size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      <span>{t.environmentShort}<small aria-live="polite">{ambientLabel}</small></span>
    </button>
  </>
  const motionOptions = <>
      <fieldset><legend>{t.motion}</legend>
        {(['system', 'cinematic', 'reduced'] as const).map(choice => <label key={choice}>
          <input type="radio" name="drf-motion" value={choice} checked={state.motionPreference === choice} onChange={() => actions.setMotionPreference(choice)} />{choice === 'reduced' ? t.motionReduced : t[choice]}
        </label>)}
      </fieldset>
      <p aria-live="polite">{state.systemReducedMotion ? t.systemReduction : t.systemFullMotion} {state.reducedMotion ? t.reduced : t.motionActive}</p>
      {state.motionPreference === 'cinematic' && state.systemReducedMotion && <p>{t.motionOverride}</p>}
      <small>{t.sessionOnly}</small>
  </>
  const qualityName = { auto: t.qualityAuto, light: t.qualityLight, high: t.qualityHigh, max: t.qualityMax }
  const qualityOptions = <>
      <fieldset><legend>{t.quality}</legend>
        {qualityLevels.map(choice => <label key={choice}>
          <input type="radio" name="drf-quality" value={choice} checked={state.qualityLevel === choice} onChange={() => actions.setQualityLevel(choice)} />{qualityName[choice]}
        </label>)}
      </fieldset>
      <p aria-live="polite">{state.qualityReduced ? t.qualityReduced : state.qualityLevel === 'max' ? t.qualityMaxWarning : state.qualityLevel === 'auto' ? t.qualityAutoHint : ''}</p>
      <small>{t.qualitySaved}</small>
  </>
  if (inline) return <div className="drf-hud-environment drf-hud-environment-inline" role="group" aria-label={t.environment}>
    {secondary}
    <div className="drf-motion-inline">{motionOptions}</div>
    <div className="drf-motion-inline drf-quality-inline">{qualityOptions}</div>
  </div>
  return <div className="drf-hud-environment" role="group" aria-label={t.environment}>
    {mobile ? <details className="drf-environment-panel" onKeyDown={closeDetailsOnEscape}>
      <summary>{t.environmentShort}<small className="drf-environment-state" aria-live="polite">{ambientLabel}</small><small>{t.audio}: {audioLabel}</small></summary>
      <div className="drf-environment-options">{secondary}</div>
    </details> : secondary}
    <details className="drf-motion-control" onKeyDown={closeDetailsOnEscape}>
      <summary>{t.motion}<small>{state.motionPreference === 'reduced' ? t.motionReduced : t[state.motionPreference]}</small></summary>
      <div className="drf-motion-options">{motionOptions}</div>
    </details>
    <details className="drf-motion-control drf-quality-control" onKeyDown={closeDetailsOnEscape}>
      <summary>{t.quality}<small>{qualityName[state.qualityLevel]}{state.qualityReduced ? ' ↓' : ''}</small></summary>
      <div className="drf-motion-options">{qualityOptions}</div>
    </details>
  </div>
}
