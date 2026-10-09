import { Activity, Pause, Volume2, VolumeX } from 'lucide-react'
import type { PortfolioShellProps } from '../contracts/index.ts'
import { uiLabels } from './uiLabels.ts'

export function EnvironmentControls({ state, actions }: Pick<PortfolioShellProps, 'state' | 'actions'>) {
  const t = uiLabels(state.locale)
  const audioEnabled = state.audio === 'on' || state.audio === 'requested'
  const audioLabel = { off: t.audioOff, on: t.audioOn, requested: t.audioRequested, unavailable: t.audioUnavailable }[state.audio]
  const ambientLabel = state.reducedMotion ? t.disabled : state.ambientEnabled ? state.panelOpen ? t.paused : t.enabled : t.disabled
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
    <button id="drf-ambient-toggle" type="button" aria-pressed={state.ambientEnabled && !state.reducedMotion} disabled={state.reducedMotion} title={state.reducedMotion ? t.reduced : state.panelOpen ? t.reading : t.ambient} aria-label={`${t.ambient}: ${ambientLabel}`} onClick={() => actions.setAmbientEnabled(!state.ambientEnabled)}>
      {state.ambientEnabled && !state.reducedMotion ? <Activity size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      <span>{t.environmentShort}<small aria-live="polite">{ambientLabel}</small></span>
    </button>
  </div>
}
