import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, TorusGeometry } from 'three'
import type { Material } from 'three'
import type { Resources } from '../garage/resources.ts'

// Authored cross sections; not a scan/model of an existing racing car.
type Section = readonly [z: number, halfWidth: number, bottom: number, top: number]
function bodyGeometry(sections: readonly Section[]): BufferGeometry {
  const vertices: number[] = [], indices: number[] = []
  for (const [z, w, bottom, top] of sections) vertices.push(-w, bottom, z, w, bottom, z, w, top, z, -w, top, z)
  for (let n = 0; n < sections.length - 1; n++) {
    for (let side = 0; side < 4; side++) {
      const a = n * 4 + side, b = n * 4 + (side + 1) % 4, c = a + 4, d = b + 4
      indices.push(a, b, c, b, d, c)
    }
  }
  indices.push(0, 2, 1, 0, 3, 2)
  const end = (sections.length - 1) * 4
  indices.push(end, end + 1, end + 2, end, end + 2, end + 3)
  const shape = new BufferGeometry()
  shape.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  shape.setIndex(indices)
  shape.computeVertexNormals()
  return shape
}

export function createDRF01(r: Resources): Group {
  const car = new Group()
  car.name = 'DRF-01-original-procedural'
  const { carbon, red, white, black, metal, tire } = r.palette
  const body = (sections: readonly Section[], surface: Material) => r.mesh(car, r.geometry(bodyGeometry(sections)), surface)
  r.box(car, [1.95, .09, 4.25], [0, .22, -.15], carbon)
  body([[-2.15, .27, .3, .55], [-1.2, .48, .29, .98], [-.45, .48, .28, .83], [.45, .36, .28, .65], [2.5, .16, .26, .39]], red)
  for (const side of [-1, 1]) {
    const pod = r.mesh(car, r.geometry(bodyGeometry([[-1.9, .26, .27, .56], [-.85, .36, .27, .72], [.45, .3, .28, .66], [.8, .2, .29, .52]])), carbon, [side * .67, 0, 0])
    pod.rotation.y = side * -.045
    r.box(car, [.5, .025, 1.2], [side * .68, .72, -.5], red)
    r.box(car, [.32, .24, .025], [side * .67, .48, .8], black)
    r.rod(car, [side * .4, .58, -1], [side * .98, .55, -.95], .022, metal)
    r.box(car, [.19, .08, .32], [side * 1.02, .58, -.94], red)
  }
  // Recessed cockpit, original simple roll structure, no driver character.
  r.box(car, [.61, .065, .92], [0, .87, -.5], black)
  r.box(car, [.4, .3, .18], [0, 1.03, -.93], carbon)
  for (const side of [-1, 1]) {
    r.rod(car, [side * .32, .87, -.97], [side * .36, 1.24, -.7], .035, black)
    r.rod(car, [side * .36, 1.24, -.7], [side * .24, 1.13, .03], .035, black)
    r.rod(car, [side * .24, 1.13, .03], [0, 1.1, .22], .035, black)
  }
  r.rod(car, [0, 1.1, .22], [0, .65, .38], .04, black)
  body([[-1.8, .12, .79, 1.06], [-1.25, .17, .95, 1.46], [-1.02, .1, 1.02, 1.38]], carbon)
  r.box(car, [.16, .04, .3], [0, 1.48, -1.23], white)

  const wheelShape = r.geometry(new CylinderGeometry(.58, .58, .42, 24))
  const rimShape = r.geometry(new CylinderGeometry(.31, .31, .435, 16))
  const sidewall = r.geometry(new TorusGeometry(.46, .012, 4, 24))
  for (const z of [-1.6, 1.5]) {
    for (const side of [-1, 1]) {
      const x = side * 1.23
      const wheel = r.mesh(car, wheelShape, tire, [x, .6, z])
      wheel.rotation.z = Math.PI / 2
      const rim = r.mesh(car, rimShape, metal, [x, .6, z])
      rim.rotation.z = Math.PI / 2
      const ring = r.mesh(car, sidewall, white, [x + side * .214, .6, z])
      ring.rotation.y = Math.PI / 2
      r.rod(car, [x + side * .23, .6, z], [x + side * .25, .6, z], .12, black)
      for (const offset of [-.35, .35]) {
        r.rod(car, [side * .3, .48, z + offset], [x, .53, z], .026, carbon)
        r.rod(car, [side * .3, .72, z + offset], [x, .73, z], .02, metal)
      }
    }
  }
  // Multi-element front/rear wings and separated endplates establish the silhouette.
  for (const z of [2.38, 2.65, 2.87]) r.box(car, [2.9, .055, .2], [0, .24 + (2.87 - z) * .12, z], carbon)
  for (const side of [-1, 1]) r.box(car, [.065, .38, .82], [side * 1.46, .38, 2.62], red)
  for (const y of [1.31, 1.54]) r.box(car, [2.45, .065, .39], [0, y, -2.24], carbon)
  for (const side of [-1, 1]) {
    r.box(car, [.065, .65, .72], [side * 1.23, 1.32, -2.21], red)
    r.rod(car, [side * .22, .46, -1.98], [side * .22, 1.3, -2.22], .045, metal)
  }
  r.box(car, [1.4, .045, .45], [0, .25, -2.13], black)
  const number = r.sign(car, '01', [.32, .3], [0, .48, 1.5])
  number.object.rotation.x = -Math.PI / 2
  const plaque = r.sign(car, 'DRF-01', [.85, .2], [0, 1.585, -2.24])
  plaque.object.rotation.x = -Math.PI / 2
  return car
}
