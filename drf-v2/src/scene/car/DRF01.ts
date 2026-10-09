import { BufferGeometry, CatmullRomCurve3, CylinderGeometry, Float32BufferAttribute, Group, LatheGeometry, Shape, TorusGeometry, TubeGeometry, Vector2, Vector3, ExtrudeGeometry } from 'three'
import type { Material } from 'three'
import type { Resources, Vec3 } from '../garage/resources.ts'

type Section = readonly [z: number, halfWidth: number, bottom: number, top: number]
function loft(sections: readonly Section[]) {
  const bottom = new CatmullRomCurve3(sections.map(([z, w, b]) => new Vector3(w, b, z)), false, 'catmullrom', .25)
  const top = new CatmullRomCurve3(sections.map(([z, w, , t]) => new Vector3(w, t, z)), false, 'catmullrom', .25)
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = [], rings = 36, sides = 20, stride = sides + 1
  for (let i = 0; i <= rings; i++) {
    const a = bottom.getPoint(i / rings), b = top.getPoint(i / rings)
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2, s = Math.sin(angle), c = Math.cos(angle)
      vertices.push(a.x * Math.sign(s) * Math.abs(s) ** .75, (a.y + b.y) / 2 + (b.y - a.y) / 2 * Math.sign(c) * Math.abs(c) ** .7, a.z)
      uvs.push(j / sides, i / rings)
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    const a = i * stride + j, b = a + 1
    indices.push(a, a + stride, b, b, a + stride, b + stride)
  }
  for (const end of [0, rings]) for (let j = 1; j < sides - 1; j++) {
    const a = end * stride
    if (end === 0) indices.push(a, a + j, a + j + 1)
    else indices.push(a, a + j + 1, a + j)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  const normals = geometry.getAttribute('normal'), normal = new Vector3()
  // UV seam stays split, but the surface normal remains continuous across it.
  for (let i = 0; i <= rings; i++) {
    const first = i * stride, last = first + sides
    normal.set(normals.getX(first) + normals.getX(last), normals.getY(first) + normals.getY(last), normals.getZ(first) + normals.getZ(last)).normalize()
    normals.setXYZ(first, normal.x, normal.y, normal.z); normals.setXYZ(last, normal.x, normal.y, normal.z)
  }
  return geometry
}

export function createDRF01(r: Resources) {
  const car = new Group(); car.name = 'DRF-01-original-refined-prototype'
  const { carbon, paint: red, black, metal, tire } = r.palette
  const body = (sections: readonly Section[], mat: Material, p: Vec3 = [0, 0, 0]) => r.mesh(car, r.geometry(loft(sections)), mat, p)
  body([[-2.05, .4, .17, .23], [-1, .99, .17, .25], [.3, .96, .17, .25], [1.8, .39, .18, .24]], carbon)
  // Continuous sculpted nose, raised shoulders and separated cockpit opening.
  body([[-.05, .37, .29, .72], [.45, .35, .28, .71], [1.35, .24, .29, .54], [2.4, .14, .24, .4], [2.72, .1, .23, .34]], red)
  body([[-2.02, .18, .29, .64], [-1.54, .34, .29, .83], [-1.2, .39, .28, .87]], red)
  for (const side of [-1, 1]) {
    body([[-1.9, .13, .28, .51], [-1.15, .24, .29, .8], [-.12, .13, .29, .74], [.3, .04, .28, .64]], red, [side * .46, 0, 0])
    body([[-1.9, .17, .27, .39], [-1.2, .32, .3, .62], [-.4, .4, .32, .7], [.4, .32, .33, .69], [.63, .28, .37, .61]], carbon, [side * .81, 0, 0])
    body([[-1.7, .16, .42, .5], [-.9, .25, .6, .65], [.26, .27, .62, .68], [.57, .22, .57, .63]], red, [side * .81, 0, 0])
    const inlet = r.mesh(car, r.geometry(new CylinderGeometry(.16, .16, .02, 20)), black, [side * .82, .5, .64])
    inlet.rotation.x = Math.PI / 2; inlet.scale.x = 1.4; inlet.scale.z = .7
    const lip = r.mesh(car, r.geometry(new TorusGeometry(.16, .012, 6, 24)), metal, [side * .82, .5, .66])
    lip.scale.set(1.4, .7, 1)
    for (const z of [-.9, -.6, -.3]) r.rod(car, [side * .9, .67, z], [side * .9, .68, z], .016, metal)
    r.rod(car, [side * .44, .71, -.1], [side * .99, .68, .13], .018, metal)
    body([[.0, .09, .65, .73], [.27, .09, .65, .75], [.4, .04, .68, .73]], red, [side * 1.05, 0, 0])
    for (let i = 0; i < 5; i++) r.box(car, [.16, .012, .018], [side * .8, .69 - i * .006, -.1 - i * .1], black)
  }
  // Seat and cockpit walls sit below the lip; no character/model or protected livery.
  r.box(car, [.43, .08, .74], [0, .46, -.64], black)
  const seat = r.box(car, [.39, .45, .11], [0, .72, -1.12], black); seat.rotation.x = -.18
  const haloPoints = [[-.34, .87, -1.06], [-.38, 1.18, -.83], [-.32, 1.22, -.28], [0, 1.17, .03], [.32, 1.22, -.28], [.38, 1.18, -.83], [.34, .87, -1.06]].map(p => new Vector3(...p))
  r.mesh(car, r.geometry(new TubeGeometry(new CatmullRomCurve3(haloPoints), 32, .035, 8, false)), carbon)
  r.rod(car, [0, 1.17, .03], [0, .7, .23], .025, carbon)
  body([[-1.85, .08, .73, .92], [-1.45, .18, .89, 1.46], [-1.23, .14, 1.02, 1.4], [-1.12, .08, 1.06, 1.25]], carbon)
  r.box(car, [.06, .02, .48], [0, 1.42, -1.48], red)

  // Rounded tire shoulder profile, recessed rim, spokes, brake disc and central hub.
  const profile = [new Vector2(.28, -.23), new Vector2(.5, -.23), new Vector2(.565, -.19), new Vector2(.59, -.13), new Vector2(.6, .13), new Vector2(.565, .21), new Vector2(.5, .235), new Vector2(.28, .235)]
  const wheelShape = r.geometry(new LatheGeometry(profile, 48))
  const rimShape = r.geometry(new LatheGeometry([new Vector2(.28, -.18), new Vector2(.335, -.18), new Vector2(.335, .18), new Vector2(.28, .18)], 32))
  const shoulder = r.geometry(new TorusGeometry(.505, .007, 5, 48))
  const hubShape = r.geometry(new CylinderGeometry(.095, .095, .075, 20))
  const brake = r.geometry(new CylinderGeometry(.25, .25, .02, 32))
  for (const z of [-1.6, 1.55]) for (const side of [-1, 1]) {
    const x = side * 1.3
    const wheel = r.mesh(car, wheelShape, tire, [x, .605, z]); wheel.rotation.z = Math.PI / 2
    const rim = r.mesh(car, rimShape, black, [x, .605, z]); rim.rotation.z = Math.PI / 2
    const disc = r.mesh(car, brake, metal, [x + side * .15, .605, z]); disc.rotation.z = Math.PI / 2
    const innerDisc = r.mesh(car, brake, metal, [x - side * .15, .605, z]); innerDisc.rotation.z = Math.PI / 2
    const ring = r.mesh(car, shoulder, metal, [x + side * .225, .605, z]); ring.rotation.y = Math.PI / 2
    const hub = r.mesh(car, hubShape, metal, [x + side * .245, .605, z]); hub.rotation.z = Math.PI / 2
    for (let n = 0; n < 8; n++) {
      const a = n / 8 * Math.PI * 2
      r.rod(car, [x + side * .24, .605, z], [x + side * .22, .605 + Math.cos(a) * .27, z + Math.sin(a) * .27], .018, metal)
    }
    for (const offset of [-.35, .35]) {
      r.rod(car, [side * .3, .39, z + offset], [x, .48, z], .026, carbon)
      r.rod(car, [side * .33, .67, z + offset], [x, .68, z], .018, metal)
    }
  }
  // Airfoil cross-sections, curved tips and bevelled end plates replace rectangular slabs.
  const foil = new Shape(); foil.moveTo(-.2, 0); foil.quadraticCurveTo(-.05, .065, .2, .025); foil.quadraticCurveTo(.05, -.03, -.2, 0)
  const frontFoil = r.geometry(new ExtrudeGeometry(foil, { depth: 2.85, bevelEnabled: false, steps: 1, curveSegments: 10 }))
  for (let n = 0; n < 3; n++) {
    const wing = r.mesh(car, frontFoil, carbon, [-1.425, .26 + n * .06, 2.54 - n * .24]); wing.rotation.y = Math.PI / 2
  }
  const rearFoil = r.geometry(new ExtrudeGeometry(foil, { depth: 2.45, bevelEnabled: false, steps: 1, curveSegments: 10 }))
  for (let n = 0; n < 2; n++) {
    const wing = r.mesh(car, rearFoil, carbon, [-1.225, 1.31 + n * .23, -2.08 - n * .18]); wing.rotation.y = Math.PI / 2
  }
  const end = new Shape(); end.moveTo(-.4, -.15); end.lineTo(.3, -.15); end.quadraticCurveTo(.45, -.08, .36, .23); end.lineTo(-.32, .25); end.quadraticCurveTo(-.45, .23, -.4, -.15)
  const plate = r.geometry(new ExtrudeGeometry(end, { depth: .04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .016, bevelThickness: .012, curveSegments: 8 }))
  for (const side of [-1, 1]) {
    const tip = r.mesh(car, plate, red, [side * 1.44, .37, 2.49]); tip.rotation.y = Math.PI / 2
    const rear = r.mesh(car, plate, red, [side * 1.24, 1.35, -2.17]); rear.rotation.y = Math.PI / 2; rear.scale.y = 1.6
    r.rod(car, [side * .23, .44, -1.97], [side * .23, 1.29, -2.15], .035, metal)
  }
  for (const x of [-.7, -.35, 0, .35, .7]) r.box(car, [.035, .18, .7], [x, .26, -1.97], carbon)
  const number = r.sign(car, '01', [.32, .23], [0, .5, 1.65]); number.object.rotation.x = -Math.PI / 2
  const plaque = r.sign(car, 'DRF-01', [.83, .2], [0, 1.59, -2.26]); plaque.object.rotation.x = -Math.PI / 2
  return car
}
