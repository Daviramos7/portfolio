import { Group, PlaneGeometry } from 'three'
import type { Resources } from '../garage/resources.ts'

export function createTrackOpening(r: Resources) {
  const track = new Group()
  track.name = 'trackside-static-opening'
  const { carbon, red, white, metal, concrete: floor } = r.palette
  r.box(track, [60, .1, 18], [0, -.1, -13], floor)
  // Raised service lane has real support and a shallow access ramp, not a floating car.
  r.box(track, [60, .42, 3.5], [0, .17, -11.3], floor)
  r.box(track, [60, .07, 3.5], [0, .385, -11.3], carbon)
  const rise=.42, run=2.75
  const apron=r.mesh(track,r.geometry(new PlaneGeometry(8.8,Math.hypot(rise,run))),floor,[0,rise/2,-8.175])
  apron.rotation.x=-Math.PI/2+Math.atan(rise/run);apron.name='service-lane-access-ramp'
  for (const z of [-9.55, -13.05]) r.box(track, [60, .015, .1], [0, .435, z], white)
  for (let x = -24; x <= 24; x += 2) r.box(track, [2, .03, .4], [x, .435, -13.3], x % 4 === 0 ? red : white)
  // A low separator behind the lane, with fencing at its flanks. No bars across the pit sightline.
  const barrier=r.box(track, [60, .42, .35], [0, .21, -14], floor);barrier.name='low-paddock-separator'
  r.box(track, [46, .16, 7.8], [0, 4.2, -23], carbon)
  for (let x = -20; x <= 20; x += 4) {
    r.rod(track, [x, .2, -24], [x, 4.15, -24], .08, metal)
    if(Math.abs(x)>=8)r.rod(track, [x, .42, -14.1], [x, 2.4, -14.1], .025, metal)
  }
  for (const y of [1.1, 1.45, 1.8, 2.15])for(const side of [-1,1])r.rod(track, [side*8, y, -14.1], [side*24, y, -14.1], .012, metal)
  // Abstract local horizon; original low-poly industrial/coastal forms.
  for (let n = 0; n < 12; n++) {
    const height = 1 + (n * 7 % 5) * .45
    r.box(track, [1.5, height, 1.8], [-24 + n * 4.5, height / 2, -24 - (n % 3)], metal)
  }
  const anchors = new Group()
  anchors.name = 'trackside-effect-anchors-inactive'
  const reflection = new Group()
  reflection.name = 'opening-reflection-anchor'
  reflection.position.set(0, .02, -4.8)
  const lightweight = r.box(anchors, [.14, .22, .14], [6.6, 1.23, 3.4], white)
  lightweight.name = 'lightweight-object-rest-pose'
  const restPosition = lightweight.position.clone()
  const restQuaternion = lightweight.quaternion.clone()
  anchors.add(reflection)
  // Anchors are exposed to the future CAR_PASS adapter, never animated in this cut.
  return {
    track,
    anchors,
    reflection,
    lightweight,
    restore: () => { lightweight.position.copy(restPosition); lightweight.quaternion.copy(restQuaternion) },
  }
}
