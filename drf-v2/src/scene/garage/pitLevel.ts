import { CylinderGeometry, Group } from 'three'
import { roomElevation } from '../camera/framing.ts'
import type { Resources } from './resources.ts'

// M16 4a (D1 B): the pit boxes under the elevated technical room, in world space at the M15 grade.
// Three open bays face the pit lane; the room slab above is their ceiling. Race, pit wall and gantry are 4b.
const grade = -.007, bays = [-5.6, 0, 5.6] as const

export function createPitLevel(r: Resources) {
  const pit = new Group(); pit.name = 'pit-level-boxes'
  const { carbon, panel, metal, white, black, tire, taskLight, concrete } = r.palette
  const ceiling = roomElevation - .19
  // Bay floor sits 5 mm over the apron (grade), from the bay mouth to the back wall.
  r.box(pit, [16.8, .02, 6.8], [0, grade - .01, -4.9], concrete).name = 'pit-bay-floor'
  for (const x of [-8.4, -2.8, 2.8, 8.4]) {
    r.box(pit, [.35, ceiling, .35], [x, ceiling / 2, -8.3], carbon)
    r.box(pit, [.15, ceiling, 6.8], [x, ceiling / 2, -4.9], panel)
  }
  r.box(pit, [16.8, ceiling, .2], [0, ceiling / 2, -1.5], panel).name = 'pit-back-wall'
  const stack = r.geometry(new CylinderGeometry(.33, .33, .3, 16))
  for (const x of bays) {
    // Half-raised roller door, ceiling light strips and two tyre stacks per bay.
    r.box(pit, [5.2, .6, .1], [x, ceiling - .35, -8.25], metal)
    for (const z of [-6.2, -3.6]) r.box(pit, [3.6, .04, .25], [x, ceiling - .03, z], taskLight)
    for (const side of [-1, 1]) for (let n = 0; n < 4; n++) r.mesh(pit, stack, tire, [x + side * 1.9, grade + .15 + n * .3, -2.4])
    // Pit box markings in front of each bay (paint only).
    for (const z of [-9.1, -11.6]) r.box(pit, [4.8, .002, .08], [x, grade + .001, z], white)
    for (const side of [-1, 1]) r.box(pit, [.08, .002, 2.5], [x + side * 2.4, grade + .001, -10.35], white)
  }
  // Fast-lane boundary: dashed line along the pit lane.
  for (let x = -29; x <= 29; x += 3) r.box(pit, [1.6, .002, .1], [x, grade + .001, -12.9], white)
  r.box(pit, [16.8, .08, .05], [0, ceiling - .04, -8.42], black).name = 'pit-header-shadow-line'
  return pit
}
