import { Group } from 'three'
import type { Resources } from '../garage/resources.ts'
import { tracksideRoute } from './preparation.ts'

export function createTrackOpening(r: Resources) {
  const track = new Group()
  track.name = 'trackside-static-opening'
  const { carbon, red, white, metal, concrete: floor } = r.palette
  // Garage finish is y=-.007. A 5mm drainage fall to the apron is not a raised terrace.
  const groundY=tracksideRoute.start[1]
  const apron=r.box(track, [60, .14, 40], [0, -.082, -21.4], floor);apron.name='level-service-apron'
  // Begin at the garage floor's rear edge z=-8.5, avoiding overlapping coplanar finishes.
  const lane=r.box(track, [60, .07, 25.25], [0, groundY-.035, -21.125], carbon);lane.name='supported-service-lane'
  for (const z of [-8.5, -33.75]) r.box(track, [60, .002, .1], [0, groundY+.001, z], white)
  for (let x = -24; x <= 24; x += 2) r.box(track, [2, .03, .4], [x, groundY+.015, -33.35], x % 4 === 0 ? red : white)
  // A low separator behind the lane, with fencing at its flanks. No bars across the pit sightline.
  const barrier=r.box(track, [60, .42, .35], [0, groundY+.21, -33.6], floor);barrier.name='low-paddock-separator'
  r.box(track, [46, .16, 7.8], [0, 4.2, -37], carbon)
  for (let x = -20; x <= 20; x += 4) {
    r.rod(track, [x, .2, -38], [x, 4.15, -38], .08, metal)
    if(Math.abs(x)>=8)r.rod(track, [x, groundY+.42, -33.7], [x, 4.2, -33.7], .025, metal)
  }
  for (const y of [1.1, 1.45, 1.8, 2.15])for(const side of [-1,1])r.rod(track, [side*8, y+groundY, -33.7], [side*24, y+groundY, -33.7], .012, metal)
  // Abstract local horizon; original low-poly industrial/coastal forms.
  for (let n = 0; n < 12; n++) {
    const height = 1 + (n * 7 % 5) * .45
    r.box(track, [1.5, height, 1.8], [-24 + n * 4.5, height / 2, -38 - (n % 3)], metal)
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
