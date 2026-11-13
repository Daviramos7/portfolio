import { BoxGeometry, CanvasTexture, Color, CylinderGeometry, Group, Matrix4, MeshBasicMaterial, PlaneGeometry, Quaternion, RingGeometry, SRGBColorSpace, Vector3 } from 'three'
import type { BufferGeometry, InstancedMesh } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Resources } from '../garage/resources.ts'
import { tracksideRoute } from './preparation.ts'

// M16 4b: fixed speed references around the approved route (straight at z -52, right-hand curve, exit to the fog).
// Everything repeated is one InstancedMesh per type. Nothing here raises the paved grade (y = -0.007): lines and
// kerbs sit outside the racing line, grass and gravel only cover ground the car never drives on.
const grade = tracksideRoute.start[1], straightZ = tracksideRoute.straightZ
const curveX = tracksideRoute.curve.x, radius = tracksideRoute.curve.radius
const centerZ = straightZ - radius, exitX = tracksideRoute.end[0]
const halfWidth = 4.5, kerbWidth = .9, kerbLength = 1.5, farEnd = -130, leftEnd = -100

export const circuitPlan = {
  halfWidth, kerbWidth,
  curveCenter: [curveX, centerZ] as const,
  pitWallZ: -17,
  mainStraight: [-17.4, -30] as const,
  infield: [-30, straightZ + halfWidth + kerbWidth] as const,
  postSpacing: 10,
  postZ: straightZ - halfWidth - 2.5,
  /** Metres before the turn-in point (x = curve.x), on the far verge. */
  brakeBoards: [{ metres: 100, x: curveX - 100 }, { metres: 50, x: curveX - 50 }] as const,
  boardZ: straightZ - halfWidth - 1.8,
  // Rotated so the back face reads from the room and the front face reads for an oncoming driver.
  boardYaw: Math.PI / 3,
} as const

const up = new Vector3(0, 1, 0), turn = new Quaternion()
const place = (x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw = 0) =>
  new Matrix4().compose(new Vector3(x, y, z), turn.setFromAxisAngle(up, yaw), new Vector3(sx, sy, sz))
/** Segments along the curve at radius R: local +x follows the tangent. */
function arc(R: number, count: number, y: number, height: number, width: number) {
  const matrices: Matrix4[] = [], step = Math.PI / 2 / count
  for (let i = 0; i < count; i++) {
    const a = (i + .5) * step
    matrices.push(place(curveX + R * Math.sin(a), y, centerZ + R * Math.cos(a), R * step * 1.03, height, width, a))
  }
  return matrices
}
function fill(mesh: InstancedMesh, matrices: readonly Matrix4[], colors?: readonly Color[]) {
  matrices.forEach((matrix, index) => { mesh.setMatrixAt(index, matrix); if (colors) mesh.setColorAt(index, colors[index]) })
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere(); return mesh
}

