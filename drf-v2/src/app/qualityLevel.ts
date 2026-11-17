import type { Quality, QualityLevel } from '../contracts/index.ts'

/**
 * Scene profile (props, shadows, horizon) for each visitor-chosen level (fila 17b).
 * Auto and Alta keep the viewport profile: on a phone Alta buys sharpness (DPR, screen texels), not extra props.
 * Leve always drops to the light profile; Máxima always runs the full one.
 */
export function qualityProfile(level: QualityLevel, viewport: Quality): Quality {
  return level === 'light' ? 'low' : level === 'max' ? 'balanced' : viewport
}
