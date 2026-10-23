import { MeshStandardMaterial, PlaneGeometry } from 'three'
import type { Group } from 'three'
import type { Resources } from './resources.ts'

// M16 4a (D1 B): room-local glass facade over the pit lane, replacing the old service opening.
// Mullions every 2.4 m, a transom at 2.6 m and a 1.05 m guard rail give the height a deliberate foreground.
export const facade = { z: -6.6, halfWidth: 8.4, bay: 2.4, sill: .25, rail: 1.05, transom: 2.6, head: 4.34 } as const

export function createFacade(r: Resources, garage: Group) {
  const { carbon, metal } = r.palette
  const { z, halfWidth, bay, sill, rail, transom, head } = facade
  const width = halfWidth * 2
  // Low carbon upstand at the floor edge: the slab ends on purpose, not with an accidental step.
  r.box(garage, [width, sill, .3], [0, sill / 2, z], carbon).name = 'facade-sill'
  for (let x = -halfWidth; x <= halfWidth + 1e-6; x += bay) r.box(garage, [.08, head - sill, .14], [x, (head + sill) / 2, z], metal)
  r.box(garage, [width, .07, .12], [0, transom, z], metal).name = 'facade-transom'
  // Guard rail stands inboard of the glass; posts every 1.2 m, a handrail and one mid rail.
  const railZ = z + .32
  r.box(garage, [width - .4, .05, .07], [0, rail, railZ], metal).name = 'facade-guard-rail'
  r.box(garage, [width - .4, .025, .025], [0, rail * .55, railZ], metal)
  for (let x = -halfWidth + .2; x <= halfWidth - .2 + 1e-6; x += 1.2) r.box(garage, [.04, rail, .04], [x, rail / 2, railZ], metal)
  // Fake glass: env-mapped and faintly reflective, no transmission pass (cheap on mobile).
  const glass = r.material(new MeshStandardMaterial({ color: '#a9c3d2', metalness: .1, roughness: .04, envMapIntensity: 1.2, transparent: true, opacity: .1, depthWrite: false }))
  const pane = r.mesh(garage, r.geometry(new PlaneGeometry(width, head - sill)), glass, [0, (head + sill) / 2, z - .03])
  pane.name = 'fake-glass-facade'; pane.castShadow = pane.receiveShadow = false
  // Slab nosing seen from the pit; the floor slab itself reaches z -8.5.
  r.box(garage, [width + .2, .5, .12], [0, -.25, -8.56], carbon).name = 'slab-nosing'
  // Hangers for the team and zone signs that used to sit on the rear wall.
  for (const x of [-7.75, -4.75]) r.rod(garage, [x, head, -6.44], [x, 3.8, -6.44], .012, metal)
  for (const x of [-1.2, 1.2]) r.rod(garage, [x, head, -6.2], [x, 3.79, -6.2], .012, metal)
  return { pane }
}
