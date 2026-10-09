import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import type { CarPass } from '../../contracts/index.ts'
import type { Resources } from '../garage/resources.ts'
import { carPassEnvelope, tracksideRoute } from './preparation.ts'

export function createTrackPass(r: Resources, opening: { reflection: Group; lightweight: import('three').Mesh; restore: () => void }) {
  const vehicle = new Group(); vehicle.name = 'DRF-track-01-original'; vehicle.visible = false
  const { paint, carbon, tire, metal, glass } = r.palette
  r.box(vehicle, [1.1, .3, 2.8], [0, .45, 0], paint)
  r.box(vehicle, [.7, .15, 1.2], [0, .38, 1.7], carbon)
  r.box(vehicle, [.62, .34, .9], [0, .76, -.1], glass)
  r.box(vehicle, [1.65, .07, .4], [0, .95, -1.55], carbon)
  for (const x of [-.42, .42]) r.rod(vehicle, [x, .45, -1.4], [x, .95, -1.55], .025, metal)
  for (const x of [-.68, .68]) for (const z of [-.9, 1.05]) r.rod(vehicle, [x - .12, .35, z], [x + .12, .35, z], .34, tire)
  vehicle.traverse(object => { if (object instanceof Mesh) object.castShadow = false })
  r.batch(vehicle)
  const mat = r.material(new MeshBasicMaterial({ color: '#b2d9ec', transparent: true, opacity: 0, depthWrite: false }))
  const reflection = r.mesh(opening.reflection, r.geometry(new PlaneGeometry(3.6, 1.5)), mat)
  reflection.rotation.x = -Math.PI / 2; reflection.castShadow = false; reflection.visible = false
  const rest = opening.lightweight.rotation.z
  function restore() { vehicle.position.set(0, 0, 0); vehicle.rotation.y = 0; reflection.position.x = 0; vehicle.visible = false; reflection.visible = false; mat.opacity = 0; opening.restore() }
  function update(event: CarPass | null, progress: number, visual: boolean) {
    if (!event || !visual) { restore(); return }
    const p = event.direction === 'left-to-right' ? progress : 1 - progress
    const x = tracksideRoute.start[0] + (tracksideRoute.end[0] - tracksideRoute.start[0]) * p
    vehicle.visible = true; vehicle.position.set(x, .05, -11)
    vehicle.rotation.y = event.direction === 'left-to-right' ? Math.PI / 2 : -Math.PI / 2
    const envelope = carPassEnvelope(progress)
    reflection.visible = true; reflection.position.x = Math.max(-3, Math.min(3, x * .18)); mat.opacity = envelope * .055
    opening.lightweight.position.y += Math.sin(progress * Math.PI * 24) * envelope * .0015
    opening.lightweight.rotation.z = rest + Math.sin(progress * Math.PI * 20) * envelope * .004
  }
  return { vehicle, update: (event: CarPass | null, progress: number, visual: boolean) => { opening.restore(); update(event, progress, visual) }, restore }
}