export function createCircuit(r: Resources) {
  const circuit = new Group(); circuit.name = 'circuit-dressing'
  const { trackPaint, grass, gravel, concrete, structure, light } = r.palette
  const cube = r.geometry(new BoxGeometry(1, 1, 1))

  // Verges: 4 cm slabs over ground the route never touches (no coplanar finish at 60 m).
  const lawns: readonly (readonly [number, number, number, number])[] = [
    [leftEnd, 100, circuitPlan.infield[0], circuitPlan.infield[1] + .01],
    [leftEnd, curveX, straightZ - halfWidth - kerbWidth, -66.4],
    [curveX, exitX - halfWidth - kerbWidth, centerZ - kerbWidth, -66.4],
    // Inside of the apex, within the inner kerb.
    [curveX, curveX + (radius - halfWidth - kerbWidth) * .7, centerZ + (radius - halfWidth - kerbWidth) * .7, centerZ - kerbWidth],
    [exitX + halfWidth + kerbWidth, 100, circuitPlan.infield[1] + .01, -75.4],
  ]
  fill(r.instanced(circuit, cube, grass, lawns.length, 'grass-verges'),
    lawns.map(([x0, x1, z0, z1]) => place((x0 + x1) / 2, grade + .015, (z0 + z1) / 2, x1 - x0, .05, Math.abs(z1 - z0))))
  // Gravel trap on the outside of the curve, one quarter ring just above the grass.
  const outer = radius + halfWidth + kerbWidth
  const trap = r.mesh(circuit, r.geometry(new RingGeometry(outer, outer + 7, 32, 1, Math.PI * 1.5, Math.PI / 2)), gravel, [curveX, grade + .05, centerZ])
  trap.rotation.x = -Math.PI / 2; trap.name = 'gravel-trap'; trap.castShadow = trap.receiveShadow = false

  // White edge lines: straight, both arcs, exit road, pit lane edge and the main straight in front of the pit wall.
  const lineY = grade + .006, lineH = .012, lineW = .15, inset = halfWidth - .1
  const straightLength = curveX - leftEnd, straightMid = (curveX + leftEnd) / 2, exitLength = centerZ - farEnd
  const lines = [
    ...[1, -1].map(side => place(straightMid, lineY, straightZ + side * inset, straightLength, lineH, lineW)),
    ...arc(radius + inset, 12, lineY, lineH, lineW), ...arc(radius - inset, 6, lineY, lineH, lineW),
    ...[1, -1].map(side => place(exitX + side * inset, lineY, (centerZ + farEnd) / 2, lineW, lineH, exitLength)),
    place(0, lineY, circuitPlan.pitWallZ + .5, 140, lineH, lineW),
    ...circuitPlan.mainStraight.map(z => place(0, lineY, z - Math.sign(z + 24) * .2, 200, lineH, lineW)),
  ]
  fill(r.instanced(circuit, cube, trackPaint, lines.length, 'track-edge-lines'), lines)

  // Red and white kerbs: outside (entry, curve, exit) and the inside apex.
  const kerbY = grade + .025, kerbH = .05, outside = halfWidth + kerbWidth / 2
  const run = (count: number, at: (distance: number) => Matrix4) => Array.from({ length: count }, (_, i) => at((i + .5) * kerbLength))
  const kerbs = [
    ...run(12, d => place(curveX - d, kerbY, straightZ + outside, kerbLength, kerbH, kerbWidth)).reverse(),
    ...arc(radius + outside, 14, kerbY, kerbH, kerbWidth),
    ...run(12, d => place(exitX + outside, kerbY, centerZ - d, kerbWidth, kerbH, kerbLength)),
    ...run(4, d => place(curveX - d, kerbY, straightZ - outside, kerbLength, kerbH, kerbWidth)).reverse(),
    ...arc(radius - outside, 4, kerbY, kerbH, kerbWidth),
    ...run(4, d => place(exitX - outside, kerbY, centerZ - d, kerbWidth, kerbH, kerbLength)),
  ]
  const kerbRed = new Color('#b3142c'), kerbWhite = new Color('#e4e5df')
  fill(r.instanced(circuit, cube, trackPaint, kerbs.length, 'track-kerbs'), kerbs, kerbs.map((_, i) => i % 2 ? kerbWhite : kerbRed))

  // Lighting masts every 10 m on the far verge and along the exit road; the arm reaches toward the track.
  const mastParts = [new CylinderGeometry(.07, .1, 7, 8).translate(0, 3.5, 0), new BoxGeometry(.08, .08, 1.7).translate(0, 6.95, .8), new BoxGeometry(.5, .1, .9).translate(0, 6.92, 1.55)]
  const mast = r.geometry(mergeGeometries(mastParts) as BufferGeometry); mastParts.forEach(part => part.dispose())
  const lens = r.geometry(new BoxGeometry(.4, .03, .75).translate(0, 6.855, 1.55))
  const posts: Matrix4[] = []
  for (let x = leftEnd; x <= curveX - 6; x += circuitPlan.postSpacing) posts.push(place(x, grade, circuitPlan.postZ, 1, 1, 1))
  for (let z = centerZ - 10; z >= farEnd + 10; z -= circuitPlan.postSpacing) posts.push(place(exitX + halfWidth + 2.5, grade, z, 1, 1, 1, -Math.PI / 2))
  fill(r.instanced(circuit, mast, structure, posts.length, 'track-light-posts'), posts)
  fill(r.instanced(circuit, lens, light, posts.length, 'track-light-lenses'), posts)

  // Pit wall with a debris fence. Posts and cables are one instanced type; nothing crosses the race sightline.
  const wallZ = circuitPlan.pitWallZ
  const wall = r.box(circuit, [140, 1, .4], [0, grade + .5, wallZ], concrete); wall.name = 'pit-wall'; wall.castShadow = wall.receiveShadow = false
  const fence: Matrix4[] = []
  for (let x = -68; x <= 68; x += 4) fence.push(place(x, grade + 2.2, wallZ, .06, 2.4, .06))
  for (const y of [1.8, 2.6, 3.38]) fence.push(place(0, grade + y, wallZ, 136, .025, .025))
  fill(r.instanced(circuit, cube, structure, fence.length, 'pit-wall-fence'), fence)

  // Braking boards 100 / 50: two-sided, one atlas, one draw call including the legs.
  const sheet = document.createElement('canvas'); sheet.width = 512; sheet.height = 256
  const ctx = sheet.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#e2e5e2'; ctx.fillRect(0, 0, 512, 256)
    ctx.fillStyle = '#12161a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 168px "Barlow Condensed", "Arial Narrow", Arial, sans-serif'
    circuitPlan.brakeBoards.forEach((board, i) => {
      ctx.fillText(String(board.metres), 128 + i * 256, 112)
      ctx.strokeStyle = '#12161a'; ctx.lineWidth = 8; ctx.strokeRect(10 + i * 256, 10, 236, 208)
    })
    ctx.fillStyle = '#1b2025'; ctx.fillRect(0, 232, 512, 24)
  }
  const boardMap = r.textTexture(new CanvasTexture(sheet)); boardMap.colorSpace = SRGBColorSpace
  const parts: BufferGeometry[] = []
  circuitPlan.brakeBoards.forEach((board, i) => {
    for (const flip of [0, Math.PI]) {
      const face = new PlaneGeometry(2.2, 1.5), uv = face.attributes.uv
      for (let n = 0; n < uv.count; n++) uv.setXY(n, (i + uv.getX(n)) / 2, .1 + uv.getY(n) * .9)
      parts.push(face.translate(0, 0, .03).rotateY(circuitPlan.boardYaw + flip).translate(board.x, grade + 1.95, circuitPlan.boardZ))
    }
    for (const side of [-1, 1]) {
      const leg = new BoxGeometry(.08, 1.2, .08), uv = leg.attributes.uv
      for (let n = 0; n < uv.count; n++) uv.setXY(n, .5, .03)
      parts.push(leg.translate(side * .8, .6, 0).rotateY(circuitPlan.boardYaw).translate(board.x, grade, circuitPlan.boardZ))
    }
  })
  const boards = r.mesh(circuit, r.geometry(mergeGeometries(parts) as BufferGeometry), r.material(new MeshBasicMaterial({ map: boardMap, toneMapped: false })))
  boards.name = 'brake-boards'; boards.castShadow = boards.receiveShadow = false; parts.forEach(part => part.dispose())
  r.onFontsReady(() => { if (!ctx) return
    ctx.fillStyle = '#e2e5e2'; ctx.fillRect(18, 18, 220, 192); ctx.fillRect(274, 18, 220, 192); ctx.fillStyle = '#12161a'
    circuitPlan.brakeBoards.forEach((board, i) => ctx.fillText(String(board.metres), 128 + i * 256, 112)); boardMap.needsUpdate = true })
  return circuit
}
