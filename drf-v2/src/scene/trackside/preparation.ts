import type { CarPass, ExperienceState } from '../../contracts/index.ts'

// Original route and envelopes, driven by the renderer's single monotonic clock.
export const tracksideRoute = {
  start: [-13, .425, -11.1] as const,
  end: [13, .425, -11.1] as const,
  vehicleId: 'drf-track-02',
  intervalMs: [25000, 45000] as const,
  durationMs: [1800, 2400] as const,
}

export function tracksidePose(event: CarPass, progress: number) {
  const p = Math.min(1, Math.max(0, progress)), direction = event.direction === 'left-to-right' ? 1 : -1
  const x = tracksideRoute.start[0] + (tracksideRoute.end[0] - tracksideRoute.start[0]) * (direction > 0 ? p : 1 - p)
  // A shallow outside lane bend: approach the opening, cross it, recede.
  const z = tracksideRoute.start[2] - .5 * (2 * p - 1) ** 2
  const dz = -2 * (2 * p - 1), dx = direction * (tracksideRoute.end[0] - tracksideRoute.start[0])
  return { position: [x, tracksideRoute.start[1], z] as const, yaw: Math.atan2(dx, dz) }
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
