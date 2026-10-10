import { Activity, Pause, Volume2, VolumeX } from 'lucide-react'
import type { PortfolioShellProps } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'

export function EnvironmentControls({ state, actions }: Pick<PortfolioShellProps, 'state' | 'actions'>) {
  const t = uiLabels(state.locale)
  const audioEnabled = state.audio === 'on' || state.audio === 'requested'
  const audioLabel = { off: t.audioOff, on: t.audioOn, requested: t.audioRequested, unavailable: t.audioUnavailable }[state.audio]
  const sceneLabel = { idle: t.sceneIdle, loading: t.sceneLoading, ready: t.enabled, unavailable: t.sceneUnavailable, error: t.sceneError }[state.renderStatus]
  const ambientActive = state.renderStatus === 'ready' && state.ambientEnabled && !state.reducedMotion && !state.panelOpen
  const ambientLabel = state.renderStatus !== 'ready' ? sceneLabel : state.reducedMotion ? t.motionRestricted : state.ambientEnabled ? state.panelOpen ? t.paused : t.enabled : t.disabled
  return <div className="drf-hud-environment" role="group" aria-label={t.environment}>
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
    <details className="drf-motion-control" onKeyDown={event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus({ preventScroll: true })
      }
    }}>
      <summary>{t.motion}<small>{state.motionPreference === 'reduced' ? t.motionReduced : t[state.motionPreference]}</small></summary>
      <div className="drf-motion-options">
        <fieldset><legend>{t.motion}</legend>
          {(['system', 'cinematic', 'reduced'] as const).map(choice => <label key={choice}>
            <input type="radio" name="drf-motion" value={choice} checked={state.motionPreference === choice} onChange={() => actions.setMotionPreference(choice)} />{choice === 'reduced' ? t.motionReduced : t[choice]}
          </label>)}
        </fieldset>
        <p aria-live="polite">{state.systemReducedMotion ? t.systemReduction : t.systemFullMotion} {state.reducedMotion ? t.reduced : t.motionActive}</p>
        {state.motionPreference === 'cinematic' && state.systemReducedMotion && <p>{t.motionOverride}</p>}
        <small>{t.sessionOnly}</small>
      </div>
    </details>
  </div>
}
