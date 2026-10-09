import type { CarPass, ExperienceState } from '../../contracts/index.ts'
import { carPassProgress, tracksideRoute } from './preparation.ts'

export type TracksideConfig = { seed?: number; intervalMs?: readonly [number, number]; durationMs?: readonly [number, number] }
export function canSchedulePass(state: ExperienceState, settled: boolean) {
  return state.renderStatus === 'ready' && state.mode === 'immersive' && state.ambientEnabled &&
    state.documentVisible && !state.panelOpen && settled && (!state.reducedMotion || state.audio === 'on')
}
export function createPassScheduler(config: TracksideConfig = {}) {
  let seed = (config.seed ?? 4701) >>> 0, serial = 0, lastMs = 0
  let nextMs: number | null = null, event: CarPass | null = null
  const range = (value: readonly [number, number] | undefined, fallback: readonly [number, number]) =>
    value && value.every(Number.isFinite) && value[0] > 0 && value[1] >= value[0] ? value : fallback
  const interval = range(config.intervalMs, tracksideRoute.intervalMs), duration = range(config.durationMs, tracksideRoute.durationMs)
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const sample = (bounds: readonly [number, number]) => bounds[0] + random() * (bounds[1] - bounds[0])
  const reset = () => { nextMs = null; event = null }
  return {
    reset,
    tick(nowMs: number, state: ExperienceState, settled: boolean) {
      const now = Number.isFinite(nowMs) ? Math.max(lastMs, nowMs) : lastMs; lastMs = now
      if (!canSchedulePass(state, settled)) { reset(); return { event: null, progress: 0, started: false, visual: false, nextMs } }
      let started = false
      if (event && carPassProgress(event, now) >= 1) { event = null; nextMs = now + sample(interval) }
      if (nextMs === null) nextMs = now + sample(interval)
      if (!event && now >= nextMs) {
        event = { type: 'CAR_PASS', id: 'pass-' + ++serial, startMs: now, durationMs: sample(duration),
          vehicleId: tracksideRoute.vehicleId, direction: random() < .5 ? 'left-to-right' : 'right-to-left', seed }
        started = true
      }
      return { event, progress: event ? carPassProgress(event, now) : 0, started, visual: !state.reducedMotion, nextMs }
    },
  }
}
