import type { QualityLevel } from '../contracts/index.ts'

// Fila 17b: per-level detail beyond DPR (see dprGovernor.ts for the resolution policy).
// Screen backing canvases: 1024×512 design space times this scale (Alta 1536×768, Máxima 2048×1024).
export const screenScale: Readonly<Record<QualityLevel, number>> = { auto: 1, light: 1, high: 1.5, max: 2 }
// Sun shadow map edge: Máxima doubles it; the light profile (Leve) has shadows off altogether.
export const sunShadowMapSize: Readonly<Record<QualityLevel, number>> = { auto: 1024, light: 1024, high: 1024, max: 2048 }

/** Anisotropic filtering for the text surfaces: off on Leve, the GPU maximum on Máxima, 8× otherwise (M16 phase 1). */
export function textAnisotropyFor(level: QualityLevel, gpuMax: number) {
  const max = Math.max(1, gpuMax || 1)
  return level === 'light' ? 1 : level === 'max' ? max : Math.min(8, max)
}

/** The visitor is told only when an explicit Alta/Máxima choice was lowered by the safety net. */
export const reportsReduction = (level: QualityLevel) => level === 'high' || level === 'max'
