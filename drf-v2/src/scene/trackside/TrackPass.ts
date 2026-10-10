import { MeshBasicMaterial, PlaneGeometry } from 'three'
import type { Group } from 'three'
import type { CarPass } from '../../contracts/index.ts'
import type { Resources } from '../garage/resources.ts'
import { carPassEnvelope, tracksidePose } from './preparation.ts'
import { createTrackCar } from './TrackCar.ts'

export function createTrackPass(r: Resources, opening: { reflection: Group; lightweight: import('three').Mesh; restore: () => void }) {
  const vehicle = createTrackCar(r); vehicle.visible = false
  r.batch(vehicle)
  const mat = r.material(new MeshBasicMaterial({ color: '#b2d9ec', transparent: true, opacity: 0, depthWrite: false }))
  const reflection = r.mesh(opening.reflection, r.geometry(new PlaneGeometry(3.6, 1.5)), mat)
  reflection.rotation.x = -Math.PI / 2; reflection.castShadow = false; reflection.visible = false
  const rest = opening.lightweight.rotation.z
  function restore() { vehicle.position.set(0, 0, 0); vehicle.rotation.y = 0; reflection.position.x = 0; vehicle.visible = false; reflection.visible = false; mat.opacity = 0; opening.restore() }
  function update(event: CarPass | null, progress: number, visual: boolean) {
    if (!event || !visual) { restore(); return }
    const pose = tracksidePose(event, progress), x=pose.position[0]
    vehicle.visible = true; vehicle.position.set(...pose.position)
    vehicle.rotation.y = pose.yaw
    const envelope = carPassEnvelope(progress)
    reflection.visible = true; reflection.position.x = Math.max(-3, Math.min(3, x * .18)); mat.opacity = envelope * .055
    opening.lightweight.position.y += Math.sin(progress * Math.PI * 24) * envelope * .0015
    opening.lightweight.rotation.z = rest + Math.sin(progress * Math.PI * 20) * envelope * .004
  }
  return { vehicle, update: (event: CarPass | null, progress: number, visual: boolean) => { opening.restore(); update(event, progress, visual) }, restore }
}
