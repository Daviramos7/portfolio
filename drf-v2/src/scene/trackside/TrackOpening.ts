import { Group } from 'three'
import type { Resources } from '../garage/resources.ts'

export function createTrackOpening(r: Resources) {
  const track = new Group()
  track.name = 'trackside-static-opening'
  const { carbon, red, white, metal, floor } = r.palette
  r.box(track, [60, .1, 18], [0, -.1, -13], floor)
  r.box(track, [60, .07, 5], [0, -.02, -11], carbon)
  for (const z of [-8.3, -13.7]) r.box(track, [60, .015, .1], [0, .025, z], white)
  for (let x = -24; x <= 24; x += 2) r.box(track, [2, .03, .4], [x, .045, -8.6], x % 4 === 0 ? red : white)
  r.box(track, [60, .7, .25], [0, .35, -15], metal)
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
