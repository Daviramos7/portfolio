import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Color, InstancedMesh, Matrix4, Mesh, PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { createResources } from '../src/scene/garage/resources.ts'
import { consoleDrop, createGarage } from '../src/scene/garage/Garage.ts'
import { createPitLevel, pitBoxes, pitBoxSlots, pitLevelHiddenFrom, setPitLevelQuality } from '../src/scene/garage/pitLevel.ts'
import { circuitPlan, createCircuit } from '../src/scene/trackside/circuit.ts'
import { createSkyline, setSkylineQuality, skylinePlan } from '../src/scene/trackside/skyline.ts'
import { createTrackOpening } from '../src/scene/trackside/TrackOpening.ts'
import { tracksidePose, tracksideRoute } from '../src/scene/trackside/preparation.ts'
import { framings, mobileFramings, programmeFramings, roomElevation } from '../src/scene/camera/framing.ts'

// M16 4b: track dressing, pit box fronts, fictional horizon and the lower rear consoles.
const resources = () => { globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => null }) }; return createResources() }
const meshes = root => { const found = []; root.traverse(o => { if (o instanceof Mesh) found.push(o) }); return found }
const instances = mesh => Array.from({ length: mesh.count }, (_, i) => {
  const matrix = new Matrix4(); mesh.getMatrixAt(i, matrix)
  return { position: new Vector3().setFromMatrixPosition(matrix), matrix }
})
const route = Array.from({ length: 4001 }, (_, i) => tracksidePose({ direction: 'left-to-right' }, i / 4000).position)
const fromRoute = point => Math.min(...route.map(([x, , z]) => Math.hypot(point.x - x, point.z - z)))
const grade = tracksideRoute.start[1]

test('each repeated circuit element is one instanced type and the dressing stays within nine draw calls', () => {
  const r = resources(), circuit = createCircuit(r)
  for (const name of ['grass-verges', 'track-edge-lines', 'track-kerbs', 'track-light-posts', 'track-light-lenses', 'pit-wall-fence'])
    assert.ok(circuit.getObjectByName(name) instanceof InstancedMesh, name + ' is instanced')
  assert.equal(meshes(circuit).length, 9, 'verges, gravel, lines, kerbs, posts, lenses, wall, fence, boards')
  for (const mesh of meshes(circuit)) assert.equal(mesh.castShadow, false, mesh.name + ' stays out of the room shadow map')
  r.dispose()
})

test('light posts stand every 10 m along the far verge of the straight, clear of the track', () => {
  const r = resources(), circuit = createCircuit(r), posts = instances(circuit.getObjectByName('track-light-posts'))
  const straight = posts.filter(post => Math.abs(post.position.z - circuitPlan.postZ) < 1e-6).map(post => post.position.x).sort((a, b) => a - b)
  assert.ok(straight.length >= 10)
  for (let i = 1; i < straight.length; i++) assert.ok(Math.abs(straight[i] - straight[i - 1] - 10) < 1e-6, '10 m pitch')
  assert.ok(circuitPlan.postZ < tracksideRoute.straightZ, 'posts never stand between the room and the cars')
  for (const post of posts) assert.ok(fromRoute(post.position) > circuitPlan.halfWidth + 1, 'post outside the track')
  assert.equal(circuit.getObjectByName('track-light-lenses').count, posts.length)
  r.dispose()
})

test('kerbs alternate red and white, hug the track edge and never reach the racing line', () => {
  const r = resources(), circuit = createCircuit(r), kerbs = circuit.getObjectByName('track-kerbs'), placed = instances(kerbs)
  assert.ok(placed.length >= 40)
  const previous = new Color(), next = new Color()
  for (let i = 0; i < placed.length; i++) {
    const offset = fromRoute(placed[i].position)
    assert.ok(offset > circuitPlan.halfWidth - .05 && offset < circuitPlan.halfWidth + circuitPlan.kerbWidth + .05, 'kerb ' + i + ' at ' + offset.toFixed(2) + ' m from the route')
    if (i) { kerbs.getColorAt(i - 1, previous); kerbs.getColorAt(i, next); assert.ok(Math.abs(previous.r - next.r) + Math.abs(previous.g - next.g) > .3, 'alternating colours') }
  }
  // Curve blocks exist on both sides of the bend.
  const [cx, cz] = circuitPlan.curveCenter, radial = placed.map(kerb => Math.hypot(kerb.position.x - cx, kerb.position.z - cz))
  assert.ok(radial.some(d => d < tracksideRoute.curve.radius - circuitPlan.halfWidth))
  assert.ok(radial.some(d => Math.abs(d - (tracksideRoute.curve.radius + circuitPlan.halfWidth + circuitPlan.kerbWidth / 2)) < .01))
  r.dispose()
})

