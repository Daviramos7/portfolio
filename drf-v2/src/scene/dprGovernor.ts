import type { Quality, QualityLevel } from '../contracts/index.ts'

// D11 (M16): low quality renders at DPR 1.5 and falls back to 1 when the sustained frame interval degrades.
// The signal is the interval between two *rendered* frames of one continuous loop, smoothed with an EWMA.
// RAFs skipped by the 30 fps ambient cap are not samples: they cost one vsync and would dilute the average,
// so a slower scene could read faster than a quicker one (M16 phase 1 review, finding 1).
// Each cadence has its own thresholds: native (camera travel) degrades after 2 s above 25 ms (< 40 fps) and
// restores after 10 s below 18 ms (> 55 fps); capped (30 fps ambience) degrades after 2 s above 40 ms (< 25 fps)
// and restores after 10 s below 36 ms. Switching cadence restarts the average.
// A second degradation latches DPR 1 for the session, so the scene never ping-pongs between the two.
export type FrameCadence = 'native' | 'capped'

export const dprPolicy = {
  low: 1.5,
  balanced: 1.5,
  fallback: 1,
  cappedFps: 30,
  // Jitter tolerance for the cap, so a 120 Hz display renders every 4th vsync (33.3 ms) instead of every 5th.
  capToleranceMs: 2,
  native: { degradeAboveMs: 25, restoreBelowMs: 18 },
  capped: { degradeAboveMs: 40, restoreBelowMs: 36 },
  degradeAfterMs: 2000,
  restoreAfterMs: 10000,
  smoothing: .1,
  maxSampleMs: 250,
} as const

// Fila 17b: visitor-chosen levels. `auto` is the M16 policy above (adapts on the low profile only).
// Alta/Máxima keep the governor as a safety net: a sustained slow stretch drops them to the Auto ceiling (1.5).
export const levelPolicy = {
  light: { cap: 1, fallback: 1, adaptive: false },
  high: { cap: 2, fallback: 1.5, adaptive: true },
  max: { cap: 3, fallback: 1.5, adaptive: true },
} as const satisfies Record<Exclude<QualityLevel, 'auto'>, { cap: number; fallback: number; adaptive: boolean }>

/** Minimum time between two rendered frames while the idle ambience is capped. */
export const cappedFrameMs = 1000 / dprPolicy.cappedFps - dprPolicy.capToleranceMs

export type DprGovernor = {
  readonly dpr: number
  readonly state: 'full' | 'degraded' | 'latched'
  readonly smoothedMs: number | null
  /** Feeds the interval since the previous rendered frame of the same loop; returns true when the target DPR changed. */
  sample: (intervalMs: number, cadence?: FrameCadence) => boolean
  /** Forgets the running average (loop paused, tab hidden, resize) without undoing a degradation. */
  interrupt: () => void
  setQuality: (quality: Quality) => void
  /** Changing the level starts over at its full ceiling (the visitor asked for it explicitly). */
  setLevel: (level: QualityLevel) => void
}

export function createDprGovernor(deviceRatio: () => number, quality: Quality = 'balanced', initialLevel: QualityLevel = 'auto'): DprGovernor {
  let current = quality, level = initialLevel, state: DprGovernor['state'] = 'full', degradations = 0
  let smoothed: number | null = null, slowMs = 0, fastMs = 0, lastCadence: FrameCadence | null = null
  function cap() {
    if (level !== 'auto') return state === 'full' ? levelPolicy[level].cap : levelPolicy[level].fallback
    return current === 'low' && state !== 'full' ? dprPolicy.fallback : dprPolicy[current]
  }
  const adaptive = () => level === 'auto' ? current === 'low' : levelPolicy[level].adaptive
  const dpr = () => Math.min(deviceRatio() || 1, cap())
  function interrupt() { smoothed = null; slowMs = 0; fastMs = 0; lastCadence = null }
  return {
    get dpr() { return dpr() },
    get state() { return state },
    get smoothedMs() { return smoothed },
    sample(intervalMs, cadence = 'native') {
      // Only low quality (Auto) and Alta/Máxima adapt; a single long gap (GC, tab switch) is not a sustained trend.
      if (!adaptive() || state === 'latched' || !(intervalMs > 0) || intervalMs > dprPolicy.maxSampleMs) return false
      if (cadence !== lastCadence) { interrupt(); lastCadence = cadence }
      const before = dpr()
      const limits = dprPolicy[cadence]
      smoothed = smoothed === null ? intervalMs : smoothed + (intervalMs - smoothed) * dprPolicy.smoothing
      if (state === 'full') {
        slowMs = smoothed > limits.degradeAboveMs ? slowMs + intervalMs : 0
        if (slowMs < dprPolicy.degradeAfterMs) return false
        degradations++
        state = degradations > 1 ? 'latched' : 'degraded'
      } else {
        fastMs = smoothed < limits.restoreBelowMs ? fastMs + intervalMs : 0
        if (fastMs < dprPolicy.restoreAfterMs) return false
        state = 'full'
      }
      interrupt()
      return dpr() !== before
    },
    interrupt,
    setQuality(quality) {
      if (quality === current) return
      current = quality
      interrupt()
    },
    setLevel(next) {
      if (next === level) return
      level = next; state = 'full'; degradations = 0
      interrupt()
    },
  }
}
