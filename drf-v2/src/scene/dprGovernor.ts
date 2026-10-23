import type { Quality } from '../contracts/index.ts'

// D11 (M16): low quality renders at DPR 1.5 and falls back to 1 when the sustained frame interval degrades.
// The signal is the RAF-to-RAF interval while the loop runs continuously, smoothed with an EWMA.
// Hysteresis: degrade after 2 s above 25 ms (< 40 fps); restore after 10 s below 18 ms (> 55 fps).
// A second degradation latches DPR 1 for the session, so the scene never ping-pongs between the two.
export const dprPolicy = {
  low: 1.5,
  balanced: 1.5,
  fallback: 1,
  degradeAboveMs: 25,
  degradeAfterMs: 2000,
  restoreBelowMs: 18,
  restoreAfterMs: 10000,
  smoothing: .1,
  maxSampleMs: 250,
} as const

export type DprGovernor = {
  readonly dpr: number
  readonly state: 'full' | 'degraded' | 'latched'
  readonly smoothedMs: number | null
  /** Feeds one continuous frame interval; returns true when the target DPR changed. */
  sample: (intervalMs: number) => boolean
  /** Forgets the running average (loop paused, tab hidden, resize) without undoing a degradation. */
  interrupt: () => void
  setQuality: (quality: Quality) => void
}

export function createDprGovernor(deviceRatio: () => number, quality: Quality = 'balanced'): DprGovernor {
  let current = quality, state: DprGovernor['state'] = 'full', degradations = 0
  let smoothed: number | null = null, slowMs = 0, fastMs = 0
  const cap = () => current === 'low' && state !== 'full' ? dprPolicy.fallback : dprPolicy[current]
  function interrupt() { smoothed = null; slowMs = 0; fastMs = 0 }
  return {
    get dpr() { return Math.min(deviceRatio() || 1, cap()) },
    get state() { return state },
    get smoothedMs() { return smoothed },
    sample(intervalMs) {
      // Only low quality adapts, and a single long gap (GC, tab switch) is not a sustained trend.
      if (current !== 'low' || state === 'latched' || !(intervalMs > 0) || intervalMs > dprPolicy.maxSampleMs) return false
      smoothed = smoothed === null ? intervalMs : smoothed + (intervalMs - smoothed) * dprPolicy.smoothing
      if (state === 'full') {
        slowMs = smoothed > dprPolicy.degradeAboveMs ? slowMs + intervalMs : 0
        if (slowMs < dprPolicy.degradeAfterMs) return false
        degradations++
        state = degradations > 1 ? 'latched' : 'degraded'
      } else {
        fastMs = smoothed < dprPolicy.restoreBelowMs ? fastMs + intervalMs : 0
        if (fastMs < dprPolicy.restoreAfterMs) return false
        state = 'full'
      }
      interrupt()
      return deviceRatio() > dprPolicy.fallback
    },
    interrupt,
    setQuality(quality) {
      if (quality === current) return
      current = quality
      interrupt()
    },
  }
}
