import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Raycaster, Vector3 } from 'three'
import { framings, mobileFramings, programmeFramings, roomElevation } from '../src/scene/camera/framing.ts'
import { createGarage } from '../src/scene/garage/Garage.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { facade } from '../src/scene/garage/facade.ts'
import { createPitLevel } from '../src/scene/garage/pitLevel.ts'

// Approved framings before M16 4a (commit d22f389). Positions must stay; only two desktop targets may move.
const approved = {
  desktop: {
    garage: [[4.8, 1.85, 7.05], [0, .8, .15]], telemetry: [[-3.4, 1.9, -.25], [-5.7, 1.7, -4.75]],
    'pit-wall': [[3.45, 1.9, -.25], [5.75, 1.8, -4.75]], 'driver-profile': [[-3.25, 1.85, 3.7], [-7.65, 1.75, 2.1]],
    'strategy-room': [[3.3, 1.85, 4.4], [7.65, 1.95, 1.9]],
  },
  mobile: {
    garage: [[5.6, 2.15, 9.6], [0, .85, .1]], telemetry: [[-3.55, 1.85, 1.7], [-5.7, 1.75, -4.75]],
    'pit-wall': [[3.55, 1.85, 1.7], [5.75, 1.75, -4.75]], 'driver-profile': [[-1.6, 1.85, 3.7], [-7.65, 1.75, 2.1]],
    'strategy-room': [[1.6, 1.85, 4.4], [7.65, 2, 1.9]],
  },
}
const fixture = () => { globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => null }) }; const r = createResources(); return { r, garage: createGarage(r).garage } }

test('the room rises 4.5 m and every approved camera position is unchanged (room-local)', () => {
  assert.equal(roomElevation, 4.5)
  for (const [views, expected] of [[framings, approved.desktop], [mobileFramings, approved.mobile]])
    for (const [zone, [position]] of Object.entries(expected)) assert.deepEqual(views[zone].position, position, zone)
  assert.deepEqual(programmeFramings.desktop.position, [-3.7, 1.9, -.6])
})

test('only the desktop Telemetry and Pit Wall targets move, and only vertically', () => {
  for (const [zone, [, lookAt]] of Object.entries(approved.mobile)) assert.deepEqual(mobileFramings[zone].lookAt, lookAt, 'mobile ' + zone)
  for (const [zone, [, lookAt]] of Object.entries(approved.desktop)) {
    const now = framings[zone].lookAt
    if (zone === 'telemetry' || zone === 'pit-wall') { assert.equal(now[0], lookAt[0]); assert.equal(now[2], lookAt[2]); assert.equal(now[1], 1.5) }
    else assert.deepEqual(now, lookAt, zone)
  }
})

test('the rear wall is now an open glass facade: mid-bay rays at eye height reach the fake glass first', () => {
  const { r, garage } = fixture(); garage.updateMatrixWorld(true)
  const pane = garage.getObjectByName('fake-glass-facade')
  assert.ok(pane.material.transparent && pane.material.opacity <= .15 && !pane.material.depthWrite, 'cheap fake glass')
  assert.equal(pane.material.transmission, undefined, 'no transmission pass')
  for (let x = -facade.halfWidth + facade.bay / 2; x < facade.halfWidth; x += facade.bay) {
    const hit = new Raycaster(new Vector3(x, 1.8, -6.1), new Vector3(0, 0, -1)).intersectObject(garage, true)[0]
    assert.equal(hit?.object.name, 'fake-glass-facade', 'bay at x ' + x.toFixed(1))
  }
  const rail = new Box3().setFromObject(garage.getObjectByName('facade-guard-rail'))
  assert.ok(Math.abs(rail.max.y - (facade.rail + .025)) < 1e-6, 'guard rail at 1.05 m')
  r.dispose()
})

test('pit boxes stand on the M15 grade and reach the underside of the elevated slab', () => {
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => null }) }
  const r = createResources(), pit = createPitLevel(r); pit.updateMatrixWorld(true)
  const floor = new Box3().setFromObject(pit.getObjectByName('pit-bay-floor'))
  assert.ok(Math.abs(floor.max.y - -.007) < 1e-6, 'bay floor top at y = -0.007 (M15 grade)')
  const wall = new Box3().setFromObject(pit.getObjectByName('pit-back-wall'))
  assert.ok(Math.abs(wall.max.y - (roomElevation - .19)) < 1e-6, 'walls meet the slab underside')
  r.dispose()
})

test('the show-car plinth surrounds DRF-01 at floor level without raising the car', () => {
  const { r, garage } = fixture(); garage.updateMatrixWorld(true)
  const plinth = garage.getObjectByName('show-car-plinth')
  assert.ok(plinth && plinth.position.y < .01)
  const ray = new Raycaster(new Vector3(0, 3, .05), new Vector3(0, -1, 0)).intersectObject(plinth)[0]
  assert.equal(ray, undefined, 'the ring is open under the car')
  r.dispose()
})