test('braking boards mark 100 m and 50 m before turn-in, two-sided, from one atlas in one draw call', () => {
  const r = resources(), circuit = createCircuit(r), boards = circuit.getObjectByName('brake-boards')
  assert.deepEqual(circuitPlan.brakeBoards.map(board => [board.metres, tracksideRoute.curve.x - board.x]), [[100, 100], [50, 50]])
  assert.ok(boards instanceof Mesh && !(boards instanceof InstancedMesh) && boards.material.map)
  const position = boards.geometry.attributes.position, normal = boards.geometry.attributes.normal
  for (const board of circuitPlan.brakeBoards) {
    const facing = new Set()
    for (let i = 0; i < position.count; i++) if (Math.abs(position.getX(i) - board.x) < 1.5 && position.getY(i) > 1.5) facing.add(Math.sign(Math.round(normal.getZ(i) * 100)))
    assert.ok(facing.has(1) && facing.has(-1), board.metres + ' reads from the room and from the track')
  }
  const bounds = new Box3().setFromObject(boards)
  assert.ok(bounds.max.z < tracksideRoute.straightZ - circuitPlan.halfWidth, 'boards stand on the far verge')
  r.dispose()
})

test('the dressing leaves the paved grade untouched under the tyres (M15 y = -0.007)', () => {
  const r = resources(), circuit = createCircuit(r), opening = createTrackOpening(r); circuit.updateMatrixWorld(true); opening.track.updateMatrixWorld(true)
  assert.ok(Math.abs(new Box3().setFromObject(opening.track.getObjectByName('supported-service-lane')).max.y - grade) < 1e-6)
  for (let i = 0; i <= 400; i += 4) for (const side of [-1.4, 0, 1.4]) {
    const pose = tracksidePose({ direction: 'left-to-right' }, i / 400)
    const x = pose.position[0] + Math.cos(pose.yaw) * side, z = pose.position[2] - Math.sin(pose.yaw) * side
    const hit = new Raycaster(new Vector3(x, 3, z), new Vector3(0, -1, 0)).intersectObject(circuit, true)[0]
    assert.equal(hit, undefined, 'nothing from the dressing lies on the racing line at progress ' + i / 400)
  }
  r.dispose()
})

test('three box doors with a 2 m false depth; slots are named, empty and inside their bay', () => {
  const r = resources(), pit = createPitLevel(r); pit.updateMatrixWorld(true)
  assert.equal(pitBoxes.bays.length, 3); assert.equal(pitBoxes.depth, 2)
  const back = new Box3().setFromObject(pit.getObjectByName('pit-back-wall'))
  assert.ok(Math.abs(back.min.z - (pitBoxes.doorZ + pitBoxes.depth)) < 1e-6, 'dark wall 2 m behind the door line')
  assert.ok(pit.getObjectByName('pit-level-structure') instanceof InstancedMesh)
  assert.ok(meshes(pit).length <= 6, 'floor, back wall, structure, lights, numbers, tyre sets')
  const slots = pit.getObjectByName('pit-box-slots')
  assert.deepEqual(slots.children.map(slot => slot.name).sort(), pitBoxSlots.map(slot => slot.name).sort())
  for (const name of ['slot-cobra-cavalete', 'slot-bola-chuteiras', 'slot-case-guitarra', 'slot-mini-amp', 'slot-vaso-esp32', 'slot-placa-rec-pe', 'slot-cinto-ferramentas', 'slot-setlists']) {
    const slot = slots.getObjectByName(name), plan = pitBoxSlots.find(item => item.name === name); assert.ok(slot && plan, name)
    assert.equal(meshes(slot).length, 0, name + ' has no stand-in geometry'); assert.equal(slot.children.length, 0)
    assert.ok(Math.abs(slot.position.x - pitBoxes.bays[plan.bay]) < pitBoxes.doorWidth / 2 + .1, name + ' inside its bay')
    assert.ok(slot.position.z > pitBoxes.doorZ && slot.position.z < pitBoxes.doorZ + pitBoxes.depth + .05 && slot.position.y < roomElevation - .19)
  }
  r.dispose()
})

test('low quality drops the box props and keeps one horizon plane; balanced restores both', () => {
  const r = resources(), pit = createPitLevel(r), skyline = createSkyline(r)
  const props = pit.getObjectByName('pit-box-props'), planes = () => skyline.children.filter(plane => plane.visible).length
  assert.ok(props.getObjectByName('pit-tyre-blankets') instanceof InstancedMesh)
  setPitLevelQuality(pit, 'low'); setSkylineQuality(skyline, 'low'); assert.equal(props.visible, false); assert.equal(planes(), 1)
  assert.equal(skyline.getObjectByName('skyline-near').visible, true)
  setPitLevelQuality(pit, 'balanced'); setSkylineQuality(skyline, 'balanced'); assert.equal(props.visible, true); assert.equal(planes(), 2)
  r.dispose()
})

