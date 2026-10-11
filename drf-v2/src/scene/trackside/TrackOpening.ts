import { Group, PlaneGeometry } from 'three'
import type { Resources } from '../garage/resources.ts'

export function createTrackOpening(r: Resources) {
  const track = new Group()
  track.name = 'trackside-static-opening'
  const { carbon, red, white, metal, concrete: floor } = r.palette
  r.box(track, [60, .1, 18], [0, -.1, -13], floor)
  // Raised service lane has real support and a shallow access ramp, not a floating car.
  const deck=r.box(track, [60, 1.14, 5.6], [0, .57, -13.7], floor);deck.name='supported-service-lane'
  r.box(track, [60, .07, 5.6], [0, 1.105, -13.7], carbon)
  const rise=1.14, run=4.1
  const apron=r.mesh(track,r.geometry(new PlaneGeometry(11.6,Math.hypot(rise,run))),floor,[-1.4,rise/2,-8.85])
  apron.rotation.x=-Math.PI/2+Math.atan(rise/run);apron.name='service-lane-access-ramp'
  for (const z of [-10.9, -16.5]) r.box(track, [60, .015, .1], [0, 1.155, z], white)
  for (let x = -24; x <= 24; x += 2) r.box(track, [2, .03, .4], [x, 1.155, -16.1], x % 4 === 0 ? red : white)
  // A low separator behind the lane, with fencing at its flanks. No bars across the pit sightline.
  const barrier=r.box(track, [60, .42, .35], [0, 1.35, -16.3], floor);barrier.name='low-paddock-separator'
  r.box(track, [46, .16, 7.8], [0, 4.2, -23], carbon)
  for (let x = -20; x <= 20; x += 4) {
    r.rod(track, [x, .2, -24], [x, 4.15, -24], .08, metal)
    if(Math.abs(x)>=8)r.rod(track, [x, 1.56, -16.4], [x, 3.54, -16.4], .025, metal)
  }
  for (const y of [1.1, 1.45, 1.8, 2.15])for(const side of [-1,1])r.rod(track, [side*8, y+1.14, -16.4], [side*24, y+1.14, -16.4], .012, metal)
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
  const lightweight = r.box(anchors, [.14, .22, .14], [7.55, 1.23, .9], white)
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
