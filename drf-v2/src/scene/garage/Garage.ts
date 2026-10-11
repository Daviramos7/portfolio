import { CanvasTexture, CatmullRomCurve3, Group, MeshBasicMaterial, PlaneGeometry, TorusGeometry, TubeGeometry, Vector3 } from 'three'
import type { Camera } from 'three'
import type { Locale, SceneProps, ZoneId } from '../../contracts/index.ts'
import { createDRF01 } from '../car/DRF01.ts'
import type { Resources, Vec3 } from './resources.ts'
import { createProgrammeScreen } from './programmeScreen.ts'
import { createPersonalDetails } from './personalDetails.ts'

export function createGarage(r: Resources) {
  const garage = new Group(); garage.name = 'DRF-interior-workshop'
  const { carbon, floor, black, red, white, metal, panel, structure, polymer, light, taskLight, tire } = r.palette
  const screens: ReturnType<typeof createProgrammeScreen>[] = []
  const screen = (parent: Group, zone: ZoneId, size: readonly [number,number], position: Vec3) => {
    const display = createProgrammeScreen(r,parent,zone,size,position);screens.push(display);return display
  }
  const signs = new Map<ZoneId, ReturnType<Resources['sign']>>()
  function zoneSign(id: ZoneId, p: Vec3, rotation = 0) {
    const sign = r.sign(garage, '', [2.8, .7], p); sign.object.rotation.y = rotation; signs.set(id, sign)
  }
  // Fully enclosed interior; cameras remain below the roof and within the room.
  r.box(garage, [17, .18, 20], [0, -.1, 1.5], black)
  const floorTop = r.mesh(garage, r.geometry(new PlaneGeometry(17, 20)), floor, [0, -.007, 1.5])
  floorTop.rotation.x = -Math.PI / 2; floorTop.castShadow = false
  r.box(garage, [17, .22, 19], [0, 4.65, 2.4], black)
  for (const side of [-1, 1]) {
    r.box(garage, [.2, 4.6, 19], [side * 8.4, 2.3, 2.4], panel)
    r.box(garage, [.04, .22, 14.8], [side * 8.26, .55, .4], red)
    r.box(garage, [.045, .06, 14.8], [side * 8.24, 3.4, .4], metal)
    for (let z = -6; z <= 7; z += 2) {
      r.box(garage, [.15, 4.5, .12], [side * 8.18, 2.25, z], metal)
      r.box(garage, [.1, .08, 1.6], [side * 8.05, 3.82, z + .7], light)
    }
    r.box(garage, [side < 0 ? 1.01 : 3.85, 4.6, .24], [side < 0 ? -7.89 : 6.47, 2.3, -6.6], panel)
    r.box(garage, [.19, 4.35, .3], [side < 0 ? -7.32 : 4.48, 2.2, -6.4], metal)
    r.box(garage, [.055, 3.95, .055], [side < 0 ? -7.18 : 4.34, 2.2, -6.21], light)
  }
  // The asymmetric service opening clears the approved mobile sightline.
  // Existing REC/PE sign retains its location on a header-mounted bracket.
  r.rod(garage, [-4.48, 4.2, -6.4], [-4.48, 3.19, -6.2], .04, metal)
  r.box(garage, [17, .18, .5], [0, 4.43, -6.4], metal)
  r.box(garage, [11.6, .26, .24], [-1.42, 4.2, -6.39], black)
  // Roller shutter overhead, roof trusses and suspended lighting form repeated depth cues.
  for (let n = 0; n < 7; n++) r.box(garage, [11.6, .075, .23], [-1.42, 3.9 + n * .08, -6.42], metal)
  for (const z of [-5.5, -2.6, .3, 3.2, 6.1]) {
    r.box(garage, [16.7, .15, .15], [0, 4.32, z], structure)
    r.box(garage, [16.5, .1, .12], [0, 4.04, z], structure)
    for (let x = -7; x < 8; x += 2) r.rod(garage, [x, 4.04, z], [x + 1.2, 4.32, z], .026, structure)
    for (const side of [-1, 1]) {
      r.box(garage, [3.2, .09, .42], [side * 3.7, 3.95, z], black)
      r.box(garage, [2.95, .025, .28], [side * 3.7, 3.89, z], side === -1 && (z === .3 || z === 3.2) ? taskLight : light)
    }
  }
  for (const x of [-7.6, 7.6]) {
    r.rod(garage, [x, 4.02, -6], [x, 4.02, 7], .13, metal)
    for (let z = -5; z < 7; z += 2) r.rod(garage, [x, 4.03, z], [x, 4.42, z], .02, metal)
  }
  // Epoxy expansion joints, service bay outlines and grated drainage.
  for (const x of [-5.8, 5.8]) r.box(garage, [.016, .005, 15], [x, .001, 0], black)
  for (const z of [-4.8, 6.8]) r.box(garage, [16, .005, .016], [0, .001, z], black)
  for (const side of [-1, 1]) r.box(garage, [.045, .008, 7.8], [side * 2.65, .006, .15], white)
  for (const z of [-3.8, 4.1]) r.box(garage, [5.3, .008, .065], [0, .006, z], red)
  r.box(garage, [15, .04, .35], [0, -.01, -5.85], black)
  for (let x = -7; x <= 7; x += .18) r.box(garage, [.05, .02, .3], [x, .02, -5.85], metal)
  garage.add(createDRF01(r))

  // Cheap static contact patch; no live mirror, ray tracing or postprocess.
  const patchCanvas = document.createElement('canvas'); patchCanvas.width = patchCanvas.height = 128
  const patchContext = patchCanvas.getContext('2d')
  if (patchContext) {
    const fade = patchContext.createRadialGradient(64, 64, 14, 64, 64, 64)
    fade.addColorStop(0, 'rgba(3,5,8,.5)'); fade.addColorStop(1, 'rgba(3,5,8,0)')
    patchContext.fillStyle = fade; patchContext.fillRect(0, 0, 128, 128)
  }
  const patchMat = r.material(new MeshBasicMaterial({ map: r.texture(new CanvasTexture(patchCanvas)), transparent: true, depthWrite: false }))
  const contact = r.mesh(garage, r.geometry(new PlaneGeometry(3.8, 6.4)), patchMat, [0, .003, .05])
  contact.rotation.x = -Math.PI / 2; contact.castShadow = false
  // Portable inspection lamp with a supply cable routed within the maintenance bay.
  r.rod(garage, [-3.25, .05, 1.5], [-3.25, 1.6, 1.5], .025, metal)
  for (const [x, z] of [[-3.6, 1.25], [-2.9, 1.25], [-3.25, 1.9]])
    r.rod(garage, [-3.25, .3, 1.5], [x, .04, z], .022, black)
  r.box(garage, [.48, .26, .11], [-3.25, 1.6, 1.5], black)
  r.box(garage, [.4, .18, .015], [-3.25, 1.6, 1.565], taskLight)
  const cable = new CatmullRomCurve3([[-7.4, .03, .1], [-5.4, .03, .8], [-4.2, .03, 1.6], [-3.25, .03, 1.5]].map(p => new Vector3(...p)))
  r.mesh(garage, r.geometry(new TubeGeometry(cable, 24, .018, 6, false)), black)
  zoneSign('garage', [0, 3.44, -6.15])
  const team = r.sign(garage, 'DRF ENGINEERING', [3.5, .8], [-6.25, 3.4, -6.44])
  team.setText('DRF ENGINEERING', 'RECIFE / BRASIL · EQUIPE FICTÍCIA')

  // Telemetry: instruments, cable tray, rack, keyboards; no invented numerical results.
  const bench = new Group(); bench.position.set(-5.7, 0, -4.75)
  r.box(bench, [3.7, .95, .8], [0, .48, 0], polymer)
  r.box(bench, [3.9, .1, 1.12], [0, 1, .04], metal)
  r.box(bench,[2.92,1.52,.1],[0,1.87,-.23],polymer)
  screen(bench,'telemetry',[2.8,1.4],[0,1.87,-.167])
  r.box(bench,[.08,.3,.1],[0,1.16,-.23],metal)
  r.box(bench,[.7,.035,.25],[0,1.085,.3],carbon)
  r.rod(bench,[0,1.1,-.3],[0,.17,-.38],.013,black)
  // Socket tray and an insulated maintenance driver, kept below the display sightline.
  r.box(bench, [.5, .025, .3], [1.25, 1.08, .3], black)
  for (const x of [.03, .12, .21]) r.rod(bench, [1 + x, 1.1, .3], [1 + x, 1.16, .3], .025, metal)
  r.rod(bench, [.65, 1.1, .25], [.9, 1.1, .25], .02, metal)
  r.box(bench, [.13, .045, .06], [.62, 1.1, .25], red)
  garage.add(bench); zoneSign('telemetry', [-5.7, 3.03, -5.02])
  // Open, legible assembly bench: tubular feet and segregated component trays.
  // Kept on the right service aisle, below the pit-wall monitor sightline.
  const service=new Group();service.position.set(5.8,0,-1.2);service.name='component-assembly-bench'
  r.box(service,[2.5,.065,.85],[0,1.02,0],metal)
  for(const x of [-1.1,1.1])for(const z of [-.3,.3])r.rod(service,[x,.04,z],[x,1,z],.03,structure)
  for(const z of [-.3,.3])r.rod(service,[-1.1,.27,z],[1.1,.27,z],.025,structure)
  r.box(service,[1.7,.04,.56],[0,.27,0],polymer)
  for(const x of [-.75,0,.75]){
    r.box(service,[.55,.028,.42],[x,1.066,0],black)
    r.rod(service,[x-.15,1.11,0],[x+.15,1.11,0],.045,metal)
  }
  garage.add(service)
  r.box(garage, [.7, 2.05, .78], [-7.72, 1.025, -4.95], polymer)
  for (let y = .3; y < 2; y += .18) r.box(garage, [.53, .025, .025], [-7.72, y, -4.53], metal)

  // Pit wall on the other side of the opening.
  r.box(garage, [3.6, .95, 1], [5.75, .475, -4.65], polymer)
  r.box(garage, [3.8, .1, 1.16], [5.75, 1, -4.6], metal)
  r.box(garage,[2.92,1.52,.08],[5.75,1.87,-4.94],polymer)
  screen(garage,'pit-wall',[2.8,1.4],[5.75,1.87,-4.89])
  r.box(garage,[.08,.32,.1],[5.75,1.18,-4.95],metal)
  r.box(garage,[.7,.03,.27],[5.75,1.07,-4.42],black)
  zoneSign('pit-wall', [5.75, 3.03, -5.05])

  // Profile station on left wall, with original abstract Recife bridge and equipment.
  const profile = new Group(); profile.position.set(-7.9, 0, 2.1); profile.rotation.y = Math.PI / 2
  r.box(profile, [3.6, 2.55, .3], [0, 1.28, 0], polymer)
  for (const x of [-1.2, 0, 1.2]) {
    r.box(profile, [1.06, 2.3, .08], [x, 1.2, .2], polymer)
    r.box(profile, [.04, .25, .05], [x + .32, 1.23, .27], metal)
    for (let y = 2.15; y < 2.4; y += .06) r.box(profile, [.68, .012, .014], [x, y, .253], metal)
  }
  screen(profile,'driver-profile',[2.8,1.4],[0,1.75,.32])
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
  screen(strategy,'strategy-room',[3.52,1.83],[0,2.15,.084])
  r.box(strategy, [3.8, .14, 1.25], [0, .98, .82], metal)
  for (const x of [-1.55, 1.55]) r.box(strategy, [.12, .92, 1], [x, .46, .82], carbon)
  r.box(strategy, [.95, .035, .6], [0, 1.07, .82], black)
  garage.add(strategy); zoneSign('strategy-room', [7.66, 3.45, 1.9], -Math.PI / 2)

  // Real workshop scale: drawer chests, lift stands, spares, tool silhouettes and coiled hose.
  // Wall-mounted tool station: no freestanding board across the programme sightline.
  const tools = new Group(); tools.position.set(-8.05, 0, -.65); tools.rotation.y = Math.PI / 2
  const chest = new Group(); chest.position.set(0, 0, .45)
  r.box(chest, [1.6, .9, .7], [0, .56, 0], red)
  r.box(chest, [1.68, .08, .76], [0, 1.05, 0], metal)
  for (let y = .32; y < 1; y += .14) r.box(chest, [1.42, .035, .04], [0, y, .38], metal)
  for (const x of [-.62, .62]) for (const z of [-.24, .24]) r.rod(chest, [x, .09, z], [x, .22, z], .08, tire)
  tools.add(chest)
  r.box(tools, [2.1, 1.4, .08], [0, 2, 0], black)
  const wrenchHead = r.geometry(new TorusGeometry(.039,.009,6,12))
  for (let n = 0; n < 8; n++) {
    const x = -.8 + n * .22
    r.rod(tools, [x, 1.65, .07], [x, 2.1 + (n % 3) * .07, .07], .016, metal)
    if(n<4)r.mesh(tools,wrenchHead,metal,[x,2.15+(n%3)*.07,.07])
    else r.box(tools, [.07, .16, .055], [x, 1.7, .1], red)
  }
  garage.add(tools)
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
    r.sign(garage, '', [2.2, .4], [-8.045, 1.45, -3]),
    r.sign(garage, '', [2.2, .4], [-8.045, .98, -3]),
    r.sign(garage, '', [2.2, .4], [-8.045, .51, -3]),
  ]
  projectSigns.forEach((sign, index) => { sign.object.rotation.y = Math.PI / 2; sign.object.name = 'programme-display-' + index })
  r.box(garage, [.1, 1.42, 2.4], [-8.13, .98, -3], carbon)
  r.box(garage,[.1,1.25,2.5],[-8.12,2.3,-3],polymer)
  screen(garage,'garage',[2.4,1.2],[-8.045,2.3,-3]).object.rotation.y=Math.PI/2

  // Functional ventilation and a slow instrumentation sweep: the renderer owns their one clock.
  const fanAssembly = new Group(); fanAssembly.position.set(-8.03, 3.72, -.15); fanAssembly.rotation.y = Math.PI / 2
  const fan = new Group(); fanAssembly.add(fan)
  for (let n = 0; n < 5; n++) {
    const blade = r.box(fan, [.15, .43, .035], [0, .22, 0], metal)
    blade.position.set(Math.sin(n * Math.PI * 2 / 5) * .19, Math.cos(n * Math.PI * 2 / 5) * .19, 0)
    blade.rotation.z = -n * Math.PI * 2 / 5; blade.userData.dynamic = true; blade.castShadow = false
  }
  garage.add(fanAssembly)
  const personal=createPersonalDetails(r);garage.add(personal.root)
  const fanRing = r.mesh(garage, r.geometry(new TorusGeometry(.48, .05, 8, 32)), metal, [-8, 3.72, -.15])
  fanRing.rotation.y = Math.PI / 2; fanRing.castShadow = false
  const projected = new Vector3()
  function updateAmbient(timeMs: number, camera: Camera) {
    const inView = (point: Vector3) => { projected.copy(point).project(camera);return projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1.15&&Math.abs(projected.y)<1.15 }
    if(inView(fanAssembly.position))fan.rotation.z = -timeMs * .00028
    screens.forEach(display=>display.updateAmbient(timeMs,camera))
  }
  function updateLabels(index: SceneProps['contentIndex'], locale: Locale, selectedProject: string | null) {
    personal.updateLocale(locale)
    screens.forEach(display=>display.update(index,locale,selectedProject))
    for (const entry of index) if (entry.projectId === null) signs.get(entry.zoneId)?.setText(entry.label[locale])
    const projects = index.filter(entry => entry.zoneId === 'garage' && entry.projectId !== null)
    const selected = projects.find(entry => entry.projectId === selectedProject)
    const ordered = selected ? [selected, ...projects.filter(entry => entry !== selected)] : projects
    projectSigns.forEach((sign, i) => sign.setText(ordered[i]?.label[locale] ?? 'DRF-01', locale === 'pt' ? 'PROGRAMAS / PROJETO' : 'PROGRAMMES / PROJECT'))
    team.setText('DRF ENGINEERING', locale === 'pt' ? 'RECIFE / BRASIL · EQUIPE FICTÍCIA' : 'RECIFE / BRAZIL · FICTIONAL TEAM')
  }
  return { garage, updateLabels, updateAmbient, get screenUploads(){return screens.reduce((sum,screen)=>sum+screen.uploadVersion,0)} }
}
