import type { CarPass, ExperienceState } from '../../contracts/index.ts'

// Original route and envelopes, driven by the renderer's single monotonic clock.
export const tracksideRoute = {
  start: [-16.8, 1.55, -27.6] as const,
  end: [11.2, 1.55, -14.6] as const,
  bendZ: -11.2,
  depth: 9.9,
  approachSkew: 6.5,
  vehicleScale: 1.2,
  vehicleId: 'drf-track-02',
  intervalMs: [25000, 45000] as const,
  durationMs: [2200, 2600] as const,
}

export function tracksidePose(event: CarPass, progress: number) {
  const p = Math.min(1, Math.max(0, progress)), direction = event.direction === 'left-to-right' ? 1 : -1
  // Slower distant approach/recession, energetic centre; identical geometry in reverse.
  const t = p + .05 * Math.sin(2 * Math.PI * (p - .5)), u = direction > 0 ? t : 1 - t
  const span = tracksideRoute.end[0] - tracksideRoute.start[0]
  const depth = tracksideRoute.depth, skew = tracksideRoute.approachSkew
  const x = tracksideRoute.start[0] + span * u
  const z = tracksideRoute.bendZ - depth * (2 * u - 1) ** 2 + skew * (2 * u - 1)
  const dz = direction * (-4 * depth * (2 * u - 1) + 2 * skew), dx = direction * span
  // Exact arc length of this parabola. Wheel rotation does not depend on frame rate.
  const b = 4 * depth
  const primitive = (v: number) => (v * Math.hypot(span, v) + span * span * Math.asinh(v / span)) / 2
  const arc = (v: number) => (primitive(b * (2 * v - 1) - 2 * skew) - primitive(-b - 2 * skew)) / (2 * b)
  const distance = direction > 0 ? arc(t) : arc(1) - arc(1 - t)
  return { position: [x, tracksideRoute.start[1], z] as const, yaw: Math.atan2(dx, dz), distance }
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
