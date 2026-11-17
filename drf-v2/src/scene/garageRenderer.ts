import { ACESFilmicToneMapping, BoxGeometry, Color, DirectionalLight, Fog, Group, HemisphereLight, Mesh, MeshBasicMaterial, PCFShadowMap, PerspectiveCamera, PointLight, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import type { CatmullRomCurve3, Group as SceneGroup, WebGLRenderTarget } from 'three'
import type { ExperienceState, SceneEvent, SceneProps, SceneHandle, ZoneId } from '../contracts/index.ts'
import { createResources } from './garage/resources.ts'
import { createGarage } from './garage/Garage.ts'
import { buildCameraPath, cameraEase, framings, hotspotVolumes, mobileFramings, programmeFramings, roomElevation } from './camera/framing.ts'
import { createTrackOpening } from './trackside/TrackOpening.ts'
import { createPassScheduler, canSchedulePass } from './trackside/scheduler.ts'
import type { TracksideConfig } from './trackside/scheduler.ts'
import { createTrackPass } from './trackside/TrackPass.ts'
import { createTrackAudio } from './trackside/audio.ts'
import { createWorkshopEnvironment } from './garage/environment.ts'
import { tracksidePose } from './trackside/preparation.ts'
import { personalDetailLayout } from './garage/personalDetails.ts'
import { cappedFrameMs, createDprGovernor, type FrameCadence } from './dprGovernor.ts'
import { createPitLevel, pitLevelHiddenFrom, setPitLevelQuality } from './garage/pitLevel.ts'
import { createCircuit } from './trackside/circuit.ts'
import { createSkyline, setSkylineQuality } from './trackside/skyline.ts'
import { estimateTextureBytes } from './textureBytes.ts'
import { setBrushedAnisotropy } from './garage/surfaceFinish.ts'
import { reportsReduction, screenScale, sunShadowMapSize, textAnisotropyFor } from './qualityDetail.ts'

export function clampHeroTooltip(button: {left:number;top:number;width:number;height:number}, label: {width:number;height:number}, free: {left:number;top:number;right:number;bottom:number}) {
  const preferred=button.left+button.width+label.width<=free.right?button.left+button.width:button.left-label.width
  return {
    left:Math.max(free.left,Math.min(preferred,free.right-label.width)),
    top:Math.max(free.top,Math.min(button.top+(button.height-label.height)/2,free.bottom-label.height)),
    fits:label.width<=free.right-free.left&&label.height<=free.bottom-free.top,
  }
}

type Transition = {
  sequence: number
  elapsedMs: number
  durationMs: number
  path: CatmullRomCurve3
  fromLookAt: Vector3
  toLookAt: Vector3
}
export type GarageRenderer = SceneHandle & {
  update: (state: ExperienceState, contentIndex: SceneProps['contentIndex']) => void
  dispose: () => void
}

export function createGarageRenderer(canvas: HTMLCanvasElement, onEvent: (event: SceneEvent) => void, config: TracksideConfig = {}): GarageRenderer {
  let renderer: WebGLRenderer | null = null
  let resizeObserver: ResizeObserver | null = null
  let disposed = false, failed = false, ready = false
  let frameId: number | null = null
  let state: ExperienceState | null = null
  let transition: Transition | null = null
  let latestSequence = -1, settledSequence = -1
  let previousIndex: SceneProps['contentIndex'] | null = null
  let previousLocale: ExperienceState['locale'] | null = null
  let previousProject: string | null = null
  let environmentTarget: WebGLRenderTarget | null = null
  let lastTimestamp: number | null = null, lastRenderedAt = 0, loopRenderedAt: number | null = null, ambientTimeMs = 0
  let mobileFrame = false, invalidated = true
  let renderedFrames = 0
  const dprGovernor = createDprGovernor(() => window.devicePixelRatio)
  const scheduler = createPassScheduler({ initialIntervalMs: [5000, 8000], ...config })
  const audio = createTrackAudio({ onUnavailable: () => onEvent({ type: 'AUDIO_STATUS', status: 'unavailable' }) })
  const audioForward = new Vector3()
  function publishAudio() {
    const snapshot = audio.diagnostics
    canvas.dataset.sceneAudioContext = snapshot.context
    canvas.dataset.sceneAudioAssets = String(snapshot.assets)
    canvas.dataset.sceneAudioPassStarts = String(snapshot.passStarts)
    canvas.dataset.sceneAudioPass = snapshot.passId ?? 'idle'
    canvas.dataset.sceneAudioVolume = String(snapshot.volume)
    canvas.dataset.sceneAudioBytes = String(snapshot.retainedBytes)
  }
  function requestAudioFromGesture() {
    return audio.requestAudioFromGesture().then(result => { publishAudio(); return result })
  }
  function muteAudio() { audio.muteAudio(); publishAudio() }
  function setAudioVolume(volume: number) { audio.setAudioVolume(volume); publishAudio() }
  let trackTimeMs = 0
  let pass: ReturnType<typeof createTrackPass> | null = null
  const resources = createResources(() => { if (!disposed) { invalidated = true; canvas.dataset.sceneScreenLayouts = JSON.stringify(garage?.screenLayouts ?? []); requestFrame() } })
  const scene = new Scene()
  // M16 4a: the technical room (garage, its lights, pick volumes and the camera) sits on the slab above the pit.
  // Framings stay room-local; only lookAt targets, audio and DOM anchors convert to world space.
  const room = new Group(); room.name = 'elevated-technical-room'; room.position.y = roomElevation
  room.updateMatrixWorld(true); scene.add(room)
  const worldLookAt = new Vector3(), listener = new Vector3()
  // Far plane past the fog's end: the race's entry and exit dissolve into fog instead of being clipped.
  const camera = new PerspectiveCamera(46, 1, .1, 130)
  const lookAt = new Vector3(...framings.garage.lookAt)
  const destination = new Vector3(), target = new Vector3()
  const sun = new DirectionalLight('#d8edff', 2)
  const workshopLight = new PointLight('#ffdfb8', 65, 12, 2)
  const benchLight = new PointLight('#ffe1bd', 28, 8, 2)
  const rimLight = new PointLight('#c5e7ff', 105, 16, 2)
  let garage: ReturnType<typeof createGarage> | null = null
  let reportedReduced = false
  let opening: ReturnType<typeof createTrackOpening> | null = null
  let pitLevel: SceneGroup | null = null, skyline: SceneGroup | null = null
  const raycaster = new Raycaster(), pointer = new Vector2()
  const pickVolumes: Mesh[] = []
  const availableZones = new Set<ZoneId>()

  function cancelFrame() {
    if (frameId !== null) cancelAnimationFrame(frameId)
    frameId = null
  }
  function dispose() {
    if (disposed) return
    disposed = true
    cancelFrame()
    transition = null
    lastTimestamp = null; loopRenderedAt = null
    resizeObserver?.disconnect()
    canvas.removeEventListener('webglcontextlost', contextLost)
    canvas.removeEventListener('click', selectHotspot)
    canvas.removeEventListener('pointermove', hoverHotspot)
    canvas.removeEventListener('pointerleave', clearHover)
    canvas.style.cursor = ''
    if (import.meta.env.DEV) delete (canvas as HTMLCanvasElement & { drfDebugTrackside?: unknown }).drfDebugTrackside
    scheduler.reset(); pass?.dispose(); garage?.disposeProps(); audio.dispose()
    opening?.restore()
    scene.environment = null
    environmentTarget?.dispose()
    scene.clear()
    sun.shadow.map?.dispose()
    renderer?.dispose()
    resources.dispose()
    renderer = null
  }
  function fail(status: 'unavailable' | 'error') {
    if (failed || disposed) return
    failed = true
    dispose()
    onEvent({ type: 'SCENE_STATUS', status })
  }
  function contextLost(event: Event) {
    event.preventDefault()
    // Terminal for this attempt. The Lead's boundary exposes manual retry.
    fail('unavailable')
  }
  function active() { return !disposed && !failed && state?.mode === 'immersive' && state.documentVisible }
  function ambientActive() { return active() && state?.ambientEnabled && !state.reducedMotion && !state.panelOpen }
  function pick(event: MouseEvent): ZoneId | null {
    if (!active() || !ready || state?.panelOpen) return null
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return null
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(pickVolumes, false)[0]
    return hit ? hit.object.userData.zoneId as ZoneId : null
  }
  function selectHotspot(event: MouseEvent) {
    const zoneId = pick(event)
    if (zoneId && availableZones.has(zoneId)) onEvent({ type: 'SELECT_TARGET', target: { zoneId, projectId: null } })
  }
  function hoverHotspot(event: PointerEvent) { canvas.style.cursor = pick(event) ? 'pointer' : '' }
  function clearHover() { canvas.style.cursor = '' }

  function resize() {
    if (!renderer || !state || !active()) return
    invalidated = true
    const width = canvas.clientWidth, height = canvas.clientHeight
    if (width < 1 || height < 1) return
    dprGovernor.setLevel(state.qualityLevel)
    dprGovernor.setQuality(state.quality)
    dprGovernor.interrupt()
    const dpr = dprGovernor.dpr
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = camera.aspect < .42 ? 74 : camera.aspect < 1 ? 63 : 43
    const nextMobile = camera.aspect < 1
    if (nextMobile !== mobileFrame) {
      mobileFrame = nextMobile
      moveCamera(!ready || state.reducedMotion)
    }
    camera.updateProjectionMatrix()
    canvas.dataset.sceneDpr = String(dpr)
    canvas.dataset.sceneDprState = dprGovernor.state
    requestFrame()
  }
  function render(nowMs: number) {
    frameId = null
    if (!renderer || !state || !active()) return
    try {
      // This RAF timestamp is the only future Trackside monotonic clock as well.
      const delta = lastTimestamp === null ? 0 : Math.max(0, Math.min(100, nowMs - lastTimestamp))
      lastTimestamp = nowMs
      trackTimeMs += delta
      const current = transition
      if (current && current.sequence === state.navigationSeq) {
        current.elapsedMs += delta
        const progress = Math.min(1, current.elapsedMs / current.durationMs)
        const eased = cameraEase(progress)
        camera.position.copy(current.path.getPointAt(eased))
        lookAt.lerpVectors(current.fromLookAt, current.toLookAt, eased)
        if (progress >= 1) transition = null
      }
      const eligible = canSchedulePass(state, ready && !transition && settledSequence === state.navigationSeq)
      const snapshot = scheduler.tick(trackTimeMs, state, ready && !transition && settledSequence === state.navigationSeq)
      pass?.update(snapshot.event, snapshot.progress, snapshot.visual)
      camera.getWorldDirection(audioForward)
      const audioPosition = snapshot.event ? tracksidePose(snapshot.event, snapshot.progress).position : [0, 0, 0]
      audio.updatePass(snapshot.event, snapshot.progress, snapshot.started,
        audioPosition,
        camera.getWorldPosition(listener).toArray(), audioForward.toArray())
      publishAudio()
      canvas.dataset.sceneReducedMotion = String(state.reducedMotion)
      canvas.dataset.sceneAmbientEnabled = String(state.ambientEnabled)
      canvas.dataset.scenePassX = pass?.vehicle.position.x.toFixed(3) ?? '0'
      canvas.dataset.scenePassZ = pass?.vehicle.position.z.toFixed(3) ?? '0'
      canvas.dataset.scenePass = snapshot.event?.id ?? 'idle'
      canvas.dataset.scenePassProgress = snapshot.event ? snapshot.progress.toFixed(4) : '0'
      canvas.dataset.scenePassVisual = String(Boolean(snapshot.event && snapshot.visual))
      canvas.dataset.scenePassNextMs = String(snapshot.nextMs ?? '')
      canvas.dataset.sceneClockMs = String(Math.round(trackTimeMs))
      canvas.dataset.sceneTrackModel = pass?.modelStatus ?? 'fallback'
      canvas.dataset.sceneHandgripModel = garage?.handgripStatus ?? 'fallback'
      const animate = ambientActive()
      if (animate) { ambientTimeMs += delta; garage?.updateAmbient(ambientTimeMs, camera) }
      if (!invalidated && ready && !current && !animate && eligible && state.reducedMotion) { loopRenderedAt = null; requestFrame(); return }
      // Idle ambience is capped at 30 rendered fps; camera travel retains native pacing.
      const cadence: FrameCadence = !current && ready && (animate || eligible) ? 'capped' : 'native'
      if (cadence === 'capped' && nowMs - lastRenderedAt < cappedFrameMs) { requestFrame(); return }
      // Only rendered frames of one continuous loop measure pacing; a restarted loop has no interval yet.
      if (loopRenderedAt !== null && dprGovernor.sample(nowMs - loopRenderedAt, cadence)) resize()
      canvas.dataset.sceneDprState = dprGovernor.state
      const reduced = reportsReduction(state.qualityLevel) && dprGovernor.state !== 'full'
      if (reduced !== state.qualityReduced && reduced !== reportedReduced) { reportedReduced = reduced; onEvent({ type: 'QUALITY_REDUCED', reduced }) }
      loopRenderedAt = nowMs
      camera.lookAt(room.localToWorld(worldLookAt.copy(lookAt)))
      if (pitLevel) pitLevel.visible = !pitLevelHiddenFrom(camera.position)
      renderer.render(scene, camera)
      canvas.dataset.sceneRenderedFrames = String(++renderedFrames)
      canvas.dataset.sceneFrameTimestamp = nowMs.toFixed(3)
      canvas.dataset.sceneScreenUploads = String(garage?.screenUploads ?? 0)
      invalidated = false
      lastRenderedAt = nowMs
      canvas.dataset.sceneDrawCalls = String(renderer.info.render.calls)
      canvas.dataset.sceneTriangles = String(renderer.info.render.triangles)
      canvas.dataset.sceneGeometryCount = String(renderer.info.memory.geometries)
      canvas.dataset.sceneTextureCount = String(renderer.info.memory.textures)
      // Evidence only: estimated GPU bytes of the scene-owned textures that were actually uploaded.
      if (import.meta.env.DEV) { const gpu = renderer.properties; canvas.dataset.sceneTextureBytes = String(estimateTextureBytes(scene, map => gpu.has(map) && Boolean((gpu.get(map) as { __webglTexture?: unknown }).__webglTexture)).bytes) }
      canvas.dataset.sceneCameraQuaternion = camera.quaternion.toArray().map(n => n.toFixed(5)).join(',')
      canvas.dataset.sceneCameraPosition = camera.position.toArray().map(n => n.toFixed(4)).join(',')
      canvas.dataset.sceneAmbient = animate ? 'running' : 'paused'
      canvas.dataset.sceneAmbientMs = String(Math.round(ambientTimeMs))
      // Local scene-owned anchors only: never scroll, focus or move the UI's panels.
      const projected = new Vector3()
      for (const [id, volume] of Object.entries(hotspotVolumes)) {
        const button = canvas.parentElement?.parentElement?.querySelector<HTMLElement>('[data-scene-hotspot="' + id + '"]')
        if (!button) continue
        const heroGarage=id==='garage'&&state.target.zoneId==='garage'&&state.target.projectId===null
        if(id==='garage')button.dataset.sceneHeroAnchor=String(heroGarage)
        const rec=heroGarage?personalDetailLayout.find(detail=>detail.id==='rec-pe'):undefined
        projected.set(...(rec?.position??volume.anchor))
        if(rec)projected.x+=1.15 // beside the authored plaque, not over its lettering
        room.localToWorld(projected).project(camera)
        const inside = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < .88 && Math.abs(projected.y) < .76
        button.style.visibility = inside ? '' : 'hidden'
        button.style.left = ((projected.x + 1) * 50) + '%'
        button.style.top = ((1 - projected.y) * 50) + '%'
        const label = button.querySelector<HTMLElement>('.drf-scene__hotspot-label')
        if (label && inside) {
          const bounds = button.getBoundingClientRect(), stage = canvas.getBoundingClientRect()
          const labelWidth = label.getBoundingClientRect().width, left = bounds.left - stage.left
          const preferred = left + bounds.width + labelWidth <= stage.width - 8 ? bounds.width : -labelWidth
          const offset = Math.max(8 - left, Math.min(preferred, stage.width - 8 - left - labelWidth))
          button.style.setProperty('--scene-label-offset', offset + 'px')
          if(heroGarage){
            const header=document.querySelector('.drf-hud-header')?.getBoundingClientRect()
            const showcase=document.querySelector('.drf-showcase')?.getBoundingClientRect()
            const free={left:stage.left+8,right:stage.right-8,top:Math.max(stage.top,header?.bottom??stage.top)+8,bottom:Math.min(stage.bottom,showcase?.top??stage.bottom)-8}
            const placed=clampHeroTooltip(bounds,label.getBoundingClientRect(),free)
            button.style.setProperty('--scene-label-offset',(placed.left-bounds.left)+'px')
            button.style.setProperty('--scene-label-top',(placed.top-bounds.top)+'px')
            button.style.setProperty('--scene-label-shift','0%')
          }else{
            button.style.removeProperty('--scene-label-top');button.style.removeProperty('--scene-label-shift')
          }
        }
      }
      if (!ready) {
        ready = true
        onEvent({ type: 'SCENE_STATUS', status: 'ready' })
      }
      if (!transition && settledSequence !== state.navigationSeq) {
        settledSequence = state.navigationSeq
        canvas.dataset.sceneCameraSeq = String(settledSequence)
        onEvent({ type: 'CAMERA_SETTLED', navigationSeq: settledSequence })
      }
      if (transition || animate || eligible) requestFrame()
      else { lastTimestamp = null; loopRenderedAt = null; dprGovernor.interrupt() }
    } catch { fail('error') }
  }
  function requestFrame() {
    if (frameId === null && active()) frameId = requestAnimationFrame(render)
  }
  function moveCamera(instant: boolean) {
    if (!state) return
    const framing = state.target.zoneId === 'garage' && state.target.projectId !== null
      ? programmeFramings[mobileFrame ? 'mobile' : 'desktop']
      : (mobileFrame ? mobileFramings : framings)[state.target.zoneId]
    destination.set(...framing.position); target.set(...framing.lookAt)
    if (instant) { transition = null; camera.position.copy(destination); lookAt.copy(target) }
    else if (camera.position.distanceTo(destination) < .02 && lookAt.distanceTo(target) < .02) transition = null
    else transition = { sequence: state.navigationSeq, elapsedMs: 0,
      ...buildCameraPath(camera.position, destination), fromLookAt: lookAt.clone(), toLookAt: target.clone() }
  }

  if (import.meta.env.DEV) {
    (canvas as HTMLCanvasElement & { drfDebugTrackside?: unknown }).drfDebugTrackside = { audio: () => audio.diagnostics,
      solo: (layer: 'ventilation' | 'workshop' | 'pass' | null) => audio.debugSolo(layer),
      // Evidence only (world coordinates): looks at the exterior from outside the room. Never shipped.
      view: (position: readonly [number, number, number], target: readonly [number, number, number]) => {
        transition = null; camera.position.set(position[0], position[1] - roomElevation, position[2])
        lookAt.set(target[0], target[1] - roomElevation, target[2]); invalidated = true; requestFrame(); return true
      },
      trigger: (direction: 'left-to-right' | 'right-to-left' = 'left-to-right') => {
      if (!state || state.reducedMotion || !canSchedulePass(state, ready && !transition && settledSequence === state.navigationSeq)) return false
      if (!scheduler.requestSoon(trackTimeMs, direction)) return false
      requestFrame(); return true
    } }
  }
  onEvent({ type: 'SCENE_STATUS', status: 'loading' })
  try {
    // Check actual WebGL2 availability without letting Three log a thrown creation error.
    // Native multisampling also smooths the thin workshop structure at DPR 1.
    // The quality policy (dprGovernor) caps both at 1.5; low falls back to 1 under sustained load.
    const msaa = true
    const context = canvas.getContext('webgl2', { alpha: false, antialias: msaa, powerPreference: 'low-power' })
    if (!context) {
      fail('unavailable')
      return { update: () => {}, dispose, requestAudioFromGesture, muteAudio, setAudioVolume }
    }
    canvas.addEventListener('webglcontextlost', contextLost)
    canvas.addEventListener('click', selectHotspot)
    canvas.addEventListener('pointermove', hoverHotspot)
    canvas.addEventListener('pointerleave', clearHover)
    renderer = new WebGLRenderer({ canvas, context, antialias: msaa, alpha: false })
    canvas.dataset.sceneMsaa = String(context.getContextAttributes()?.antialias ?? false)
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.type = PCFShadowMap
    scene.background = new Color('#a6bdc9')
    // M16 4a: pushed back so the straight at z -52 (≈ 60 m from the room) reads through light haze.
    scene.fog = new Fog('#a6bdc9', 50, 125)
    environmentTarget = createWorkshopEnvironment(renderer)
    scene.environment = environmentTarget.texture
    scene.environmentIntensity = .55
    scene.add(new HemisphereLight('#b4c5de', '#28202a', .4))
    sun.position.set(1.5, 6, -12)
    sun.target.position.set(0, .5, 0); room.add(sun.target)
    sun.shadow.intensity = .45
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 30 })
    sun.shadow.bias = -.0005
    sun.shadow.normalBias = .04
    room.add(sun)
    workshopLight.position.set(-3.25, 1.6, 1.5)
    benchLight.position.set(-6.2, 2.5, -2.8)
    rimLight.position.set(2.6, 2.6, -3.5)
    room.add(workshopLight, benchLight, rimLight)
    // Applied before the garage builds its canvas text, so first upload already uses it (the first update applies the level).
    const textAnisotropy = textAnisotropyFor('auto', renderer.capabilities.getMaxAnisotropy())
    resources.setTextAnisotropy(textAnisotropy); canvas.dataset.sceneTextAnisotropy = String(textAnisotropy)
    garage = createGarage(resources)
    opening = createTrackOpening(resources)
    pass = createTrackPass(resources, opening)
    scene.add(pass.vehicle)
    void pass.load().then(()=>{if(!disposed){invalidated=true;requestFrame()}})
    resources.batch(garage.garage)
    // Optional prop models arrive after the static batches; the procedural stand-ins cover the wait and any failure.
    void garage.loadProps().then(()=>{if(!disposed){invalidated=true;requestFrame()}})
    resources.batch(opening.track)
    // M16 4b: boxes, circuit dressing and horizon are built instanced/merged, so they skip the generic batcher.
    pitLevel = createPitLevel(resources); skyline = createSkyline(resources)
    room.add(garage.garage, opening.anchors)
    scene.add(opening.track, pitLevel, createCircuit(resources), skyline)
    canvas.dataset.sceneRoomElevation = String(roomElevation)
    const pickShape = resources.geometry(new BoxGeometry(1, 1, 1))
    const pickMaterial = resources.material(new MeshBasicMaterial({ visible: false }))
    for (const [zoneId, volume] of Object.entries(hotspotVolumes)) {
      const mesh = new Mesh(pickShape, pickMaterial)
      mesh.position.set(...volume.position)
      mesh.scale.set(...volume.size)
      mesh.userData.zoneId = zoneId
      mesh.name = `hotspot-${zoneId}`
      room.add(mesh)
      pickVolumes.push(mesh)
    }
    camera.position.set(...framings.garage.position)
    room.add(camera)
    camera.lookAt(room.localToWorld(worldLookAt.copy(lookAt)))
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
  } catch { fail('error') }

  return {
    requestAudioFromGesture, muteAudio, setAudioVolume,
    update(nextState, index) {
      if (disposed || failed || !renderer || !garage) return
      // An old delivery must never supersede a newer camera request.
      if (nextState.navigationSeq < latestSequence) return
      const previous = state
      invalidated = true
      state = nextState
      audio.update(state)
      audio.setAudioVolume(state.audioVolume)
      if (state.audio === 'off' || state.audio === 'unavailable') audio.muteAudio()
      if (previousIndex !== index || previousLocale !== state.locale || previousProject !== state.target.projectId) {
        availableZones.clear()
        for (const entry of index) if (entry.projectId === null) availableZones.add(entry.zoneId)
        garage.updateLabels(index, state.locale, state.target.projectId)
        canvas.dataset.sceneScreenLayouts = JSON.stringify(garage.screenLayouts)
        previousIndex = index
        previousLocale = state.locale
        previousProject = state.target.projectId
      }
      if (previous?.qualityLevel !== state.qualityLevel) {
        // Fila 17b: level detail (screen texels, text anisotropy, sun shadow map); DPR follows in resize().
        const level = state.qualityLevel, anisotropy = textAnisotropyFor(level, renderer.capabilities.getMaxAnisotropy())
        resources.setTextAnisotropy(anisotropy); canvas.dataset.sceneTextAnisotropy = String(anisotropy)
        garage?.setScreenScale(screenScale[level])
        canvas.dataset.sceneScreenResolution = (garage?.screenResolution ?? [0, 0]).join('x')
        const edge = sunShadowMapSize[level]
        if (sun.shadow.mapSize.x !== edge) { sun.shadow.mapSize.set(edge, edge); sun.shadow.map?.dispose(); sun.shadow.map = null; renderer.shadowMap.needsUpdate = true }
        canvas.dataset.sceneQualityLevel = level
        reportedReduced = false
        if (previous) resize()
      }
      if (previous?.quality !== state.quality) {
        const shadows = state.quality === 'balanced'
        // Design §4: low drops the box props and keeps one horizon plane.
        if (pitLevel) setPitLevelQuality(pitLevel, state.quality)
        if (skyline) setSkylineQuality(skyline, state.quality)
        canvas.dataset.sceneQuality = state.quality
        renderer.shadowMap.enabled = shadows
        renderer.shadowMap.needsUpdate = shadows
        renderer.shadowMap.autoUpdate = false
        workshopLight.visible = true
        benchLight.visible = shadows
        rimLight.visible = shadows
        setBrushedAnisotropy(resources.palette.metal, shadows)
        resize()
      }
      if (previous && previous.reducedMotion !== state.reducedMotion) { scheduler.reset(); pass?.restore() }
      const sequenceChanged = latestSequence !== state.navigationSeq
      const instant = !previous || state.reducedMotion
      if (sequenceChanged || (instant && transition)) {
        latestSequence = state.navigationSeq
        scheduler.reset(); pass?.restore()
        opening?.restore()
        moveCamera(instant)
      }
      if (!canSchedulePass(state, ready && !transition && settledSequence === state.navigationSeq)) {
        audio.cancelPass()
        scheduler.reset(); pass?.restore()
        canvas.dataset.scenePass = 'idle'; canvas.dataset.scenePassVisual = 'false'
        canvas.dataset.scenePassProgress = '0'; canvas.dataset.scenePassNextMs = ''
      }
      if (!active()) { cancelFrame(); lastTimestamp = null; loopRenderedAt = null; dprGovernor.interrupt(); opening?.restore(); return }
      if (!previous?.documentVisible) resize()
      requestFrame()
    },
    dispose,
  }
}
