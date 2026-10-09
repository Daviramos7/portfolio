import type { CarPass, ExperienceState } from '../../contracts/index.ts'

// Original route and envelopes, driven by the renderer's single monotonic clock.
export const tracksideRoute = {
  start: [-22, .05, -11] as const,
  end: [22, .05, -11] as const,
  vehicleId: 'drf-track-01',
  intervalMs: [25000, 45000] as const,
  durationMs: [3000, 5000] as const,
}

export function carPassProgress(event: CarPass, nowMs: number): number {
  if (!Number.isFinite(nowMs) || !Number.isFinite(event.startMs) ||
    !Number.isFinite(event.durationMs) || event.durationMs <= 0) return 0
  return Math.min(1, Math.max(0, (nowMs - event.startMs) / event.durationMs))
}

export function carPassEnvelope(progress: number): number {
  const p = Math.min(1, Math.max(0, progress))
  return Math.sin(Math.PI * p) ** 2
}

export function canStartVisualPass(state: ExperienceState, cameraSettled: boolean): boolean {
  return state.renderStatus === 'ready' && state.mode === 'immersive' &&
    state.ambientEnabled && state.documentVisible && !state.panelOpen &&
    !state.reducedMotion && cameraSettled
}
