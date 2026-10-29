import type { CarPass, ExperienceState } from '../../contracts/index.ts'

// M16 4a (Davi, 25/10/2026): the straight moves to z -52, beyond the slab edge, so the elevated room sees it.
// Left-to-right plan: a long straight entering from the fog, a right-hand curve at the right end (radius 8 m)
// and an exit straight that runs into the background fog. Constant scene speed, adjustable (~45 m/s).
const straightZ = -52, curveX = 16, curveRadius = 8, entryX = -90, exitZ = -125
const straightLength = curveX - entryX, curveLength = Math.PI / 2 * curveRadius
const exitX = curveX + curveRadius, exitStartZ = straightZ - curveRadius
const routeLength = straightLength + curveLength + (exitStartZ - exitZ)
const speedMps = 45
// +-8 % around the target speed keeps passes from feeling mechanical.
const durationAt = (mps: number) => Math.round(routeLength / mps * 1000)

export const tracksideRoute = {
  start: [entryX, -.007, straightZ] as const,
  end: [exitX, -.007, exitZ] as const,
  straightZ,
  curve: { x: curveX, radius: curveRadius },
  length: routeLength,
  speedMps,
  vehicleScale: 1.2,
  vehicleId: 'drf-track-02',
  intervalMs: [25000, 45000] as const,
  durationMs: [durationAt(speedMps * 1.08), durationAt(speedMps * .92)] as const,
}

/** Point and heading at arc length s along the left-to-right route. */
function routeAt(s: number) {
  const d = Math.min(routeLength, Math.max(0, s))
  if (d <= straightLength) return { x: entryX + d, z: straightZ, dx: 1, dz: 0 }
  if (d <= straightLength + curveLength) {
    const angle = (d - straightLength) / curveRadius
    return { x: curveX + curveRadius * Math.sin(angle), z: exitStartZ + curveRadius * Math.cos(angle), dx: Math.cos(angle), dz: -Math.sin(angle) }
  }
  return { x: exitX, z: exitStartZ - (d - straightLength - curveLength), dx: 0, dz: -1 }
}

export function tracksidePose(event: CarPass, progress: number) {
  const p = Math.min(1, Math.max(0, progress)), direction = event.direction === 'left-to-right' ? 1 : -1
  // Arc-length parameter: constant speed, and wheel rotation does not depend on frame rate.
  const distance = p * routeLength, at = routeAt(direction > 0 ? distance : routeLength - distance)
  return { position: [at.x, tracksideRoute.start[1], at.z] as const, yaw: Math.atan2(direction * at.dx, direction * at.dz), distance }
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
