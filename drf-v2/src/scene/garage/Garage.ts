import { CircleGeometry, Group, MeshBasicMaterial, PlaneGeometry, TorusGeometry } from 'three'
import type { Locale, SceneProps, ZoneId } from '../../contracts/index.ts'
import { createDRF01 } from '../car/DRF01.ts'
import type { Resources, Vec3 } from './resources.ts'

export function createGarage(r: Resources) {
  const garage = new Group(); garage.name = 'DRF-interior-workshop'
  const { carbon, floor, black, red, white, metal, light, redLight, glass, tire } = r.palette
  const signs = new Map<ZoneId, ReturnType<Resources['sign']>>()
  function zoneSign(id: ZoneId, p: Vec3, rotation = 0) {
    const sign = r.sign(garage, '', [2.8, .7], p); sign.object.rotation.y = rotation; signs.set(id, sign)
  }
  // Fully enclosed interior; cameras remain below the roof and within the room.
  r.box(garage, [17, .18, 20], [0, -.1, 1.5], floor)
  r.box(garage, [17, .22, 19], [0, 4.65, 2.4], black)
  for (const side of [-1, 1]) {
    r.box(garage, [.2, 4.6, 19], [side * 8.4, 2.3, 2.4], carbon)
    r.box(garage, [.04, .22, 14.8], [side * 8.26, .55, .4], red)
    r.box(garage, [.045, .06, 14.8], [side * 8.24, 3.4, .4], metal)
    for (let z = -6; z <= 7; z += 2) {
      r.box(garage, [.15, 4.5, .12], [side * 8.18, 2.25, z], metal)
      r.box(garage, [.1, .08, 1.6], [side * 8.05, 3.82, z + .7], light)
    }
    r.box(garage, [4.45, 4.6, .24], [side * 6.17, 2.3, -6.6], carbon)
    r.box(garage, [.19, 4.35, .3], [side * 3.88, 2.2, -6.4], metal)
    r.box(garage, [.055, 3.95, .055], [side * 3.74, 2.2, -6.21], light)
  }
  r.box(garage, [17, .18, .5], [0, 4.43, -6.4], metal)
  r.box(garage, [7.6, .26, .24], [0, 4.2, -6.39], black)
  // Roller shutter overhead, roof trusses and suspended lighting form repeated depth cues.
  for (let n = 0; n < 7; n++) r.box(garage, [7.6, .075, .23], [0, 3.9 + n * .08, -6.42], metal)
  for (const z of [-5.5, -2.6, .3, 3.2, 6.1]) {
    r.box(garage, [16.7, .15, .15], [0, 4.32, z], metal)
    r.box(garage, [16.5, .1, .12], [0, 4.04, z], carbon)
    for (let x = -7; x < 8; x += 2) r.rod(garage, [x, 4.04, z], [x + 1.2, 4.32, z], .026, metal)
    for (const side of [-1, 1]) {
      r.box(garage, [3.2, .09, .42], [side * 3.7, 3.95, z], black)
      r.box(garage, [2.95, .025, .28], [side * 3.7, 3.89, z], light)
    }
  }
  for (const x of [-7.6, 7.6]) {
    r.rod(garage, [x, 4.02, -6], [x, 4.02, 7], .13, metal)
    for (let z = -5; z < 7; z += 2) r.rod(garage, [x, 4.03, z], [x, 4.42, z], .02, metal)
  }
  // Epoxy expansion joints, service bay outlines and grated drainage.
  for (const x of [-6, -3, 3, 6]) r.box(garage, [.016, .005, 15], [x, .001, 0], black)
  for (const z of [-5, -2, 1, 4, 7]) r.box(garage, [16, .005, .016], [0, .001, z], black)
  for (const side of [-1, 1]) r.box(garage, [.045, .008, 7.8], [side * 2.65, .006, .15], white)
  for (const z of [-3.8, 4.1]) r.box(garage, [5.3, .008, .065], [0, .006, z], red)
  r.box(garage, [15, .04, .35], [0, -.01, -5.85], black)
  for (let x = -7; x <= 7; x += .18) r.box(garage, [.05, .02, .3], [x, .02, -5.85], metal)
  garage.add(createDRF01(r))

  // Cheap static contact patch; no live mirror, ray tracing or postprocess.
  const patchMat = r.material(new MeshBasicMaterial({ color: '#06080c', transparent: true, opacity: .38, depthWrite: false }))
  const contact = r.mesh(garage, r.geometry(new CircleGeometry(1, 48)), patchMat, [0, .006, .05])
  contact.rotation.x = -Math.PI / 2; contact.scale.set(1.5, 2.65, 1); contact.castShadow = false
  zoneSign('garage', [0, 3.44, -6.15])
  const team = r.sign(garage, 'DRF ENGINEERING', [3.5, .8], [-6.25, 3.4, -6.44])
  team.setText('DRF ENGINEERING', 'RECIFE / BRASIL · EQUIPE FICTÍCIA')

  // Telemetry: instruments, cable tray, rack, keyboards; no invented numerical results.
  const bench = new Group(); bench.position.set(-5.7, 0, -4.75)
  r.box(bench, [3.7, .95, .8], [0, .48, 0], black)
  r.box(bench, [3.9, .1, 1.12], [0, 1, .04], metal)
  for (const x of [-1.15, 0, 1.15]) {
    r.box(bench, [1.08, .77, .1], [x, 1.65, -.23], carbon)
    r.box(bench, [.97, .65, .018], [x, 1.65, -.167], glass)
    for (let y = 1.4; y < 1.95; y += .12) r.box(bench, [.84, .004, .015], [x, y, -.15], metal)
    r.box(bench, [.7, .01, .02], [x, 1.64, -.138], light)
    r.box(bench, [.028, .22, .02], [x - .21, 1.76, -.138], redLight)
    r.box(bench, [.06, .3, .1], [x, 1.16, -.23], metal)
    r.box(bench, [.7, .035, .25], [x, 1.085, .3], carbon)
    r.rod(bench, [x, 1.1, -.3], [x, .17, -.38], .013, black)
  }
  garage.add(bench); zoneSign('telemetry', [-5.7, 2.6, -5.02])
  r.box(garage, [.7, 2.05, .78], [-7.72, 1.025, -4.95], black)
  for (let y = .3; y < 2; y += .18) r.box(garage, [.53, .025, .025], [-7.72, y, -4.53], metal)

  // Pit wall on the other side of the opening.
  r.box(garage, [3.6, .95, 1], [5.75, .475, -4.65], black)
  r.box(garage, [3.8, .1, 1.16], [5.75, 1, -4.6], carbon)
  for (const x of [4.6, 5.75, 6.9]) {
    r.box(garage, [1.06, .73, .08], [x, 1.62, -4.94], black)
    r.box(garage, [.95, .6, .018], [x, 1.62, -4.89], glass)
    r.box(garage, [.76, .02, .015], [x, 1.77, -4.87], redLight)
    for (const y of [1.46, 1.55]) r.box(garage, [.55, .012, .015], [x - .09, y, -4.87], light)
    r.box(garage, [.06, .32, .1], [x, 1.18, -4.95], metal)
    r.box(garage, [.7, .03, .27], [x, 1.07, -4.42], black)
  }
  zoneSign('pit-wall', [5.75, 2.63, -5.05])

  // Profile station on left wall, with original abstract Recife bridge and equipment.
  const profile = new Group(); profile.position.set(-7.9, 0, 2.1); profile.rotation.y = Math.PI / 2
  r.box(profile, [3.6, 2.55, .3], [0, 1.28, 0], black)
  for (const x of [-1.2, 0, 1.2]) {
    r.box(profile, [1.06, 2.3, .08], [x, 1.2, .2], carbon)
    r.box(profile, [.04, .25, .05], [x + .32, 1.23, .27], metal)
    for (let y = 2.15; y < 2.4; y += .06) r.box(profile, [.68, .012, .014], [x, y, .253], metal)
  }
  r.box(profile, [3.6, .12, .65], [0, .55, .9], red)
  for (const x of [-1.5, 1.5]) r.box(profile, [.1, .5, .5], [x, .25, .9], metal)
  r.box(profile, [2.5, .08, .2], [0, 3.23, .12], metal)
  for (const x of [-.75, .75]) {
    r.box(profile, [.07, .7, .09], [x, 3.36, .12], white)
    for (const end of [-1.2, 0, 1.2]) r.rod(profile, [x, 3.68, .12], [end, 3.26, .12], .009, metal)
  }
  garage.add(profile); zoneSign('driver-profile', [-7.65, 2.95, 2.1], Math.PI / 2)

  // Strategy bench against the right wall frees the hero line of sight.
  const strategy = new Group(); strategy.position.set(7.9, 0, 1.9); strategy.rotation.y = -Math.PI / 2
  r.box(strategy, [3.75, 2.1, .14], [0, 2.15, 0], black)
  r.box(strategy, [3.52, 1.83, .02], [0, 2.15, .084], glass)
  for (let x = -1.5; x <= 1.5; x += .5) r.box(strategy, [.005, 1.62, .015], [x, 2.15, .107], metal)
  for (let y = 1.45; y < 2.95; y += .25) r.box(strategy, [3.22, .005, .015], [0, y, .107], metal)
  for (const x of [-1.1, 0, 1.1]) r.box(strategy, [.57, .21, .02], [x, x === 0 ? 2.5 : 1.87, .124], red)
  r.box(strategy, [3.8, .14, 1.25], [0, .98, .82], metal)
  for (const x of [-1.55, 1.55]) r.box(strategy, [.12, .92, 1], [x, .46, .82], carbon)
  r.box(strategy, [.95, .035, .6], [0, 1.07, .82], black)
  garage.add(strategy); zoneSign('strategy-room', [7.66, 3.45, 1.9], -Math.PI / 2)

  // Real workshop scale: drawer chests, lift stands, spares, tool silhouettes and coiled hose.
  const chest = new Group(); chest.position.set(-6.3, 0, -.65)
  r.box(chest, [1.6, .9, .7], [0, .56, 0], red)
  r.box(chest, [1.68, .08, .76], [0, 1.05, 0], metal)
  for (let y = .32; y < 1; y += .14) r.box(chest, [1.42, .035, .04], [0, y, .38], metal)
  for (const x of [-.62, .62]) for (const z of [-.24, .24]) r.rod(chest, [x, .09, z], [x, .22, z], .08, tire)
  garage.add(chest)
  r.box(garage, [2.1, 1.4, .08], [-6.3, 2, -.96], black)
  for (let x = -7.1; x < -5.4; x += .22) {
    r.rod(garage, [x, 1.65, -.89], [x, 2.1 + (Math.round(x * 10) % 3) * .07, -.89], .016, metal)
    r.box(garage, [.07, .16, .055], [x, 1.7, -.86], red)
  }
  const hoseShape = r.geometry(new TorusGeometry(.4, .022, 6, 40))
  for (let n = 0; n < 4; n++) r.mesh(garage, hoseShape, black, [-7.8, .7, -.7 + n * .05]).rotation.y = Math.PI / 2
  r.rod(garage, [-7.8, .31, -.5], [-7.2, .05, .5], .018, black)
  for (const side of [-1, 1]) {
    r.rod(garage, [side * 2.1, .05, -2.8], [side * 2.1, .8, -2.8], .022, metal)
    r.rod(garage, [side * 2.1, .5, -2.8], [side * 1.8, .06, -2.55], .023, metal)
    r.box(garage, [.38, .04, .38], [side * 2.1, .04, -2.8], black)
  }
  // Index-derived project plaques, never a parallel catalogue.
  const projectSigns = [
    r.sign(garage, '', [1.65, .4], [-8.045, 2.1, -2.6]),
    r.sign(garage, '', [1.65, .4], [-8.045, 1.65, -2.6]),
    r.sign(garage, '', [1.65, .4], [-8.045, 1.2, -2.6]),
  ]
  projectSigns.forEach(sign => { sign.object.rotation.y = Math.PI / 2 })
  r.box(garage, [.1, 1.58, 1.85], [-8.13, 1.65, -2.6], carbon)

  // Functional ventilation and a slow instrumentation sweep: the renderer owns their one clock.
  const fanAssembly = new Group(); fanAssembly.position.set(-8.03, 3.72, -.15); fanAssembly.rotation.y = Math.PI / 2
  const fan = new Group(); fanAssembly.add(fan)
  for (let n = 0; n < 5; n++) {
    const blade = r.box(fan, [.15, .43, .035], [0, .22, 0], metal)
    blade.position.set(Math.sin(n * Math.PI * 2 / 5) * .19, Math.cos(n * Math.PI * 2 / 5) * .19, 0)
    blade.rotation.z = -n * Math.PI * 2 / 5; blade.userData.dynamic = true; blade.castShadow = false
  }
  garage.add(fanAssembly)
  const fanRing = r.mesh(garage, r.geometry(new TorusGeometry(.48, .05, 8, 32)), metal, [-8, 3.72, -.15])
  fanRing.rotation.y = Math.PI / 2; fanRing.castShadow = false
  const scanMaterial = r.material(new MeshBasicMaterial({ color: '#b7d8e6', transparent: true, opacity: .23, depthWrite: false, toneMapped: false }))
  const scan = r.mesh(garage, r.geometry(new PlaneGeometry(.91, .012)), scanMaterial, [-5.7, 1.54, -4.86])
  scan.userData.dynamic = true; scan.castShadow = false
  function updateAmbient(timeMs: number) {
    fan.rotation.z = -timeMs * .00028
    scan.position.y = 1.41 + (.5 + .5 * Math.sin(timeMs * .00045)) * .47
  }
  function updateLabels(index: SceneProps['contentIndex'], locale: Locale, selectedProject: string | null) {
    for (const entry of index) if (entry.projectId === null) signs.get(entry.zoneId)?.setText(entry.label[locale])
    const projects = index.filter(entry => entry.zoneId === 'garage' && entry.projectId !== null)
    const selected = projects.find(entry => entry.projectId === selectedProject)
    const ordered = selected ? [selected, ...projects.filter(entry => entry !== selected)] : projects
    projectSigns.forEach((sign, i) => sign.setText(ordered[i]?.label[locale] ?? 'DRF-01', locale === 'pt' ? 'PROGRAMAS / PROJETO' : 'PROGRAMMES / PROJECT'))
    team.setText('DRF ENGINEERING', locale === 'pt' ? 'RECIFE / BRASIL · EQUIPE FICTÍCIA' : 'RECIFE / BRAZIL · FICTIONAL TEAM')
  }
  return { garage, updateLabels, updateAmbient }
}
