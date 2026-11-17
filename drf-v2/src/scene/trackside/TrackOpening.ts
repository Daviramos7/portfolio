import { Group } from 'three'
import type { Resources } from '../garage/resources.ts'
import { tracksideRoute } from './preparation.ts'

export function createTrackOpening(r: Resources) {
  const track = new Group()
  track.name = 'trackside-static-opening'
  const { carbon, white, metal, asphalt, concrete: floor } = r.palette
  // Garage finish is y=-.007. A 5mm drainage fall to the apron is not a raised terrace.
  const groundY=tracksideRoute.start[1]
  // M16 4a: the straight sits at z -52, so the paddock scenery moves behind it. The right end stays open
  // (x > exitGap) for the curve's exit road, which runs into the fog.
  const back=-66.6, exitGap=19, width=200
  const apron=r.box(track, [width, .14, 74], [0, -.082, -38.4], floor);apron.name='level-service-apron'
  // Begin at the garage floor's rear edge z=-8.5, avoiding overlapping coplanar finishes.
  const laneDepth=back-.15+8.5
  const lane=r.box(track, [width, .07, -laneDepth], [0, groundY-.035, -8.5+laneDepth/2], asphalt);lane.name='supported-service-lane'
  const exitRoad=r.box(track, [9, .07, 64], [tracksideRoute.end[0], groundY-.035, back-.15-32], asphalt);exitRoad.name='curve-exit-road'
  for (const z of [-8.5, back-.15]) r.box(track, [width, .002, .1], [0, groundY+.001, z], white)
  // M16 4b: kerbs, edge lines, verges and the horizon live in circuit.ts and skyline.ts.
  // A low separator behind the lane, with fencing at its flanks. No bars across the race sightline.
  const left=-60, separatorWidth=exitGap-left
  const barrier=r.box(track, [separatorWidth, .42, .35], [(left+exitGap)/2, groundY+.21, back], floor);barrier.name='low-paddock-separator'
  r.box(track, [46, .16, 7.8], [exitGap-4-23, 4.2, back-3.4], carbon)
  for (let x = -28; x <= exitGap-4; x += 4) {
    r.rod(track, [x, .2, back-4.4], [x, 4.15, back-4.4], .08, metal)
    if(x<=-8||x>=8)r.rod(track, [x, groundY+.42, back-.1], [x, 4.2, back-.1], .025, metal)
  }
  for (const y of [1.1, 1.45, 1.8, 2.15])for(const [a,b] of [[-40,-8],[8,exitGap-4]])r.rod(track, [a, y+groundY, back-.1], [b, y+groundY, back-.1], .012, metal)
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
