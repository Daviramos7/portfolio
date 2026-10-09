import type { ZoneId } from '../../contracts/index.ts'

type Point = readonly [number, number, number]
export type Framing = Readonly<{ position: Point; lookAt: Point }>

export const framings: Readonly<Record<ZoneId, Framing>> = {
  garage: { position: [8.4, 5.5, 10.8], lookAt: [0, .8, -.3] },
  telemetry: { position: [-.7, 3.1, 4.3], lookAt: [-5.5, 1.45, -2.7] },
  'pit-wall': { position: [1, 3, 2.6], lookAt: [5.4, 1.4, -3.4] },
  'driver-profile': { position: [-.8, 2.9, 7], lookAt: [-5.1, 1.3, 2.3] },
  'strategy-room': { position: [1, 3.5, 8], lookAt: [5.3, 1.1, 2.9] },
}

export const cameraDurationMs = 1050
export const hotspotVolumes: Readonly<Record<ZoneId, Readonly<{ position: Point; size: Point }>>> = {
  garage: { position: [0, .85, 0], size: [3.2, 1.9, 6.2] },
  telemetry: { position: [-5.7, 1.5, -2.75], size: [3.8, 2.4, 1.25] },
  'pit-wall': { position: [5.7, 1.3, -3.7], size: [3.8, 2.5, 1.35] },
  'driver-profile': { position: [-5.8, 1.5, 2.3], size: [3.3, 3.3, 1.8] },
  'strategy-room': { position: [5.7, 1.6, 2.8], size: [3.8, 3.3, 2.9] },
}
export function cameraEase(progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  return p * p * (3 - 2 * p)
}
