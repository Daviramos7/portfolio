import { CatmullRomCurve3, Vector3 } from 'three'
import type { ZoneId } from '../../contracts/index.ts'
type Point = readonly [number, number, number]
export type Framing = Readonly<{ position: Point; lookAt: Point }>
export const framings: Readonly<Record<ZoneId, Framing>> = {
  garage: { position: [4.8, 1.85, 7.05], lookAt: [0, .8, .15] },
  telemetry: { position: [-3.4, 1.9, -.25], lookAt: [-5.7, 1.7, -4.75] },
  'pit-wall': { position: [3.45, 1.9, -.25], lookAt: [5.75, 1.8, -4.75] },
  'driver-profile': { position: [-3.25, 1.85, 3.7], lookAt: [-7.65, 1.75, 2.1] },
  'strategy-room': { position: [3.3, 1.85, 4.4], lookAt: [7.65, 1.95, 1.9] },
}
export const mobileFramings: Readonly<Record<ZoneId, Framing>> = {
  garage: { position: [5.6, 2.15, 9.6], lookAt: [0, .85, .1] },
  telemetry: { position: [-3.55, 1.85, 1.7], lookAt: [-5.7, 1.75, -4.75] },
  'pit-wall': { position: [3.55, 1.85, 1.7], lookAt: [5.75, 1.75, -4.75] },
  'driver-profile': { position: [-1.6, 1.85, 3.7], lookAt: [-7.65, 1.75, 2.1] },
  'strategy-room': { position: [1.6, 1.85, 4.4], lookAt: [7.65, 2, 1.9] },
}
export const hotspotVolumes: Readonly<Record<ZoneId, Readonly<{ position: Point; size: Point; anchor: Point }>>> = {
  garage: { position: [0, .85, 0], size: [3.2, 1.9, 6.2], anchor: [0, 1.1, 1.4] },
  telemetry: { position: [-5.7, 1.7, -4.75], size: [3.8, 2.4, 1.3], anchor: [-5.7, 2.22, -4.6] },
  'pit-wall': { position: [5.75, 1.7, -4.75], size: [3.8, 2.4, 1.3], anchor: [5.75, 2.24, -4.6] },
  'driver-profile': { position: [-7.65, 1.6, 2.1], size: [1.5, 3.4, 3.8], anchor: [-7.4, 2.52, 2.1] },
  'strategy-room': { position: [7.65, 1.9, 1.9], size: [1.5, 3.5, 3.8], anchor: [7.4, 3, 1.9] },
}
export function cameraEase(progress: number) {
  const p = Math.min(1, Math.max(0, progress))
  return p * p * p * (10 + p * (-15 + p * 6))
}
// Transit through the front service aisle keeps every route clear of the car and furniture.
export function buildCameraPath(from: Vector3, to: Vector3) {
  const points = [from.clone()]
  if (from.x * to.x < 0) {
    if (from.z < 4.9) points.push(new Vector3(from.x, 2.05, 5.2))
    points.push(new Vector3(to.x, 2.05, 5.2))
  } else {
    points.push(new Vector3((from.x + to.x) / 2 + Math.sign(to.x) * .18, 2.02, (from.z + to.z) / 2))
  }
  points.push(to.clone())
  const path = new CatmullRomCurve3(points, false, 'centripetal')
  return { path, durationMs: Math.min(2400, Math.max(1600, 1550 + path.getLength() * 65)) }
}