test('the boxes are skipped only while the camera is inside the room, where the slab hides them', () => {
  for (const view of [...Object.values(framings), ...Object.values(mobileFramings), ...Object.values(programmeFramings)])
    assert.equal(pitLevelHiddenFrom({ x: view.position[0], y: view.position[1], z: view.position[2] }), true)
  // Outside the glass, below or above the slab (evidence views): drawn.
  assert.equal(pitLevelHiddenFrom({ x: 0, y: 3.2 - roomElevation, z: -24 }), false)
  assert.equal(pitLevelHiddenFrom({ x: -13, y: 5 - roomElevation, z: -22 }), false)
})

test('horizon: two alpha-tested cut-outs from one atlas at z -60..-90, above the middle of the hero frame', () => {
  const r = resources(), skyline = createSkyline(r), near = skyline.getObjectByName('skyline-near'), far = skyline.getObjectByName('skyline-far')
  assert.equal(meshes(skyline).length, 2); assert.equal(near.material, far.material, 'one material, one atlas')
  assert.ok(near.material.alphaTest >= .5 && !near.material.transparent && near.material.fog && !near.material.toneMapped)
  assert.deepEqual([near.material.map.image.width, near.material.map.image.height], [...skylinePlan.atlas])
  for (const plane of [near, far]) {
    const bounds = new Box3().setFromObject(plane)
    assert.ok(bounds.min.z >= -90 && bounds.max.z <= -60, plane.name + ' depth'); assert.ok(Math.abs(bounds.min.y - grade) < 1e-6)
  }
  assert.ok(skylinePlan.near.z > skylinePlan.far.z && skylinePlan.near.z < -66.6, 'behind the paddock separator, near plane in front')
  // The near plane opens for the exit road; the car leaves through the gap.
  const x = near.geometry.attributes.position, [g0, g1] = skylinePlan.near.gap, exit = tracksideRoute.end[0]
  for (let i = 0; i < x.count; i++) assert.ok(x.getX(i) <= g0 + 1e-6 || x.getX(i) >= g1 - 1e-6)
  assert.ok(g0 < exit - circuitPlan.halfWidth && g1 > exit + circuitPlan.halfWidth)
  // One atlas repeat is wider than the widest view through the facade (hero desktop sees about 80 m).
  assert.ok(skylinePlan.tile >= 100)
  for (const [view, fov, aspect] of [[framings.garage, 43, 1.6], [mobileFramings.garage, 63, 390 / 844]]) {
    const camera = new PerspectiveCamera(fov, aspect, .1, 130); camera.position.set(view.position[0], view.position[1] + roomElevation, view.position[2])
    camera.lookAt(view.lookAt[0], view.lookAt[1] + roomElevation, view.lookAt[2]); camera.updateMatrixWorld()
    const top = new Vector3(view.position[0] - 30, grade + skylinePlan.near.height * .6, skylinePlan.near.z).project(camera)
    assert.ok(top.y > 0 && top.y < 1, 'skyline sits in the upper half of the frame')
  }
  r.dispose()
})

test('rear consoles drop 0.2 m; screens stay; the straight shows between desk and monitor on mobile', () => {
  const r = resources(), garage = createGarage(r).garage; garage.updateMatrixWorld(true)
  assert.equal(consoleDrop, .2)
  for (const zone of ['telemetry', 'pit-wall']) {
    const top = new Box3().setFromObject(garage.getObjectByName(zone + '-console-top'))
    assert.ok(Math.abs(top.max.y - (1.05 - consoleDrop)) < 1e-6, zone + ' desk top')
    const centre = garage.getObjectByName('programme-screen-' + zone).getWorldPosition(new Vector3())
    assert.ok(Math.abs(centre.y - 1.87) < 1e-6, zone + ' screen height unchanged')
    // Room-local ray from the approved mobile camera to the straight, 0.3 m above the asphalt (world is 4.5 m lower).
    const eye = new Vector3(...mobileFramings[zone].position), side = Math.sign(eye.x); let clear = 0
    const solid = meshes(garage).filter(mesh => mesh.name !== 'fake-glass-facade')
    for (let x = 0; x <= 40; x += 1) {
      const target = new Vector3(side * x, grade - roomElevation + .3, tracksideRoute.straightZ)
      if (!new Raycaster(eye, target.sub(eye).normalize()).intersectObjects(solid, false).length) clear++
    }
    assert.ok(clear >= 5, zone + ': ' + clear + ' m of the straight visible from the mobile camera')
  }
  r.dispose()
})
