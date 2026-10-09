import { ACESFilmicToneMapping, BoxGeometry, Color, DirectionalLight, Fog, HemisphereLight, Mesh, MeshBasicMaterial, PCFShadowMap, PerspectiveCamera, PointLight, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import type { ExperienceState, SceneEvent, SceneProps, ZoneId } from '../contracts/index.ts'
import { createResources } from './garage/resources.ts'
import { createGarage } from './garage/Garage.ts'
import { cameraDurationMs, cameraEase, framings, hotspotVolumes } from './camera/framing.ts'
import { createTrackOpening } from './trackside/TrackOpening.ts'

type Transition = {
  sequence: number
  startMs: number
  fromPosition: Vector3
  fromLookAt: Vector3
  toPosition: Vector3
  toLookAt: Vector3
}
export type GarageRenderer = {
  update: (state: ExperienceState, contentIndex: SceneProps['contentIndex']) => void
  dispose: () => void
}

export function createGarageRenderer(canvas: HTMLCanvasElement, onEvent: (event: SceneEvent) => void): GarageRenderer {
  let renderer: WebGLRenderer | null = null
  let resizeObserver: ResizeObserver | null = null
  let disposed = false, failed = false, ready = false
  let frameId: number | null = null
  let state: ExperienceState | null = null
  let transition: Transition | null = null
  let latestSequence = -1, settledSequence = -1
  let previousIndex: SceneProps['contentIndex'] | null = null
  let previousLocale: ExperienceState['locale'] | null = null
  const resources = createResources()
  const scene = new Scene()
  const camera = new PerspectiveCamera(46, 1, .1, 85)
  const lookAt = new Vector3(...framings.garage.lookAt)
  const destination = new Vector3(), target = new Vector3()
  const sun = new DirectionalLight('#edf2fa', 3)
  const workshopLight = new PointLight('#f3f5ff', 32, 18, 2)
  const redBounce = new PointLight('#b32441', 16, 12, 2)
  let garage: ReturnType<typeof createGarage> | null = null
  let opening: ReturnType<typeof createTrackOpening> | null = null
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
    resizeObserver?.disconnect()
    canvas.removeEventListener('webglcontextlost', contextLost)
    canvas.removeEventListener('click', selectHotspot)
    canvas.removeEventListener('pointermove', hoverHotspot)
    canvas.removeEventListener('pointerleave', clearHover)
    canvas.style.cursor = ''
    opening?.restore()
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
    const width = canvas.clientWidth, height = canvas.clientHeight
    if (width < 1 || height < 1) return
    const dpr = Math.min(window.devicePixelRatio || 1, state.quality === 'low' ? 1 : 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = camera.aspect < 1 ? 66 : 46
    camera.updateProjectionMatrix()
    canvas.dataset.sceneDpr = String(dpr)
    requestFrame()
  }
  function render(nowMs: number) {
    frameId = null
    if (!renderer || !state || !active()) return
    try {
      // This RAF timestamp is the only future Trackside monotonic clock as well.
      const current = transition
      if (current && current.sequence === state.navigationSeq) {
        const progress = Math.min(1, (nowMs - current.startMs) / cameraDurationMs)
        const eased = cameraEase(progress)
        camera.position.lerpVectors(current.fromPosition, current.toPosition, eased)
        lookAt.lerpVectors(current.fromLookAt, current.toLookAt, eased)
        if (progress >= 1) transition = null
      }
      camera.lookAt(lookAt)
      renderer.render(scene, camera)
      canvas.dataset.sceneDrawCalls = String(renderer.info.render.calls)
      canvas.dataset.sceneTriangles = String(renderer.info.render.triangles)
      if (!ready) {
        ready = true
        onEvent({ type: 'SCENE_STATUS', status: 'ready' })
      }
      if (!transition && settledSequence !== state.navigationSeq) {
        settledSequence = state.navigationSeq
        canvas.dataset.sceneCameraSeq = String(settledSequence)
        onEvent({ type: 'CAMERA_SETTLED', navigationSeq: settledSequence })
      }
      if (transition) requestFrame()
    } catch { fail('error') }
  }
  function requestFrame() {
    if (frameId === null && active()) frameId = requestAnimationFrame(render)
  }

  onEvent({ type: 'SCENE_STATUS', status: 'loading' })
  try {
    // Check actual WebGL2 availability without letting Three log a thrown creation error.
    const context = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' })
    if (!context) {
      fail('unavailable')
      return { update: () => {}, dispose }
    }
    canvas.addEventListener('webglcontextlost', contextLost)
    canvas.addEventListener('click', selectHotspot)
    canvas.addEventListener('pointermove', hoverHotspot)
    canvas.addEventListener('pointerleave', clearHover)
    renderer = new WebGLRenderer({ canvas, context, antialias: false, alpha: false })
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.shadowMap.type = PCFShadowMap
    scene.background = new Color('#343f4f')
    scene.fog = new Fog('#343f4f', 26, 65)
    scene.add(new HemisphereLight('#c6d9ee', '#333138', 1.65))
    sun.position.set(-4, 10, 7)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 30 })
    sun.shadow.bias = -.0005
    sun.shadow.normalBias = .04
    scene.add(sun)
    workshopLight.position.set(-3, 4.5, -2)
    redBounce.position.set(3, 2.5, 3)
    scene.add(workshopLight, redBounce)
    garage = createGarage(resources)
    opening = createTrackOpening(resources)
    resources.batch(garage.garage)
    resources.batch(opening.track)
    scene.add(garage.garage, opening.track, opening.anchors)
    const pickShape = resources.geometry(new BoxGeometry(1, 1, 1))
    const pickMaterial = resources.material(new MeshBasicMaterial({ visible: false }))
    for (const [zoneId, volume] of Object.entries(hotspotVolumes)) {
      const mesh = new Mesh(pickShape, pickMaterial)
      mesh.position.set(...volume.position)
      mesh.scale.set(...volume.size)
      mesh.userData.zoneId = zoneId
      mesh.name = `hotspot-${zoneId}`
      scene.add(mesh)
      pickVolumes.push(mesh)
    }
    camera.position.set(...framings.garage.position)
    camera.lookAt(lookAt)
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
  } catch { fail('error') }

  return {
    update(nextState, index) {
      if (disposed || failed || !renderer || !garage) return
      // An old delivery must never supersede a newer camera request.
      if (nextState.navigationSeq < latestSequence) return
      const previous = state
      state = nextState
      if (previousIndex !== index || previousLocale !== state.locale) {
        availableZones.clear()
        for (const entry of index) if (entry.projectId === null) availableZones.add(entry.zoneId)
        garage.updateLabels(index, state.locale)
        previousIndex = index
        previousLocale = state.locale
      }
      if (previous?.quality !== state.quality) {
        const shadows = state.quality === 'balanced'
        renderer.shadowMap.enabled = shadows
        renderer.shadowMap.needsUpdate = shadows
        renderer.shadowMap.autoUpdate = false
        workshopLight.visible = shadows
        redBounce.visible = shadows
        resize()
      }
      const sequenceChanged = latestSequence !== state.navigationSeq
      const instant = !previous || state.reducedMotion || state.panelOpen || !state.documentVisible || state.mode !== 'immersive'
      if (sequenceChanged || (instant && transition)) {
        latestSequence = state.navigationSeq
        const framing = framings[state.target.zoneId]
        destination.set(...framing.position)
        target.set(...framing.lookAt)
        opening?.restore()
        if (instant) {
          transition = null
          camera.position.copy(destination)
          lookAt.copy(target)
        } else {
          transition = {
            sequence: state.navigationSeq, startMs: performance.now(),
            fromPosition: camera.position.clone(), fromLookAt: lookAt.clone(),
            toPosition: destination.clone(), toLookAt: target.clone(),
          }
        }
      }
      if (!active()) { cancelFrame(); opening?.restore(); return }
      if (!previous?.documentVisible) resize()
      requestFrame()
    },
    dispose,
  }
}
