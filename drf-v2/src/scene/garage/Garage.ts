import { Group } from 'three'
import type { Locale, SceneProps, ZoneId } from '../../contracts/index.ts'
import { createDRF01 } from '../car/DRF01.ts'
import type { Resources, Vec3 } from './resources.ts'

export function createGarage(r: Resources) {
  const garage = new Group()
  garage.name = 'Recife-fictional-engineering-garage'
  const { carbon, floor, black, red, white, metal, light, redLight, glass } = r.palette
  const signs = new Map<ZoneId, ReturnType<Resources['sign']>>()
  function zoneSign(id: ZoneId, position: Vec3, rotation = 0) {
    const sign = r.sign(garage, '', [3.3, .72], position)
    sign.object.rotation.y = rotation
    signs.set(id, sign)
  }

  r.box(garage, [17, .15, 14], [0, -.08, .7], floor)
  r.box(garage, [.18, 4.4, 12], [-8.25, 2.2, 0], carbon)
  r.box(garage, [.035, .1, 11.8], [-8.14, .5, 0], red)
  for (const z of [-5, -2, 1, 4]) r.box(garage, [.12, 4.4, .12], [-8.09, 2.2, z], metal)
  // Cutaway sides preserve every authored view; open central roller door faces the track.
  for (const side of [-1, 1]) {
    r.box(garage, [3.1, 4.4, .25], [side * 6.45, 2.2, -6], carbon)
    r.box(garage, [.2, 4.4, .3], [side * 4.7, 2.2, -5.8], metal)
    r.box(garage, [.075, 3.8, .08], [side * 4.56, 2, -5.6], light)
    r.box(garage, [.12, .28, 12], [side * 8.2, .14, .15], carbon)
    r.box(garage, [.05, .018, 11.5], [side * 3, .012, 0], white)
  }
  r.box(garage, [16, .24, .48], [0, 4.4, -5.8], metal)
  r.box(garage, [9.1, .34, .23], [0, 4.11, -5.82], carbon)
  r.box(garage, [9, .045, .07], [0, 3.94, -5.64], redLight)
  const team = r.sign(garage, 'DRF ENGINEERING / RECIFE', [6, .75], [0, 4.58, -5.45])
  team.object.name = 'original-team-sign'
  for (const z of [-2, 3.8]) {
    r.box(garage, [16, .1, .1], [0, 4.55, z], carbon)
    for (const side of [-1, 1]) r.box(garage, [3, .035, .1], [side * 4.7, 4.46, z], light)
  }
  // Floor alignment markings. These are workshop geometry, not business metrics.
  r.box(garage, [4.9, .018, .055], [0, .012, 3.7], red)
  r.box(garage, [4.9, .018, .055], [0, .012, -3.7], red)
  for (let z = -3; z <= 3; z++) {
    r.box(garage, [.38, .018, .04], [2.43, .012, z], metal)
    r.box(garage, [.38, .018, .04], [-2.43, .012, z], metal)
  }
  garage.add(createDRF01(r))
  const carSign = r.sign(garage, 'DRF-01 / PROTOTYPE', [2.7, .48], [0, .08, 4.05])
  carSign.object.rotation.x = -Math.PI / 2

  // Telemetry workbench: symbolic circuit traces, deliberately no invented results.
  r.box(garage, [3.6, .95, .9], [-5.7, .48, -2.75], carbon)
  r.box(garage, [3.8, .1, 1.1], [-5.7, 1, -2.75], metal)
  for (const x of [-6.65, -5.5, -4.35]) {
    r.box(garage, [1.04, .76, .08], [x, 1.64, -3.05], black)
    r.box(garage, [.92, .62, .012], [x, 1.64, -2.997], glass)
    for (let line = 0; line < 4; line++) r.box(garage, [.73, .008, .014], [x, 1.4 + line * .14, -2.986], metal)
    r.box(garage, [.025, .39, .016], [x - .25, 1.61, -2.972], redLight)
    r.box(garage, [.25, .016, .016], [x - .13, 1.81, -2.972], light)
    r.box(garage, [.024, .22, .016], [x, 1.7, -2.972], light)
    r.box(garage, [.33, .015, .016], [x + .16, 1.59, -2.972], light)
    r.box(garage, [.06, .35, .1], [x, 1.17, -3.05], metal)
  }
  zoneSign('telemetry', [-5.7, 2.5, -3.08])

  // Pit wall: equipment rack and consoles directed toward the open track.
  r.box(garage, [3.6, .9, 1], [5.7, .45, -3.7], carbon)
  r.box(garage, [3.8, .1, 1.15], [5.7, .95, -3.7], white)
  for (const x of [4.55, 5.7, 6.85]) {
    r.box(garage, [1.04, .68, .08], [x, 1.42, -4.05], black)
    r.box(garage, [.9, .52, .015], [x, 1.42, -3.996], glass)
    r.box(garage, [.74, .025, .02], [x, 1.54, -3.98], redLight)
    r.box(garage, [.36, .012, .02], [x - .18, 1.35, -3.98], light)
    r.box(garage, [.7, .04, .25], [x, 1.02, -3.45], black)
  }
  zoneSign('pit-wall', [5.7, 2.4, -4.09])
  r.box(garage, [.7, 1.8, .65], [7.8, .9, -3.5], black)
  for (let y = .3; y < 1.7; y += .27) r.box(garage, [.55, .015, .02], [7.8, y, -3.16], metal)

  // Driver profile: an empty equipment locker and Recife-inspired bridge structure.
  r.box(garage, [2.4, 2.4, .55], [-5.8, 1.2, 2.05], carbon)
  for (const x of [-6.55, -5.75, -4.95]) {
    r.box(garage, [.67, 2.15, .07], [x, 1.18, 2.365], black)
    r.box(garage, [.03, .22, .055], [x + .2, 1.1, 2.43], metal)
    r.box(garage, [.42, .04, .03], [x, 2.04, 2.415], redLight)
  }
  zoneSign('driver-profile', [-5.8, 2.94, 2.4])
  r.box(garage, [2.5, .08, .5], [-5.8, .53, 3.2], red)
  for (const x of [-6.7, -4.9]) r.box(garage, [.1, .5, .3], [x, .25, 3.2], metal)
  const bridge = new Group()
  bridge.name = 'Recife-bridge-abstract-original'
  r.box(bridge, [2.5, .08, .18], [0, .7, 0], metal)
  for (const x of [-.75, .75]) {
    r.box(bridge, [.07, 1.2, .09], [x, .9, 0], white)
    for (const end of [-1.2, 0, 1.2]) r.rod(bridge, [x, 1.48, 0], [end, .74, 0], .012, metal)
  }
  bridge.position.set(-5.8, 3.36, 2)
  garage.add(bridge)

  // Strategy area: schematic board and conference table, no fake project content.
  r.box(garage, [3.6, 2, .12], [5.8, 2.2, 1.8], carbon)
  r.box(garage, [3.35, 1.75, .025], [5.8, 2.2, 1.876], glass)
  for (let x = 4.5; x <= 7.1; x += .65) r.box(garage, [.008, 1.5, .013], [x, 2.2, 1.898], metal)
  for (let y = 1.55; y <= 2.9; y += .3) r.box(garage, [3, .008, .013], [5.8, y, 1.898], metal)
  for (const x of [4.7, 5.8, 6.8]) r.box(garage, [.55, .24, .02], [x, x === 5.8 ? 2.55 : 1.9, 1.92], red)
  zoneSign('strategy-room', [5.8, 3.57, 1.91])
  r.box(garage, [3.4, .12, 1.35], [5.7, .95, 3.35], metal)
  for (const x of [4.45, 6.95]) r.box(garage, [.15, .88, 1.05], [x, .44, 3.35], carbon)
  r.box(garage, [1, .035, .65], [5.7, 1.03, 3.35], black)
  r.box(garage, [.32, .12, .22], [6.6, 1.08, 3.4], white)

  function updateLabels(index: SceneProps['contentIndex'], locale: Locale) {
    for (const entry of index) {
      if (entry.projectId === null) signs.get(entry.zoneId)?.setText(entry.label[locale])
    }
  }
  return { garage, updateLabels }
}
